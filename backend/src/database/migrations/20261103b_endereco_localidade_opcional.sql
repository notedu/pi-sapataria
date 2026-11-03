-- Torna cidade e estado opcionais nos endereços manuais de Clientes.
-- Aplicar após 20261103_endereco_sem_cep.sql se a migração anterior ainda não foi aplicada.
BEGIN;

ALTER TABLE sapataria.clientes
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text;

ALTER TABLE sapataria.clientes
  DROP CONSTRAINT IF EXISTS clientes_endereco_completo,
  ADD CONSTRAINT clientes_endereco_completo CHECK (
    logradouro IS NOT NULL AND btrim(logradouro) <> '' AND
    bairro IS NOT NULL AND btrim(bairro) <> '' AND
    (cidade IS NULL OR btrim(cidade) <> '') AND
    (uf IS NULL OR uf ~ '^[A-Z]{2}$')
  ) NOT VALID;

COMMIT;
