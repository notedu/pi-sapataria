-- Aplicar uma vez, depois de clientes.sql. Preserva registros e endereços antigos.
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
