-- Estrutura de Clientes. Executar somente após conferir a estrutura existente.
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
