-- Categorias reutilizáveis e apoio ao saldo inicial do cadastro de estoque.
-- A alteração é aditiva e não modifica saldos existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS sapataria.categorias_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('produtos', 'materiais')),
  nome text NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome) <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS categorias_estoque_tipo_nome_unico
  ON sapataria.categorias_estoque (tipo, lower(nome));
CREATE INDEX IF NOT EXISTS categorias_estoque_tipo_nome
  ON sapataria.categorias_estoque (tipo, nome);

REVOKE ALL ON TABLE sapataria.categorias_estoque FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.categorias_estoque FROM %I', papel);
    END IF;
  END LOOP;
END $$;

COMMIT;
