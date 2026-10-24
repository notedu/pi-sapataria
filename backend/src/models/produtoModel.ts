import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { pool } from '../config/db';
import { associarNaConexao } from './fornecedorModel';
import { movimentar } from './estoqueModel';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  quantidade: string;
  preco_custo: string;
  preco_venda: string;
  quantidade_minima: string | null;
}

const colunas = `id, nome, categoria, quantidade, quantidade_minima, preco_custo, preco_venda`;

export async function listar(): Promise<Produto[]> {
  const resultado = await pool.query<Produto>(
    `SELECT ${colunas} FROM sapataria.produtos ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<Produto | undefined> {
  const resultado = await pool.query<Produto>(
    `SELECT ${colunas} FROM sapataria.produtos WHERE id = $1`,
    [id],
  );
  return resultado.rows[0];
}

export type DadosProduto = Pick<
  Produto,
  'nome' | 'categoria' | 'preco_custo' | 'preco_venda' | 'quantidade_minima'
> & { fornecedores_ids?: number[]; quantidade_inicial?: string };

export async function criar(dados: DadosProduto): Promise<Produto> {
  return emTransacao(async (conexao) => {
    const resultado = await conexao.query<Produto>(
      `INSERT INTO sapataria.produtos (nome, categoria, preco_custo, preco_venda, quantidade_minima) VALUES ($1, $2, $3, $4, $5) RETURNING ${colunas}`,
      [
        dados.nome,
        dados.categoria,
        dados.preco_custo,
        dados.preco_venda,
        dados.quantidade_minima,
      ],
    );
    const item = resultado.rows[0]!;
    if (dados.fornecedores_ids !== undefined)
      await associarNaConexao(
        conexao,
        'produtos',
        item.id,
        dados.fornecedores_ids,
      );
    if (dados.quantidade_inicial && dados.quantidade_inicial !== '0') {
      await movimentar(conexao, {
        tipo: 'entrada',
        material_id: null,
        produto_id: item.id,
        quantidade: dados.quantidade_inicial,
        motivo: 'Saldo inicial do cadastro',
      });
      const atualizado = await conexao.query<Produto>(
        `SELECT ${colunas} FROM sapataria.produtos WHERE id = $1`,
        [item.id],
      );
      return atualizado.rows[0]!;
    }
    return item;
  });
}

export async function atualizar(
  id: number,
  dados: DadosProduto,
): Promise<Produto | undefined> {
  return emTransacao(async (conexao) => {
    const resultado = await conexao.query<Produto>(
      `UPDATE sapataria.produtos SET nome = $1, categoria = $2, preco_custo = $3, preco_venda = $4, quantidade_minima = $5 WHERE id = $6 RETURNING ${colunas}`,
      [
        dados.nome,
        dados.categoria,
        dados.preco_custo,
        dados.preco_venda,
        dados.quantidade_minima,
        id,
      ],
    );
    const item = resultado.rows[0];
    if (item && dados.fornecedores_ids !== undefined)
      await associarNaConexao(conexao, 'produtos', id, dados.fornecedores_ids);
    return item;
  });
}

export async function excluir(id: number): Promise<void> {
  await emTransacao(async (conexao) => {
    const resultado = await conexao.query(
      'SELECT quantidade = 0 AS vazio FROM sapataria.produtos WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!resultado.rowCount)
      throw new ErroHttp(
        404,
        'ITEM_NAO_ENCONTRADO',
        'Cadastro não encontrado.',
      );
    if (!resultado.rows[0].vazio)
      throw new ErroHttp(
        409,
        'ESTOQUE_NAO_VAZIO',
        'Só é possível excluir um cadastro com saldo zero e sem vínculos.',
      );
    // As chaves estrangeiras também impedem exclusão se surgir um vínculo concorrente.
    await conexao.query('DELETE FROM sapataria.produtos WHERE id = $1', [id]);
  });
}
