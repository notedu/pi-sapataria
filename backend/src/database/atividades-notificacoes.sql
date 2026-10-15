-- Histórico de atividades e notificações individuais.
-- Aplicar uma vez após as tabelas de funcionários e ordens de serviço.
CREATE TABLE IF NOT EXISTS sapataria.atividades (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ator_id integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL,
  ator_nome text NOT NULL,
  acao text NOT NULL,
  entidade_tipo text NOT NULL,
  entidade_id integer,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS atividades_criado_em_idx ON sapataria.atividades (criado_em DESC, id DESC);
CREATE INDEX IF NOT EXISTS atividades_ator_idx ON sapataria.atividades (ator_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS atividades_entidade_idx ON sapataria.atividades (entidade_tipo, entidade_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS sapataria.notificacoes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  atividade_id integer NOT NULL REFERENCES sapataria.atividades(id) ON DELETE CASCADE,
  destinatario_id integer NOT NULL REFERENCES sapataria.funcionarios(id) ON DELETE CASCADE,
  mensagem text NOT NULL,
  criada_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lida_em timestamptz,
  UNIQUE (atividade_id, destinatario_id)
);

CREATE INDEX IF NOT EXISTS notificacoes_destinatario_idx ON sapataria.notificacoes (destinatario_id, criada_em DESC, id DESC);
CREATE INDEX IF NOT EXISTS notificacoes_nao_lidas_idx ON sapataria.notificacoes (destinatario_id, criada_em DESC) WHERE lida_em IS NULL;

REVOKE ALL ON TABLE sapataria.atividades, sapataria.notificacoes FROM PUBLIC;
