-- Permite cadastro manual de endereços mesmo quando o ViaCEP não encontra rua/CEP.
-- A migração é aditiva e preserva os registros existentes.
BEGIN;

ALTER TABLE sapataria.clientes
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text;

ALTER TABLE sapataria.clientes
  DROP CONSTRAINT IF EXISTS clientes_cep_formato,
  ADD CONSTRAINT clientes_cep_formato
    CHECK (cep IS NULL OR cep ~ '^[0-9]{8}$') NOT VALID,
  ADD CONSTRAINT clientes_endereco_completo CHECK (
    logradouro IS NOT NULL AND btrim(logradouro) <> '' AND
    bairro IS NOT NULL AND btrim(bairro) <> '' AND
    cidade IS NOT NULL AND btrim(cidade) <> '' AND
    uf IS NOT NULL AND uf ~ '^[A-Z]{2}$'
  ) NOT VALID;

ALTER TABLE sapataria.fornecedores
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fornecedores_uf_formato'
      AND conrelid = 'sapataria.fornecedores'::regclass
  ) THEN
    ALTER TABLE sapataria.fornecedores
      ADD CONSTRAINT fornecedores_uf_formato
      CHECK (uf IS NULL OR uf ~ '^[A-Z]{2}$') NOT VALID;
  END IF;
END $$;

COMMIT;
