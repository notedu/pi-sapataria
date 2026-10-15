-- Seda e Couro — esquema completo para instalação em um banco novo/vazio.
-- Reúne as estruturas e evoluções na ordem de dependência original.
-- Não executar sobre um banco existente ou parcialmente atualizado: algumas
-- alterações abaixo são incrementais e não foram convertidas em migrações repetíveis.

-- Estrutura base de Clientes.
-- O schema separado preserva o padrão anterior e evita expor a tabela na API pública do Supabase.
BEGIN;

CREATE SCHEMA IF NOT EXISTS sapataria;

CREATE TABLE IF NOT EXISTS sapataria.clientes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  endereco text NOT NULL,
  email text,
  observacoes text
);

REVOKE ALL ON TABLE sapataria.clientes FROM PUBLIC, anon, authenticated;

COMMIT;
-- Estrutura base de Funcionários e autenticação. Não insere contas.
BEGIN;
CREATE SCHEMA IF NOT EXISTS sapataria;

CREATE TABLE IF NOT EXISTS sapataria.funcionarios (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  usuario text NOT NULL,
  email text NOT NULL,
  senha_protegida text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('administrador', 'funcionario')),
  ativo boolean NOT NULL DEFAULT true,
  -- Incrementada ao alterar o acesso: sessões anteriores deixam de valer.
  versao_acesso integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_usuario_unico
  ON sapataria.funcionarios (lower(usuario));

-- Estrutura exigida pelo armazenamento connect-pg-simple.
CREATE TABLE IF NOT EXISTS sapataria.sessoes (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_expiracao ON sapataria.sessoes (expire);

-- Contadores compartilhados entre instâncias da aplicação; não contêm senhas.
CREATE TABLE IF NOT EXISTS sapataria.tentativas_login (
  chave text PRIMARY KEY,
  tentativas integer NOT NULL,
  expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS tentativas_login_expiracao ON sapataria.tentativas_login (expira_em);

REVOKE ALL ON TABLE sapataria.funcionarios, sapataria.sessoes, sapataria.tentativas_login FROM PUBLIC;
-- Estes perfis só existem no Supabase; o SQL também funciona no PostgreSQL da AWS.
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.funcionarios, sapataria.sessoes, sapataria.tentativas_login FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
-- Evolução de Clientes: dados pessoais, CEP e data de cadastro.
BEGIN;
ALTER TABLE sapataria.clientes
  ADD COLUMN cpf text,
  ADD COLUMN cep text,
  ADD COLUMN numero text,
  ADD COLUMN criado_em timestamptz;
-- O padrão só se aplica às próximas inserções: a data dos antigos é desconhecida.
ALTER TABLE sapataria.clientes ALTER COLUMN criado_em SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sapataria.clientes ALTER COLUMN endereco DROP NOT NULL;
-- NOT VALID preserva linhas antigas; novas inserções/atualizações exigem os campos.
ALTER TABLE sapataria.clientes
  ADD CONSTRAINT clientes_cpf_formato CHECK (cpf IS NOT NULL AND cpf ~ '^[0-9]{11}$') NOT VALID,
  ADD CONSTRAINT clientes_cep_formato CHECK (cep IS NOT NULL AND cep ~ '^[0-9]{8}$') NOT VALID,
  ADD CONSTRAINT clientes_numero_obrigatorio CHECK (numero IS NOT NULL AND btrim(numero) <> '') NOT VALID,
  ADD CONSTRAINT clientes_telefone_formato CHECK (telefone ~ '^[0-9]{11}$') NOT VALID;
COMMIT;
-- Evolução de Funcionários: CPF e telefone.
BEGIN;
ALTER TABLE sapataria.funcionarios ADD COLUMN cpf text, ADD COLUMN telefone text;
ALTER TABLE sapataria.funcionarios
  ADD CONSTRAINT funcionarios_cpf_formato CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
  ADD CONSTRAINT funcionarios_telefone_formato CHECK (telefone IS NULL OR telefone ~ '^[0-9]{11}$');
-- Exige os campos no cadastro/edição pessoal, sem bloquear desativação de legados.
CREATE FUNCTION sapataria.exigir_dados_pessoais_funcionario() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cpf IS NULL OR NEW.telefone IS NULL THEN
    RAISE EXCEPTION 'CPF e telefone são obrigatórios no cadastro e edição pessoal.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER funcionarios_dados_obrigatorios
BEFORE INSERT OR UPDATE OF nome, email, cpf, telefone ON sapataria.funcionarios
FOR EACH ROW EXECUTE FUNCTION sapataria.exigir_dados_pessoais_funcionario();
COMMIT;
-- Entidades operacionais dependentes de Clientes e Funcionários.
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
-- Restrições e relações para operações de negócio.
-- Não modifica saldos/dados existentes. Valores incompatíveis fazem a transação falhar.
BEGIN;

ALTER TABLE sapataria.materiais
  ADD CONSTRAINT materiais_saldo_finito CHECK (quantidade < 'Infinity'::numeric),
  ADD CONSTRAINT materiais_minimo_valido CHECK (quantidade_minima >= 0 AND quantidade_minima < 'Infinity'::numeric),
  ADD CONSTRAINT materiais_custo_valido CHECK (custo >= 0 AND custo < 'Infinity'::numeric AND custo = round(custo, 2));
ALTER TABLE sapataria.produtos
  ADD CONSTRAINT produtos_saldo_inteiro CHECK (quantidade < 'Infinity'::numeric AND quantidade = trunc(quantidade)),
  ADD CONSTRAINT produtos_custo_valido CHECK (preco_custo >= 0 AND preco_custo < 'Infinity'::numeric AND preco_custo = round(preco_custo, 2)),
  ADD CONSTRAINT produtos_preco_valido CHECK (preco_venda >= 0 AND preco_venda < 'Infinity'::numeric AND preco_venda = round(preco_venda, 2));
ALTER TABLE sapataria.ordens_servico
  ALTER COLUMN status SET DEFAULT 'Aberta',
  ADD CONSTRAINT os_status_valido CHECK (status IN ('Aberta', 'Em andamento', 'Pronta', 'Entregue', 'Cancelada')),
  ADD CONSTRAINT os_valor_valido CHECK (valor >= 0 AND valor < 'Infinity'::numeric AND valor = round(valor, 2)),
  ADD CONSTRAINT os_pagamento_valido CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'dinheiro'));
