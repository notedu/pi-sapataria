BEGIN;

-- Mantém o script aplicável também quando as migrações anteriores do fechamento ainda não foram executadas.
CREATE TABLE IF NOT EXISTS sapataria.fechamentos_caixa (
  data date PRIMARY KEY,
  recebimentos_brutos numeric NOT NULL CHECK (recebimentos_brutos>=0 AND recebimentos_brutos<'Infinity'::numeric AND recebimentos_brutos=round(recebimentos_brutos,2)),
  saidas numeric NOT NULL CHECK (saidas>=0 AND saidas<'Infinity'::numeric AND saidas=round(saidas,2)),
  total_liquido numeric NOT NULL CHECK (total_liquido=recebimentos_brutos-saidas),
  por_forma_pagamento jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(por_forma_pagamento)='object'),
  por_origem jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(por_origem)='object'),
  saidas_por_categoria jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(saidas_por_categoria)='object'),
  modo text NOT NULL DEFAULT 'automatico' CHECK (modo IN ('automatico','manual')),
  pagamentos_selecionados jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pagamentos_selecionados)='array'),
  itens_manuais jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(itens_manuais)='array'),
  fechado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechado_por integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL
);

ALTER TABLE sapataria.fechamentos_caixa
  ADD COLUMN IF NOT EXISTS formato_manual text NOT NULL DEFAULT 'detalhado',
  ADD COLUMN IF NOT EXISTS fonte_manual text NOT NULL DEFAULT 'valores',
  ADD COLUMN IF NOT EXISTS resumo_manual jsonb,
  ADD COLUMN IF NOT EXISTS dinheiro_contado numeric,
  ADD COLUMN IF NOT EXISTS diferenca_dinheiro numeric;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_formato_manual_valido') THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_formato_manual_valido CHECK (formato_manual IN ('resumo','detalhado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_fonte_manual_valida') THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_fonte_manual_valida CHECK (fonte_manual IN ('pagamentos','valores'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_resumo_manual_objeto') THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_resumo_manual_objeto CHECK (resumo_manual IS NULL OR jsonb_typeof(resumo_manual)='object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_dinheiro_contado_valido') THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_dinheiro_contado_valido CHECK (dinheiro_contado IS NULL OR (dinheiro_contado >= 0 AND dinheiro_contado < 'Infinity'::numeric AND dinheiro_contado=round(dinheiro_contado,2)));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sapataria.historico_fechamentos_caixa (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data date NOT NULL,
  fechamento_anterior jsonb NOT NULL CHECK (jsonb_typeof(fechamento_anterior)='object'),
  corrigido_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  corrigido_por integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL,
  motivo text NOT NULL CHECK (length(trim(motivo)) > 0)
);
CREATE INDEX IF NOT EXISTS historico_fechamentos_caixa_data_idx ON sapataria.historico_fechamentos_caixa(data,corrigido_em DESC);

CREATE TABLE IF NOT EXISTS sapataria.categorias_despesas (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome)<=80),
  criada_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS categorias_despesas_nome_ci ON sapataria.categorias_despesas(lower(nome));
INSERT INTO sapataria.categorias_despesas(nome) VALUES ('aluguel'),('energia'),('agua'),('funcionarios') ON CONFLICT DO NOTHING;

REVOKE ALL ON TABLE sapataria.fechamentos_caixa, sapataria.historico_fechamentos_caixa, sapataria.categorias_despesas FROM PUBLIC;
DO $$ DECLARE papel text; BEGIN
  FOREACH papel IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.fechamentos_caixa, sapataria.historico_fechamentos_caixa, sapataria.categorias_despesas FROM %I',papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
