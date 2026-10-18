import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { pool } from '../config/db';
import { associarNaConexao } from './fornecedorModel';
import { movimentar } from './estoqueModel';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface Material {
  id: number;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: string;
  quantidade_minima: string;
  custo: string;
  unidade_bloqueada?: boolean;
}

const colunas = `id, nome, categoria, unidade, quantidade, quantidade_minima, custo`;
const consultaColunas = `${colunas}, (quantidade <> 0 OR EXISTS (SELECT 1 FROM sapataria.movimentacoes_estoque WHERE material_id = materiais.id)) AS unidade_bloqueada`;

export async function listar(): Promise<Material[]> {
  const resultado = await pool.query<Material>(
    `SELECT ${consultaColunas} FROM sapataria.materiais ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<Material | undefined> {
  const resultado = await pool.query<Material>(
    `SELECT ${consultaColunas} FROM sapataria.materiais WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export type DadosMaterial = Pick<Material, 'nome' | 'categoria' | 'unidade' | 'quantidade_minima' | 'custo'> & { fornecedores_ids?: number[]; quantidade_inicial?: string };

export async function criar(dados: DadosMaterial): Promise<Material> {
  return emTransacao(async conexao => {
    const resultado = await conexao.query<Material>(
      `INSERT INTO sapataria.materiais (nome, categoria, unidade, quantidade_minima, custo) VALUES ($1, $2, $3, $4, $5) RETURNING ${colunas}`,
      [dados.nome, dados.categoria, dados.unidade, dados.quantidade_minima, dados.custo],
    );
    const item = resultado.rows[0]!;
    if (dados.fornecedores_ids !== undefined) await associarNaConexao(conexao, 'materiais', item.id, dados.fornecedores_ids);
    if (dados.quantidade_inicial && dados.quantidade_inicial !== '0') {
      await movimentar(conexao, { tipo: 'entrada', material_id: item.id, produto_id: null, quantidade: dados.quantidade_inicial, motivo: 'Saldo inicial do cadastro' });
      const atualizado = await conexao.query<Material>(`SELECT ${consultaColunas} FROM sapataria.materiais WHERE id = $1`, [item.id]);
      return { ...atualizado.rows[0]!, unidade_bloqueada: true };
    }
    return { ...item, unidade_bloqueada: false };
  });
}

export async function atualizar(id: number, dados: DadosMaterial): Promise<Material | undefined> {
  return emTransacao(async conexao => {
    // Mesmo bloqueio usado nas movimentações: a verificação não disputa o saldo.
    const atual = await conexao.query<Material>(`SELECT ${consultaColunas} FROM sapataria.materiais WHERE id = $1 FOR UPDATE`, [id]);
    const item = atual.rows[0];
    if (!item) return undefined;
    if (item.unidade !== dados.unidade && item.unidade_bloqueada) throw new ErroHttp(409, 'MATERIAL_UNIDADE_BLOQUEADA', 'Não é permitido trocar a unidade de material com saldo ou movimentações.');
    const resultado = await conexao.query<Material>(
      `UPDATE sapataria.materiais SET nome = $1, categoria = $2, unidade = $3, quantidade_minima = $4, custo = $5 WHERE id = $6 RETURNING ${colunas}`,
      [dados.nome, dados.categoria, dados.unidade, dados.quantidade_minima, dados.custo, id],
    );
    if (dados.fornecedores_ids !== undefined) await associarNaConexao(conexao, 'materiais', id, dados.fornecedores_ids);
    return { ...resultado.rows[0]!, unidade_bloqueada: item.unidade_bloqueada };
  });
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
