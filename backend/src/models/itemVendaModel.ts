import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface ItemVenda {
  id: number;
  venda_id: number;
  produto_id: number;
  quantidade: string;
  preco_unitario: string;
}

const colunas = `id, venda_id, produto_id, quantidade, preco_unitario`;

export async function listarPorVenda(id: number): Promise<ItemVenda[]> {
  const resultado = await pool.query<ItemVenda>(
    `SELECT ${colunas} FROM sapataria.itens_venda WHERE venda_id = $1 ORDER BY id`, [id],
  );
  return resultado.rows;
}
