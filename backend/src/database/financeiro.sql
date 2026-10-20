-- Integração financeira incremental. Execute somente em um banco já atualizado
-- com as tabelas de vendas, OS, estoque e funcionários.
BEGIN;

CREATE TABLE IF NOT EXISTS sapataria.lancamentos_financeiros (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria text NOT NULL CHECK (length(trim(categoria)) > 0 AND length(categoria) <= 80),
  descricao text NOT NULL CHECK (length(trim(descricao)) > 0 AND length(descricao) <= 500),
  valor_total numeric NOT NULL CHECK (valor_total >= 0 AND valor_total < 'Infinity'::numeric AND valor_total = round(valor_total, 2)),
  origem_tipo text,
  origem_id integer,
  estorno_de_id integer REFERENCES sapataria.lancamentos_financeiros(id),
  motivo_estorno text,
  criado_por integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lancamento_origem_valida CHECK ((origem_tipo IS NULL AND origem_id IS NULL) OR (origem_tipo IS NOT NULL AND origem_id IS NOT NULL)),
  CONSTRAINT lancamento_estorno_valido CHECK ((estorno_de_id IS NULL AND motivo_estorno IS NULL) OR (estorno_de_id IS NOT NULL AND length(trim(motivo_estorno)) > 0))
);

CREATE INDEX IF NOT EXISTS lancamentos_financeiros_criado_em_idx
  ON sapataria.lancamentos_financeiros (criado_em DESC, id DESC);
CREATE INDEX IF NOT EXISTS lancamentos_financeiros_origem_idx
  ON sapataria.lancamentos_financeiros (origem_tipo, origem_id);

CREATE TABLE IF NOT EXISTS sapataria.parcelas_financeiras (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lancamento_id integer NOT NULL REFERENCES sapataria.lancamentos_financeiros(id) ON DELETE CASCADE,
  numero integer NOT NULL CHECK (numero > 0),
  total_parcelas integer NOT NULL CHECK (total_parcelas > 0),
  valor numeric NOT NULL CHECK (valor > 0 AND valor < 'Infinity'::numeric AND valor = round(valor, 2)),
  vencimento date NOT NULL,
  UNIQUE (lancamento_id, numero),
  CONSTRAINT parcela_numero_valido CHECK (numero <= total_parcelas)
);

CREATE INDEX IF NOT EXISTS parcelas_financeiras_vencimento_idx
  ON sapataria.parcelas_financeiras (vencimento, id);

CREATE TABLE IF NOT EXISTS sapataria.pagamentos_financeiros (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parcela_id integer NOT NULL REFERENCES sapataria.parcelas_financeiras(id) ON DELETE CASCADE,
  valor numeric NOT NULL CHECK (valor > 0 AND valor < 'Infinity'::numeric AND valor = round(valor, 2)),
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'dinheiro')),
  pago_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  criado_por integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS pagamentos_financeiros_pago_em_idx
  ON sapataria.pagamentos_financeiros (pago_em DESC, id DESC);
CREATE INDEX IF NOT EXISTS pagamentos_financeiros_parcela_idx
  ON sapataria.pagamentos_financeiros (parcela_id);

ALTER TABLE sapataria.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS custo_unitario numeric,
  ADD COLUMN IF NOT EXISTS custo_total numeric;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimentos_custo_valido' AND conrelid = 'sapataria.movimentacoes_estoque'::regclass) THEN
    ALTER TABLE sapataria.movimentacoes_estoque ADD CONSTRAINT movimentos_custo_valido CHECK (
      (custo_unitario IS NULL OR (custo_unitario >= 0 AND custo_unitario < 'Infinity'::numeric AND custo_unitario = round(custo_unitario, 2))) AND
      (custo_total IS NULL OR (custo_total >= 0 AND custo_total < 'Infinity'::numeric AND custo_total = round(custo_total, 2)))
    );
  END IF;
END $$;

