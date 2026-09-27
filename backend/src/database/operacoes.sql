-- Aplicar uma vez, após clientes.sql, funcionarios.sql e entidades.sql.
-- Não modifica saldos/dados existentes. Valores incompatíveis fazem a transação falhar.
BEGIN;

ALTER TABLE sapataria.materiais
  ADD CONSTRAINT materiais_saldo_finito CHECK (quantidade < 'Infinity'::numeric),
  ADD CONSTRAINT materiais_minimo_valido CHECK (quantidade_minima >= 0 AND quantidade_minima < 'Infinity'::numeric),
  ADD CONSTRAINT materiais_custo_valido CHECK (custo >= 0 AND custo < 'Infinity'::numeric AND custo = round(custo, 2));
ALTER TABLE sapataria.produtos
  ADD CONSTRAINT produtos_saldo_inteiro CHECK (quantidade < 'Infinity'::numeric AND quantidade = trunc(quantidade)),
  ADD CONSTRAINT produtos_custo_valido CHECK (preco_custo >= 0 AND preco_custo < 'Infinity'::numeric AND preco_custo = round(preco_custo, 2)),
  ADD CONSTRAINT produtos_preco_valido CHECK (preco_venda >= 0 AND preco_venda < 'Infinity'::numeric AND preco_venda = round(preco_venda, 2));
ALTER TABLE sapataria.ordens_servico
  ALTER COLUMN status SET DEFAULT 'Aberta',
  ADD CONSTRAINT os_status_valido CHECK (status IN ('Aberta', 'Em andamento', 'Pronta', 'Entregue', 'Cancelada')),
  ADD CONSTRAINT os_valor_valido CHECK (valor >= 0 AND valor < 'Infinity'::numeric AND valor = round(valor, 2)),
  ADD CONSTRAINT os_pagamento_valido CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'dinheiro'));
ALTER TABLE sapataria.vendas
  ADD COLUMN cancelada_em timestamptz,
  ADD CONSTRAINT vendas_total_valido CHECK (total >= 0 AND total < 'Infinity'::numeric AND total = round(total, 2)),
  ADD CONSTRAINT vendas_pagamento_valido CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'dinheiro'));
ALTER TABLE sapataria.itens_venda
  ADD CONSTRAINT itens_quantidade_valida CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric AND quantidade = trunc(quantidade)),
  ADD CONSTRAINT itens_preco_valido CHECK (preco_unitario >= 0 AND preco_unitario < 'Infinity'::numeric AND preco_unitario = round(preco_unitario, 2));
ALTER TABLE sapataria.materiais_os
  ADD CONSTRAINT usos_quantidade_valida CHECK (quantidade_usada > 0 AND quantidade_usada < 'Infinity'::numeric);
ALTER TABLE sapataria.movimentacoes_estoque
  ALTER COLUMN data SET DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN item_venda_id integer REFERENCES sapataria.itens_venda(id),
  ADD COLUMN material_os_id integer REFERENCES sapataria.materiais_os(id),
  ADD COLUMN reversao_de_id integer REFERENCES sapataria.movimentacoes_estoque(id),
  ADD CONSTRAINT movimentos_tipo_valido CHECK (tipo IN ('entrada', 'saida')),
  ADD CONSTRAINT movimentos_quantidade_valida CHECK (quantidade > 0 AND quantidade < 'Infinity'::numeric AND (produto_id IS NULL OR quantidade = trunc(quantidade))),
  ADD CONSTRAINT movimentos_origem_valida CHECK (num_nonnulls(item_venda_id, material_os_id, reversao_de_id) <= 1),
  ADD CONSTRAINT movimentos_origem_item CHECK ((item_venda_id IS NULL OR (produto_id IS NOT NULL AND tipo = 'saida')) AND (material_os_id IS NULL OR (material_id IS NOT NULL AND tipo = 'saida'))),
  ADD CONSTRAINT movimentos_motivo_valido CHECK (length(trim(motivo)) > 0);
CREATE UNIQUE INDEX movimentos_item_venda_unico ON sapataria.movimentacoes_estoque(item_venda_id) WHERE item_venda_id IS NOT NULL;
CREATE UNIQUE INDEX movimentos_material_os_unico ON sapataria.movimentacoes_estoque(material_os_id) WHERE material_os_id IS NOT NULL;
CREATE INDEX movimentos_reversao ON sapataria.movimentacoes_estoque(reversao_de_id);
COMMIT;
