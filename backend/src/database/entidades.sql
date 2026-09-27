-- Etapa de modelagem e consultas. Pré-requisitos: schema.sql e funcionarios.sql.
-- Não insere registros nem implementa baixas, cálculos ou exclusões em cascata.
BEGIN;

CREATE TABLE IF NOT EXISTS sapataria.materiais (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  categoria text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  quantidade_minima numeric NOT NULL,
  custo numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS sapataria.produtos (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  categoria text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  preco_custo numeric NOT NULL,
  preco_venda numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS sapataria.ordens_servico (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES sapataria.clientes (id),
  responsavel_id integer NOT NULL REFERENCES sapataria.funcionarios (id),
  descricao_calcado text NOT NULL,
  servico text NOT NULL,
  valor numeric NOT NULL,
  data_entrada date NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date,
  prazo_entrega date,
  status text NOT NULL,
  forma_pagamento text,
  observacoes text
);

CREATE TABLE IF NOT EXISTS sapataria.vendas (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vendedor_id integer NOT NULL REFERENCES sapataria.funcionarios (id),
  forma_pagamento text NOT NULL,
  total numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS sapataria.itens_venda (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venda_id integer NOT NULL REFERENCES sapataria.vendas (id),
  produto_id integer NOT NULL REFERENCES sapataria.produtos (id),
  quantidade numeric NOT NULL,
  preco_unitario numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS sapataria.materiais_os (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordem_servico_id integer NOT NULL REFERENCES sapataria.ordens_servico (id),
  material_id integer NOT NULL REFERENCES sapataria.materiais (id),
  quantidade_usada numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS sapataria.movimentacoes_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo text NOT NULL,
  material_id integer REFERENCES sapataria.materiais (id),
  produto_id integer REFERENCES sapataria.produtos (id),
  quantidade numeric NOT NULL,
  -- A data automática de movimentação ainda não foi confirmada.
  data timestamptz NOT NULL,
  motivo text NOT NULL,
  CONSTRAINT movimentacao_um_item CHECK ((material_id IS NOT NULL) <> (produto_id IS NOT NULL))
);

-- Facilitam a consulta dos registros pertencentes à venda ou OS.
CREATE INDEX IF NOT EXISTS itens_venda_venda_id ON sapataria.itens_venda (venda_id);
CREATE INDEX IF NOT EXISTS materiais_os_ordem_servico_id ON sapataria.materiais_os (ordem_servico_id);

REVOKE ALL ON TABLE sapataria.materiais, sapataria.produtos, sapataria.ordens_servico,
  sapataria.vendas, sapataria.itens_venda, sapataria.materiais_os, sapataria.movimentacoes_estoque FROM PUBLIC;

-- Mantém o acesso pela aplicação. Os papéis abaixo só existem no Supabase.
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.materiais, sapataria.produtos, sapataria.ordens_servico, sapataria.vendas, sapataria.itens_venda, sapataria.materiais_os, sapataria.movimentacoes_estoque FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
