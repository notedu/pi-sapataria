import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { movimentar, reverter, type Movimento } from './estoqueModel';
import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface MovimentacaoEstoque {
  id: number;
  tipo: string;
  material_id: number | null;
  produto_id: number | null;
  quantidade: string;
  data: Date;
  motivo: string;
  item_venda_id: number | null;
  material_os_id: number | null;
  reversao_de_id: number | null;
}

const colunas = `id, tipo, material_id, produto_id, quantidade, data, motivo, item_venda_id, material_os_id, reversao_de_id`;

export async function listar(): Promise<MovimentacaoEstoque[]> {
  const resultado = await pool.query<MovimentacaoEstoque>(
    `SELECT ${colunas} FROM sapataria.movimentacoes_estoque ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<MovimentacaoEstoque | undefined> {
  const resultado = await pool.query<MovimentacaoEstoque>(
    `SELECT ${colunas} FROM sapataria.movimentacoes_estoque WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export async function criar(dados: Movimento) {
  return emTransacao((conexao) => movimentar(conexao, dados));
}

export async function estornar(id: number, motivo: string) {
  return emTransacao(async (conexao) => {
    const resultado = await conexao.query<MovimentacaoEstoque>(`SELECT ${colunas} FROM sapataria.movimentacoes_estoque WHERE id=$1 FOR UPDATE`, [id]);
    const origem = resultado.rows[0];
    if (!origem) throw new ErroHttp(404, 'MOVIMENTACAO_NAO_ENCONTRADA', 'Movimentação não encontrada.');
    if (origem.item_venda_id !== null || origem.material_os_id !== null || origem.reversao_de_id !== null) {
      throw new ErroHttp(409, 'ORIGEM_VINCULADA', 'Estorne somente movimentos manuais; para vendas e OS, use suas operações de cancelamento/devolução.');
    }
    return reverter(conexao, id, origem.quantidade, motivo);
  });
}
