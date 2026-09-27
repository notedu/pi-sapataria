import type { PoolClient } from 'pg';
import { ErroHttp } from '../utils/validacao';
import { decimal } from '../utils/operacoes';

export interface Movimento {
  tipo: 'entrada' | 'saida';
  material_id: number | null;
  produto_id: number | null;
  quantidade: string;
  motivo: string;
  item_venda_id?: number;
  material_os_id?: number;
  reversao_de_id?: number;
}

// Único caminho usado por entradas, vendas, consumo e devoluções para alterar saldos.
export async function movimentar(conexao: PoolClient, dados: Movimento) {
  const tabela = dados.material_id !== null ? 'materiais' : 'produtos';
  const id = dados.material_id ?? dados.produto_id;
  decimal(dados.quantidade, 'quantidade', { positivo: true, inteiro: tabela === 'produtos' });
  const item = await conexao.query(`SELECT id FROM sapataria.${tabela} WHERE id = $1 FOR UPDATE`, [id]);
  if (!item.rowCount) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Material ou produto não encontrado.');
  // UPDATE condicional + bloqueio impedem duas requisições de gastar o mesmo saldo.
  const saldo = await conexao.query(
    `UPDATE sapataria.${tabela} SET quantidade = quantidade + $2::numeric
     WHERE id = $1 AND quantidade + $2::numeric >= 0 RETURNING quantidade`,
    [id, dados.tipo === 'saida' ? `-${dados.quantidade}` : dados.quantidade],
  );
  if (!saldo.rowCount) throw new ErroHttp(409, 'ESTOQUE_INSUFICIENTE', 'Saldo insuficiente para concluir a operação.');
  const movimento = await conexao.query(
    `INSERT INTO sapataria.movimentacoes_estoque
     (tipo, material_id, produto_id, quantidade, motivo, item_venda_id, material_os_id, reversao_de_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [dados.tipo, dados.material_id, dados.produto_id, dados.quantidade, dados.motivo,
      dados.item_venda_id ?? null, dados.material_os_id ?? null, dados.reversao_de_id ?? null],
  );
  return movimento.rows[0];
}

// Bloquear a origem serializa devoluções concorrentes e protege seu limite.
export async function reverter(conexao: PoolClient, origemId: number, quantidade: string, motivo: string) {
  const { rows: [origem] } = await conexao.query(
    'SELECT * FROM sapataria.movimentacoes_estoque WHERE id = $1 FOR UPDATE', [origemId],
  );
  if (!origem) throw new ErroHttp(404, 'MOVIMENTACAO_NAO_ENCONTRADA', 'Movimentação não encontrada.');
  if (origem.reversao_de_id !== null) throw new ErroHttp(409, 'REVERSAO_INVALIDA', 'Uma reversão não pode ser estornada novamente.');
  const { rows: [limite] } = await conexao.query(
    `SELECT $2::numeric <= $3::numeric - COALESCE(sum(quantidade), 0) AS permitido
     FROM sapataria.movimentacoes_estoque WHERE reversao_de_id = $1`,
    [origemId, quantidade, origem.quantidade],
  );
  if (!limite.permitido) throw new ErroHttp(409, 'DEVOLUCAO_EXCEDIDA', 'Quantidade excede o saldo ainda disponível para reversão.');
  return movimentar(conexao, {
    tipo: origem.tipo === 'entrada' ? 'saida' : 'entrada', material_id: origem.material_id,
    produto_id: origem.produto_id, quantidade, motivo, reversao_de_id: origemId,
  });
}
