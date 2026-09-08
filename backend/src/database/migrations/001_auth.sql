CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(80) UNIQUE NOT NULL CHECK (usuario = lower(usuario)),
  nome VARCHAR(150) NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil VARCHAR(20) NOT NULL DEFAULT 'funcionario' CHECK (perfil IN ('admin', 'funcionario')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_expiracao_idx ON sessoes(expira_em);
