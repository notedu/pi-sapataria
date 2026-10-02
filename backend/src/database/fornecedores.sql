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
