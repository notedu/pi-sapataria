BEGIN;
ALTER TABLE sapataria.fechamentos_caixa
  ADD COLUMN IF NOT EXISTS modo text NOT NULL DEFAULT 'automatico',
  ADD COLUMN IF NOT EXISTS pagamentos_selecionados jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS itens_manuais jsonb NOT NULL DEFAULT '[]'::jsonb;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_modo_valido' AND conrelid='sapataria.fechamentos_caixa'::regclass) THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_modo_valido CHECK (modo IN ('automatico','manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_pagamentos_json_valido' AND conrelid='sapataria.fechamentos_caixa'::regclass) THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_pagamentos_json_valido CHECK (jsonb_typeof(pagamentos_selecionados)='array');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_itens_manuais_json_valido' AND conrelid='sapataria.fechamentos_caixa'::regclass) THEN
    ALTER TABLE sapataria.fechamentos_caixa ADD CONSTRAINT fechamento_itens_manuais_json_valido CHECK (jsonb_typeof(itens_manuais)='array');
  END IF;
END $$;
COMMIT;