ALTER TABLE sapataria.vendas
  ADD COLUMN cancelada_em timestamptz,
  ADD CONSTRAINT vendas_total_valido CHECK (total >= 0 AND total < 'Infinity'::numeric AND total = round(total, 2)),
  ADD CONSTRAINT vendas_pagamento_valido CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'dinheiro'));
ALTER TABLE sapataria.itens_venda
  ADD CONSTRAINT itens_quantidade_valida CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric AND quantidade = trunc(quantidade)),
  ADD CONSTRAINT itens_preco_valido CHECK (preco_unitario >= 0 AND preco_unitario < 'Infinity'::numeric AND preco_unitario = round(preco_unitario, 2));
ALTER TABLE sapataria.materiais_os
  ADD CONSTRAINT usos_quantidade_valida CHECK (quantidade_usada > 0 AND quantidade_usada < 'Infinity'::numeric);
ALTER TABLE sapataria.movimentacoes_estoque
  ALTER COLUMN data SET DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN item_venda_id integer REFERENCES sapataria.itens_venda(id),
  ADD COLUMN material_os_id integer REFERENCES sapataria.materiais_os(id),
  ADD COLUMN reversao_de_id integer REFERENCES sapataria.movimentacoes_estoque(id),
  ADD CONSTRAINT movimentos_tipo_valido CHECK (tipo IN ('entrada', 'saida')),
  ADD CONSTRAINT movimentos_quantidade_valida CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric AND (produto_id IS NULL OR quantidade = trunc(quantidade))),
  ADD CONSTRAINT movimentos_origem_valida CHECK (num_nonnulls(item_venda_id, material_os_id, reversao_de_id) <= 1),
  ADD CONSTRAINT movimentos_origem_item CHECK ((item_venda_id IS NULL OR (produto_id IS NOT NULL AND tipo = 'saida')) AND (material_os_id IS NULL OR (material_id IS NOT NULL AND tipo = 'saida'))),
  ADD CONSTRAINT movimentos_motivo_valido CHECK (length(trim(motivo)) > 0);
