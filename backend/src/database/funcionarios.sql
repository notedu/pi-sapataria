-- Etapa Funcionários e autenticação. Não modifica Clientes nem insere contas.
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
