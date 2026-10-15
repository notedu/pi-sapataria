-- Aplicar após estoque-cadastros.sql. Campos novos preservam o estoque existente.
BEGIN;

ALTER TABLE sapataria.produtos
  ADD COLUMN IF NOT EXISTS quantidade_minima numeric;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_minimo_valido' AND conrelid = 'sapataria.produtos'::regclass) THEN
    ALTER TABLE sapataria.produtos ADD CONSTRAINT produtos_minimo_valido
      CHECK (quantidade_minima IS NULL OR (quantidade_minima >= 0 AND quantidade_minima < 'Infinity'::numeric AND quantidade_minima = trunc(quantidade_minima)));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sapataria.compras_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fornecedor_id integer NOT NULL REFERENCES sapataria.fornecedores(id),
  registrada_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sapataria.itens_compra_estoque (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  compra_id integer NOT NULL REFERENCES sapataria.compras_estoque(id),
  material_id integer REFERENCES sapataria.materiais(id),
  produto_id integer REFERENCES sapataria.produtos(id),
  quantidade numeric NOT NULL CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric),
  preco_unitario numeric NOT NULL CHECK (preco_unitario >= 0 AND preco_unitario < 'Infinity'::numeric AND preco_unitario = round(preco_unitario, 2)),
  CONSTRAINT item_compra_um_item CHECK ((material_id IS NOT NULL) <> (produto_id IS NOT NULL)),
  CONSTRAINT item_compra_quantidade_produto_inteira CHECK (produto_id IS NULL OR quantidade = trunc(quantidade))
);

ALTER TABLE sapataria.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS item_compra_id integer REFERENCES sapataria.itens_compra_estoque(id);

ALTER TABLE sapataria.movimentacoes_estoque DROP CONSTRAINT IF EXISTS movimentos_origem_valida;
ALTER TABLE sapataria.movimentacoes_estoque ADD CONSTRAINT movimentos_origem_valida
  CHECK (num_nonnulls(item_venda_id, material_os_id, reversao_de_id, item_compra_id) <= 1);

ALTER TABLE sapataria.movimentacoes_estoque DROP CONSTRAINT IF EXISTS movimentos_origem_item;
ALTER TABLE sapataria.movimentacoes_estoque ADD CONSTRAINT movimentos_origem_item CHECK (
  (item_venda_id IS NULL OR (produto_id IS NOT NULL AND tipo = 'saida')) AND
  (material_os_id IS NULL OR (material_id IS NOT NULL AND tipo = 'saida')) AND
  (item_compra_id IS NULL OR (num_nonnulls(material_id, produto_id) = 1 AND tipo = 'entrada'))
);

CREATE UNIQUE INDEX IF NOT EXISTS movimentos_item_compra_unico
  ON sapataria.movimentacoes_estoque(item_compra_id) WHERE item_compra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS itens_compra_compra_id ON sapataria.itens_compra_estoque(compra_id);
CREATE INDEX IF NOT EXISTS compras_fornecedor_data ON sapataria.compras_estoque(fornecedor_id, registrada_em DESC);

CREATE OR REPLACE FUNCTION sapataria.validar_item_movimento_compra() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE linha sapataria.itens_compra_estoque%ROWTYPE;
BEGIN
  IF NEW.item_compra_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO linha FROM sapataria.itens_compra_estoque WHERE id = NEW.item_compra_id;
  IF NOT FOUND OR linha.material_id IS DISTINCT FROM NEW.material_id OR linha.produto_id IS DISTINCT FROM NEW.produto_id THEN
    RAISE EXCEPTION 'O item da compra deve corresponder ao item da entrada.'
      USING ERRCODE = '23514', CONSTRAINT = 'movimentos_compra_item_compativel';
  END IF;
  RETURN NEW;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'movimentacao_compra_item_compativel' AND tgrelid = 'sapataria.movimentacoes_estoque'::regclass) THEN
    CREATE TRIGGER movimentacao_compra_item_compativel BEFORE INSERT OR UPDATE ON sapataria.movimentacoes_estoque
      FOR EACH ROW EXECUTE FUNCTION sapataria.validar_item_movimento_compra();
  END IF;
END $$;

REVOKE ALL ON TABLE sapataria.compras_estoque, sapataria.itens_compra_estoque FROM PUBLIC;
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE sapataria.compras_estoque, sapataria.itens_compra_estoque FROM %I', papel);
    END IF;
  END LOOP;
END $$;

COMMIT;