CREATE UNIQUE INDEX movimentos_item_venda_unico ON sapataria.movimentacoes_estoque(item_venda_id) WHERE item_venda_id IS NOT NULL;
CREATE UNIQUE INDEX movimentos_material_os_unico ON sapataria.movimentacoes_estoque(material_os_id) WHERE material_os_id IS NOT NULL;
CREATE INDEX movimentos_reversao ON sapataria.movimentacoes_estoque(reversao_de_id);
COMMIT;
BEGIN;
CREATE TABLE IF NOT EXISTS sapataria.fornecedores (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL CHECK (length(trim(nome)) > 0)
);
CREATE TABLE IF NOT EXISTS sapataria.produtos_fornecedores (
  produto_id integer NOT NULL REFERENCES sapataria.produtos(id) ON DELETE CASCADE,
  fornecedor_id integer NOT NULL REFERENCES sapataria.fornecedores(id),
  PRIMARY KEY (produto_id, fornecedor_id)
);
CREATE TABLE IF NOT EXISTS sapataria.materiais_fornecedores (
  material_id integer NOT NULL REFERENCES sapataria.materiais(id) ON DELETE CASCADE,
  fornecedor_id integer NOT NULL REFERENCES sapataria.fornecedores(id),
  PRIMARY KEY (material_id, fornecedor_id)
);
-- Mesmo limite de acesso dos demais cadastros: somente pela API autenticada.
REVOKE ALL ON TABLE sapataria.fornecedores, sapataria.produtos_fornecedores,
  sapataria.materiais_fornecedores FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.fornecedores, sapataria.produtos_fornecedores, sapataria.materiais_fornecedores FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
-- Evolução dos cadastros de estoque e Fornecedores; preserva valores legados.
BEGIN;
ALTER TABLE sapataria.fornecedores
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS prazo_pagamento text,
  ADD COLUMN IF NOT EXISTS meios_pagamento text,
  ADD COLUMN IF NOT EXISTS desconto text,
  ADD COLUMN IF NOT EXISTS moeda text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_dados_formato' AND conrelid = 'sapataria.fornecedores'::regclass) THEN
    ALTER TABLE sapataria.fornecedores ADD CONSTRAINT fornecedores_dados_formato CHECK (
      (cnpj IS NULL OR cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$') AND
      (cep IS NULL OR cep ~ '^[0-9]{8}$') AND
      (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$') AND
      (razao_social IS NULL OR length(trim(razao_social)) > 0) AND
      (nome_fantasia IS NULL OR length(trim(nome_fantasia)) > 0) AND
      (numero IS NULL OR length(trim(numero)) > 0) AND
      (email IS NULL OR email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    );
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_condicoes_comerciais_formato' AND conrelid = 'sapataria.fornecedores'::regclass) THEN
    ALTER TABLE sapataria.fornecedores ADD CONSTRAINT fornecedores_condicoes_comerciais_formato CHECK (
      (prazo_pagamento IS NULL OR length(trim(prazo_pagamento)) > 0) AND
      (meios_pagamento IS NULL OR length(trim(meios_pagamento)) > 0) AND
      (desconto IS NULL OR length(trim(desconto)) > 0) AND
      (moeda IS NULL OR length(trim(moeda)) > 0)
    );
  END IF;
END $$;
CREATE OR REPLACE FUNCTION sapataria.proteger_unidade_material() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unidade IS DISTINCT FROM OLD.unidade AND
    (OLD.quantidade <> 0 OR NEW.quantidade <> 0 OR EXISTS (SELECT 1 FROM sapataria.movimentacoes_estoque WHERE material_id = OLD.id)) THEN
    RAISE EXCEPTION 'Não é permitido trocar a unidade de material com saldo ou movimentações.'
      USING ERRCODE = '23514', CONSTRAINT = 'materiais_unidade_com_historico';
  END IF;
  RETURN NEW;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'materiais_proteger_unidade' AND tgrelid = 'sapataria.materiais'::regclass) THEN
    CREATE TRIGGER materiais_proteger_unidade BEFORE UPDATE OF unidade ON sapataria.materiais
      FOR EACH ROW EXECUTE FUNCTION sapataria.proteger_unidade_material();
  END IF;
END $$;
COMMIT;
-- Compras, mínimos e importação de estoque.
BEGIN;

ALTER TABLE sapataria.produtos
  ADD COLUMN IF NOT EXISTS quantidade_minima numeric;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_minimo_valido' AND conrelid = 'sapataria.produtos'::regclass) THEN
    ALTER TABLE sapataria.produtos ADD CONSTRAINT produtos_minimo_valido
      CHECK (quantidade_minima IS NULL OR (quantidade_minima >= 0 AND quantidade_minima < 'Infinity'::numeric AND quantidade_minima = trunc(quantidade_minima)));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sapataria.compras_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fornecedor_id integer NOT NULL REFERENCES sapataria.fornecedores(id),
  registrada_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sapataria.itens_compra_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  compra_id integer NOT NULL REFERENCES sapataria.compras_estoque(id),
  material_id integer REFERENCES sapataria.materiais(id),
  produto_id integer REFERENCES sapataria.produtos(id),
  quantidade numeric NOT NULL CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric),
  preco_unitario numeric NOT NULL CHECK (preco_unitario >= 0 AND preco_unitario < 'Infinity'::numeric AND preco_unitario = round(preco_unitario, 2)),
  CONSTRAINT item_compra_um_item CHECK ((material_id IS NOT NULL) <> (produto_id IS NOT NULL)),
  CONSTRAINT item_compra_quantidade_produto_inteira CHECK (produto_id IS NULL OR quantidade = trunc(quantidade))
);

