-- Preserva as OS existentes enquanto habilita múltiplos itens/serviços,
-- materiais planejados e motivo de cancelamento.
BEGIN;

ALTER TABLE sapataria.ordens_servico
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'os_motivo_cancelamento_valido'
       AND conrelid = 'sapataria.ordens_servico'::regclass
  ) THEN
    ALTER TABLE sapataria.ordens_servico
      ADD CONSTRAINT os_motivo_cancelamento_valido
      CHECK (motivo_cancelamento IS NULL OR length(trim(motivo_cancelamento)) > 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sapataria.itens_ordem_servico (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordem_servico_id integer NOT NULL REFERENCES sapataria.ordens_servico (id),
  descricao_item text NOT NULL CHECK (length(trim(descricao_item)) > 0),
  servico text NOT NULL CHECK (length(trim(servico)) > 0)
);

CREATE TABLE IF NOT EXISTS sapataria.materiais_planejados_os (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordem_servico_id integer NOT NULL REFERENCES sapataria.ordens_servico (id),
  material_id integer NOT NULL REFERENCES sapataria.materiais (id),
  quantidade numeric NOT NULL CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric)
);

CREATE INDEX IF NOT EXISTS itens_os_ordem_servico_id
  ON sapataria.itens_ordem_servico (ordem_servico_id);
CREATE INDEX IF NOT EXISTS materiais_planejados_os_ordem_servico_id
  ON sapataria.materiais_planejados_os (ordem_servico_id);

-- Cada OS legada tinha uma descrição e um serviço; converte-os numa linha.
INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id, descricao_item, servico)
SELECT os.id, os.descricao_calcado, os.servico
  FROM sapataria.ordens_servico AS os
 WHERE NOT EXISTS (
   SELECT 1 FROM sapataria.itens_ordem_servico AS item
    WHERE item.ordem_servico_id = os.id
 );

COMMIT;
