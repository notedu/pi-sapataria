import { pool } from '../config/db';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';

export type TipoItem = 'produtos' | 'materiais';
export async function listar() {
  return (await pool.query('SELECT id, nome FROM sapataria.fornecedores ORDER BY nome, id')).rows;
}
export async function salvar(nome: string, id?: number) {
  const resultado = id === undefined
    ? await pool.query('INSERT INTO sapataria.fornecedores (nome) VALUES ($1) RETURNING id, nome', [nome])
    : await pool.query('UPDATE sapataria.fornecedores SET nome = $1 WHERE id = $2 RETURNING id, nome', [nome, id]);
  if (!resultado.rowCount) throw new ErroHttp(404, 'FORNECEDOR_NAO_ENCONTRADO', 'Fornecedor não encontrado.');
  return resultado.rows[0];
}
export async function excluir(id: number) {
  const resultado = await pool.query('DELETE FROM sapataria.fornecedores WHERE id = $1 RETURNING id', [id]);
  if (!resultado.rowCount) throw new ErroHttp(404, 'FORNECEDOR_NAO_ENCONTRADO', 'Fornecedor não encontrado.');
}
export async function vinculos(tipo: TipoItem) {
  const campo = tipo === 'produtos' ? 'produto_id' : 'material_id';
  return (await pool.query(`SELECT ${campo} AS item_id, fornecedor_id FROM sapataria.${tipo}_fornecedores ORDER BY ${campo}, fornecedor_id`)).rows;
}
// Substituir os vínculos é uma operação única: falhas preservam a seleção anterior.
export async function associar(tipo: TipoItem, id: number, ids: number[]) {
  const campo = tipo === 'produtos' ? 'produto_id' : 'material_id';
  await emTransacao(async conexao => {
    const item = await conexao.query(`SELECT id FROM sapataria.${tipo} WHERE id = $1 FOR UPDATE`, [id]);
    if (!item.rowCount) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Item não encontrado.');
    const fornecedores = await conexao.query('SELECT id FROM sapataria.fornecedores WHERE id = ANY($1::integer[]) FOR KEY SHARE', [ids]);
    if (fornecedores.rowCount !== ids.length) throw new ErroHttp(400, 'FORNECEDOR_INVALIDO', 'Selecione fornecedores existentes.');
    await conexao.query(`DELETE FROM sapataria.${tipo}_fornecedores WHERE ${campo} = $1`, [id]);
    await conexao.query(`INSERT INTO sapataria.${tipo}_fornecedores (${campo}, fornecedor_id) SELECT $1, unnest($2::integer[])`, [id, ids]);
  });
}
