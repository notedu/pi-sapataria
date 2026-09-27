import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { movimentar, reverter } from './estoqueModel';
import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface Venda {
  id: number;
  data: Date;
  vendedor_id: number;
  forma_pagamento: string;
  total: string;
  cancelada_em: Date | null;
}

const colunas = `id, data, vendedor_id, forma_pagamento, total, cancelada_em`;

export async function listar(): Promise<Venda[]> {
  const resultado = await pool.query<Venda>(
    `SELECT ${colunas} FROM sapataria.vendas ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<Venda | undefined> {
  const resultado = await pool.query<Venda>(
    `SELECT ${colunas} FROM sapataria.vendas WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export interface ItemPedido { produto_id: number; quantidade: string }
export interface ItemDevolvido { item_venda_id: number; quantidade: string }

export async function criar(vendedorId: number, formaPagamento: string, itens: ItemPedido[]) {
  return emTransacao(async (conexao) => {
    // Sempre bloqueia os produtos na mesma ordem para evitar ciclos entre vendas concorrentes.
    const produtos = await conexao.query(
      'SELECT id, preco_venda FROM sapataria.produtos WHERE id = ANY($1::integer[]) ORDER BY id FOR UPDATE',
      [[...new Set(itens.map((item) => item.produto_id))]],
    );
    const precos = new Map<number, string>(produtos.rows.map((produto) => [produto.id, produto.preco_venda]));
    if (itens.some((item) => !precos.has(item.produto_id))) throw new ErroHttp(400, 'PRODUTO_INVALIDO', 'Informe somente produtos existentes.');
    const venda = await conexao.query<Venda>(
      `INSERT INTO sapataria.vendas (vendedor_id,forma_pagamento,total) VALUES ($1,$2,0) RETURNING ${colunas}`,
      [vendedorId, formaPagamento],
    );
    const id = venda.rows[0]!.id;
    for (const item of itens) {
      const inserido = await conexao.query(
        `INSERT INTO sapataria.itens_venda (venda_id,produto_id,quantidade,preco_unitario) VALUES ($1,$2,$3,$4) RETURNING id`,
        [id, item.produto_id, item.quantidade, precos.get(item.produto_id)],
      );
      await movimentar(conexao, { tipo: 'saida', produto_id: item.produto_id, material_id: null,
        quantidade: item.quantidade, motivo: `Venda ${id}`, item_venda_id: inserido.rows[0].id });
    }
    // A multiplicação e a soma ocorrem em numeric no PostgreSQL, sem arredondamento de float.
    const resultado = await conexao.query<Venda>(
      `UPDATE sapataria.vendas SET total = (SELECT sum(quantidade * preco_unitario) FROM sapataria.itens_venda WHERE venda_id=$1)
       WHERE id=$1 RETURNING ${colunas}`, [id],
    );
    return resultado.rows[0]!;
  });
}

export async function cancelar(id: number, devolvidos: ItemDevolvido[]) {
  return emTransacao(async (conexao) => {
    const venda = await conexao.query<Venda>(`SELECT ${colunas} FROM sapataria.vendas WHERE id=$1 FOR UPDATE`, [id]);
    if (!venda.rows[0]) throw new ErroHttp(404, 'VENDA_NAO_ENCONTRADA', 'Venda não encontrada.');
    if (venda.rows[0].cancelada_em) throw new ErroHttp(409, 'VENDA_JA_CANCELADA', 'A venda já foi cancelada.');
    const itens = await conexao.query('SELECT id, produto_id FROM sapataria.itens_venda WHERE venda_id=$1', [id]);
    const produtosPorItem = new Map<number, number>(itens.rows.map((item) => [item.id, item.produto_id]));
    if (devolvidos.some((item) => !produtosPorItem.has(item.item_venda_id))) {
      throw new ErroHttp(400, 'ITEM_INVALIDO', 'Os itens devolvidos precisam pertencer a esta venda.');
    }
    // Venda e cancelamento adotam a mesma ordem de bloqueio de produtos.
    await conexao.query('SELECT id FROM sapataria.produtos WHERE id=ANY($1::integer[]) ORDER BY id FOR UPDATE',
      [devolvidos.map((item) => produtosPorItem.get(item.item_venda_id))]);
    for (const item of devolvidos) {
      const origem = await conexao.query('SELECT id FROM sapataria.movimentacoes_estoque WHERE item_venda_id=$1', [item.item_venda_id]);
      if (!origem.rowCount) throw new ErroHttp(409, 'ORIGEM_AUSENTE', 'O item não possui movimentação de origem para devolução.');
      await reverter(conexao, origem.rows[0].id, item.quantidade, `Devolução no cancelamento da venda ${id}`);
    }
    const resultado = await conexao.query<Venda>(
      `UPDATE sapataria.vendas SET cancelada_em=CURRENT_TIMESTAMP WHERE id=$1 RETURNING ${colunas}`, [id],
    );
    return resultado.rows[0]!;
  });
}