-- Compatibilidade: transforma registros existentes em lançamentos sem duplicar
-- dados. Vendas existentes são consideradas pagas porque a API anterior exigia
-- forma de pagamento; OS e compras permanecem pendentes até um pagamento real.
DO $$
DECLARE registro RECORD; lancamento_id integer; parcela_id integer; categoria text; total numeric;
BEGIN
  FOR registro IN SELECT v.* FROM sapataria.vendas v LOOP
    IF NOT EXISTS (SELECT 1 FROM sapataria.lancamentos_financeiros WHERE origem_tipo='venda' AND origem_id=registro.id AND estorno_de_id IS NULL) THEN
      INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por,criado_em)
      VALUES ('entrada','venda',format('Venda #%s', registro.id),registro.total,'venda',registro.id,registro.vendedor_id,registro.data)
      RETURNING id INTO lancamento_id;
      IF registro.total > 0 THEN
        INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
        VALUES (lancamento_id,1,1,registro.total,(registro.data AT TIME ZONE 'America/Sao_Paulo')::date) RETURNING id INTO parcela_id;
        INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,pago_em,criado_por)
        VALUES (parcela_id,registro.total,registro.forma_pagamento,registro.data,registro.vendedor_id);
      END IF;
    END IF;
    IF registro.cancelada_em IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM sapataria.lancamentos_financeiros l
       WHERE l.origem_tipo='venda' AND l.origem_id=registro.id AND l.estorno_de_id IS NOT NULL
    ) THEN
      SELECT id INTO lancamento_id FROM sapataria.lancamentos_financeiros
       WHERE origem_tipo='venda' AND origem_id=registro.id AND estorno_de_id IS NULL ORDER BY id DESC LIMIT 1;
      INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,estorno_de_id,motivo_estorno,criado_por,criado_em)
      VALUES ('saida','estorno',format('Estorno de Venda #%s', registro.id),registro.total,'venda',registro.id,lancamento_id,'Cancelamento da venda anterior à integração financeira.',registro.vendedor_id,registro.cancelada_em)
      RETURNING id INTO lancamento_id;
      IF registro.total > 0 THEN
        INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
        VALUES (lancamento_id,1,1,registro.total,(registro.cancelada_em AT TIME ZONE 'America/Sao_Paulo')::date) RETURNING id INTO parcela_id;
        INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,pago_em,criado_por)
        VALUES (parcela_id,registro.total,registro.forma_pagamento,registro.cancelada_em,registro.vendedor_id);
      END IF;
    END IF;
  END LOOP;

  FOR registro IN SELECT os.* FROM sapataria.ordens_servico os WHERE os.status <> 'Cancelada' LOOP
    IF NOT EXISTS (SELECT 1 FROM sapataria.lancamentos_financeiros WHERE origem_tipo='ordem_servico' AND origem_id=registro.id AND estorno_de_id IS NULL) THEN
      INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por,criado_em)
      VALUES ('entrada','ordem_servico',format('OS #%s', registro.id),registro.valor,'ordem_servico',registro.id,registro.responsavel_id,(registro.data_entrada::timestamp AT TIME ZONE 'America/Sao_Paulo'));
    END IF;
  END LOOP;

  FOR registro IN SELECT c.id,c.fornecedor_id,c.registrada_em,
                         COALESCE(SUM(ic.quantidade * ic.preco_unitario),0) AS total,
                         bool_and(ic.material_id IS NOT NULL) AS somente_materiais,
                         bool_and(ic.produto_id IS NOT NULL) AS somente_produtos
                    FROM sapataria.compras_estoque c
                    LEFT JOIN sapataria.itens_compra_estoque ic ON ic.compra_id=c.id
                   GROUP BY c.id,c.fornecedor_id,c.registrada_em LOOP
    IF NOT EXISTS (SELECT 1 FROM sapataria.lancamentos_financeiros WHERE origem_tipo='compra_estoque' AND origem_id=registro.id AND estorno_de_id IS NULL) THEN
      categoria := CASE WHEN registro.somente_materiais THEN 'compra_materiais' WHEN registro.somente_produtos THEN 'compra_produtos' ELSE 'compra_estoque' END;
      total := registro.total;
      INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_em)
      VALUES ('saida',categoria,format('Compra #%s', registro.id),total,'compra_estoque',registro.id,registro.registrada_em);
    END IF;
  END LOOP;
END $$;

-- Garante uma parcela para lançamentos pendentes legados criados antes da
-- primeira execução desta migração. A operação é idempotente.
DO $$
DECLARE registro RECORD;
BEGIN
  FOR registro IN
    SELECT l.id, l.valor_total, origem_tipo, origem_id
      FROM sapataria.lancamentos_financeiros l
     WHERE l.estorno_de_id IS NULL
       AND l.valor_total > 0
       AND l.origem_tipo IN ('ordem_servico', 'compra_estoque')
       AND NOT EXISTS (SELECT 1 FROM sapataria.parcelas_financeiras p WHERE p.lancamento_id=l.id)
  LOOP
    INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
    VALUES (registro.id,1,1,registro.valor_total,CURRENT_DATE);
  END LOOP;
END $$;

REVOKE ALL ON TABLE sapataria.lancamentos_financeiros, sapataria.parcelas_financeiras,
  sapataria.pagamentos_financeiros FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.lancamentos_financeiros, sapataria.parcelas_financeiras, sapataria.pagamentos_financeiros FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
