-- Aplicar após fornecedores.sql e operacoes.sql. Preserva valores legados.
BEGIN;
ALTER TABLE sapataria.fornecedores
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS prazo_pagamento text,
  ADD COLUMN IF NOT EXISTS meios_pagamento text,
  ADD COLUMN IF NOT EXISTS desconto text,
  ADD COLUMN IF NOT EXISTS moeda text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_dados_formato' AND conrelid = 'sapataria.fornecedores'::regclass) THEN
    ALTER TABLE sapataria.fornecedores ADD CONSTRAINT fornecedores_dados_formato CHECK (
      (cnpj IS NULL OR cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$') AND
      (cep IS NULL OR cep ~ '^[0-9]{8}$') AND
      (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$') AND
      (razao_social IS NULL OR length(trim(razao_social)) > 0) AND
      (nome_fantasia IS NULL OR length(trim(nome_fantasia)) > 0) AND
      (numero IS NULL OR length(trim(numero)) > 0) AND
      (email IS NULL OR email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    );
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_condicoes_comerciais_formato' AND conrelid = 'sapataria.fornecedores'::regclass) THEN
    ALTER TABLE sapataria.fornecedores ADD CONSTRAINT fornecedores_condicoes_comerciais_formato CHECK (
      (prazo_pagamento IS NULL OR length(trim(prazo_pagamento)) > 0) AND
      (meios_pagamento IS NULL OR length(trim(meios_pagamento)) > 0) AND
      (desconto IS NULL OR length(trim(desconto)) > 0) AND
      (moeda IS NULL OR length(trim(moeda)) > 0)
    );
  END IF;
END $$;
CREATE OR REPLACE FUNCTION sapataria.proteger_unidade_material() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unidade IS DISTINCT FROM OLD.unidade AND
    (OLD.quantidade <> 0 OR NEW.quantidade <> 0 OR EXISTS (SELECT 1 FROM sapataria.movimentacoes_estoque WHERE material_id = OLD.id)) THEN
    RAISE EXCEPTION 'Não é permitido trocar a unidade de material com saldo ou movimentações.'
      USING ERRCODE = '23514', CONSTRAINT = 'materiais_unidade_com_historico';
  END IF;
  RETURN NEW;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'materiais_proteger_unidade' AND tgrelid = 'sapataria.materiais'::regclass) THEN
    CREATE TRIGGER materiais_proteger_unidade BEFORE UPDATE OF unidade ON sapataria.materiais
      FOR EACH ROW EXECUTE FUNCTION sapataria.proteger_unidade_material();
  END IF;
END $$;
COMMIT;
