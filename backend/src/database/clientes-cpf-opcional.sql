-- CPF opcional no cadastro e edição de clientes; se informado, deve ter 11 dígitos.
BEGIN;
ALTER TABLE sapataria.clientes
  DROP CONSTRAINT IF EXISTS clientes_cpf_formato;
ALTER TABLE sapataria.clientes
  ADD CONSTRAINT clientes_cpf_formato CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$') NOT VALID;
COMMIT;