ALTER TABLE sapataria.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS item_compra_id integer REFERENCES sapataria.itens_compra_estoque(id);

ALTER TABLE sapataria.movimentacoes_estoque DROP CONSTRAINT IF EXISTS movimentos_origem_valida;
ALTER TABLE sapataria.movimentacoes_estoque ADD CONSTRAINT movimentos_origem_valida
  CHECK (num_nonnulls(item_venda_id, material_os_id, reversao_de_id, item_compra_id) <= 1);

ALTER TABLE sapataria.movimentacoes_estoque DROP CONSTRAINT IF EXISTS movimentos_origem_item;
ALTER TABLE sapataria.movimentacoes_estoque ADD CONSTRAINT movimentos_origem_item CHECK (
  (item_venda_id IS NULL OR (produto_id IS NOT NULL AND tipo = 'saida')) AND
  (material_os_id IS NULL OR (material_id IS NOT NULL AND tipo = 'saida')) AND
  (item_compra_id IS NULL OR (num_nonnulls(material_id, produto_id) = 1 AND tipo = 'entrada'))
);

CREATE UNIQUE INDEX IF NOT EXISTS movimentos_item_compra_unico
  ON sapataria.movimentacoes_estoque(item_compra_id) WHERE item_compra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS itens_compra_compra_id ON sapataria.itens_compra_estoque(compra_id);
CREATE INDEX IF NOT EXISTS compras_fornecedor_data ON sapataria.compras_estoque(fornecedor_id, registrada_em DESC);

CREATE OR REPLACE FUNCTION sapataria.validar_item_movimento_compra() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE linha sapataria.itens_compra_estoque%ROWTYPE;
BEGIN
  IF NEW.item_compra_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO linha FROM sapataria.itens_compra_estoque WHERE id = NEW.item_compra_id;
  IF NOT FOUND OR linha.material_id IS DISTINCT FROM NEW.material_id OR linha.produto_id IS DISTINCT FROM NEW.produto_id THEN
    RAISE EXCEPTION 'O item da compra deve corresponder ao item da entrada.'
      USING ERRCODE = '23514', CONSTRAINT = 'movimentos_compra_item_compativel';
  END IF;
  RETURN NEW;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'movimentacao_compra_item_compativel' AND tgrelid = 'sapataria.movimentacoes_estoque'::regclass) THEN
    CREATE TRIGGER movimentacao_compra_item_compativel BEFORE INSERT OR UPDATE ON sapataria.movimentacoes_estoque
      FOR EACH ROW EXECUTE FUNCTION sapataria.validar_item_movimento_compra();
  END IF;
END $$;

REVOKE ALL ON TABLE sapataria.compras_estoque, sapataria.itens_compra_estoque FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.compras_estoque, sapataria.itens_compra_estoque FROM %I', papel);
    END IF;
  END LOOP;
END $$;

COMMIT;
-- Dados comerciais da loja.
BEGIN;
CREATE TABLE IF NOT EXISTS sapataria.configuracoes_loja (
  id smallint PRIMARY KEY CHECK (id = 1),
  endereco text NOT NULL DEFAULT '' CHECK (char_length(endereco) <= 500)
);
INSERT INTO sapataria.configuracoes_loja (id, endereco) VALUES (1, '')
ON CONFLICT (id) DO NOTHING;
REVOKE ALL ON TABLE sapataria.configuracoes_loja FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.configuracoes_loja FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
