BEGIN;
CREATE TABLE IF NOT EXISTS sapataria.fechamentos_caixa (
  data date PRIMARY KEY,
  recebimentos_brutos numeric NOT NULL CHECK (recebimentos_brutos >= 0 AND recebimentos_brutos < 'Infinity'::numeric AND recebimentos_brutos = round(recebimentos_brutos, 2)),
  saidas numeric NOT NULL CHECK (saidas >= 0 AND saidas < 'Infinity'::numeric AND saidas = round(saidas, 2)),
  total_liquido numeric NOT NULL CHECK (total_liquido = recebimentos_brutos - saidas),
  por_forma_pagamento jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(por_forma_pagamento) = 'object'),
  por_origem jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(por_origem) = 'object'),
  saidas_por_categoria jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(saidas_por_categoria) = 'object'),
  modo text NOT NULL DEFAULT 'automatico' CHECK (modo IN ('automatico', 'manual')),
  pagamentos_selecionados jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pagamentos_selecionados) = 'array'),
  itens_manuais jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(itens_manuais) = 'array'),
  fechado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechado_por integer REFERENCES sapataria.funcionarios(id) ON DELETE SET NULL
);
REVOKE ALL ON TABLE sapataria.fechamentos_caixa FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.fechamentos_caixa FROM %I', papel);
    END IF;
  END LOOP;
END $$;
COMMIT;
