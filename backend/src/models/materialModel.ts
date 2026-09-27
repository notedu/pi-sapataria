import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface Material {
  id: number;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: string;
  quantidade_minima: string;
  custo: string;
}

const colunas = `id, nome, categoria, unidade, quantidade, quantidade_minima, custo`;

export async function listar(): Promise<Material[]> {
  const resultado = await pool.query<Material>(
    `SELECT ${colunas} FROM sapataria.materiais ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<Material | undefined> {
  const resultado = await pool.query<Material>(
    `SELECT ${colunas} FROM sapataria.materiais WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export type DadosMaterial = Pick<Material, 'nome' | 'categoria' | 'unidade' | 'quantidade_minima' | 'custo'>;

export async function criar(dados: DadosMaterial): Promise<Material> {
  const resultado = await pool.query<Material>(
    `INSERT INTO sapataria.materiais (nome, categoria, unidade, quantidade_minima, custo) VALUES ($1, $2, $3, $4, $5) RETURNING ${colunas}`,
    [dados.nome, dados.categoria, dados.unidade, dados.quantidade_minima, dados.custo],
  );
  return resultado.rows[0]!;
}

export async function atualizar(id: number, dados: DadosMaterial): Promise<Material | undefined> {
  const resultado = await pool.query<Material>(
    `UPDATE sapataria.materiais SET nome = $1, categoria = $2, unidade = $3, quantidade_minima = $4, custo = $5 WHERE id = $6 RETURNING ${colunas}`,
    [dados.nome, dados.categoria, dados.unidade, dados.quantidade_minima, dados.custo, id],
  );
  return resultado.rows[0];
}

export async function excluir(id: number): Promise<void> {
  await emTransacao(async (conexao) => {
    const resultado = await conexao.query('SELECT quantidade = 0 AS vazio FROM sapataria.materiais WHERE id = $1 FOR UPDATE', [id]);
    if (!resultado.rowCount) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Cadastro não encontrado.');
    if (!resultado.rows[0].vazio) throw new ErroHttp(409, 'ESTOQUE_NAO_VAZIO', 'Só é possível excluir um cadastro com saldo zero e sem vínculos.');
    // As chaves estrangeiras também impedem exclusão se surgir um vínculo concorrente.
    await conexao.query('DELETE FROM sapataria.materiais WHERE id = $1', [id]);
  });
}
