import { pool } from '../config/db';

export type TipoCategoriaEstoque = 'produtos' | 'materiais';
export type CategoriaEstoque = { id: number; tipo: TipoCategoriaEstoque; nome: string };

export async function listar(tipo?: TipoCategoriaEstoque): Promise<CategoriaEstoque[]> {
  const valores = tipo ? [tipo] : [];
  const filtro = tipo ? 'WHERE tipo = $1' : '';
  const resultado = await pool.query<CategoriaEstoque>(
    `SELECT id, tipo, nome FROM sapataria.categorias_estoque ${filtro} ORDER BY tipo, lower(nome), id`, valores,
  );
  return resultado.rows;
}

export async function criar(tipo: TipoCategoriaEstoque, nome: string): Promise<CategoriaEstoque> {
  const resultado = await pool.query<CategoriaEstoque>(
    `INSERT INTO sapataria.categorias_estoque (tipo, nome) VALUES ($1, $2)
     RETURNING id, tipo, nome`, [tipo, nome],
  );
  return resultado.rows[0]!;
}
