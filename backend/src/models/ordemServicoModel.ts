import type { PoolClient } from 'pg';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { dadosOs } from '../utils/operacoes';
import { movimentar, reverter } from './estoqueModel';
import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface OrdemServico {
  id: number;
  cliente_id: number;
  responsavel_id: number;
  descricao_calcado: string;
  servico: string;
  valor: string;
  data_entrada: string;
  prazo_entrega: string | null;
  status: string;
  forma_pagamento: string | null;
  observacoes: string | null;
}

const colunas = `id, cliente_id, responsavel_id, descricao_calcado, servico, valor, to_char(data_entrada, 'YYYY-MM-DD') AS data_entrada, to_char(prazo_entrega, 'YYYY-MM-DD') AS prazo_entrega, status, forma_pagamento, observacoes`;

export async function listar(): Promise<OrdemServico[]> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<OrdemServico | undefined> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export type DadosOs = ReturnType<typeof dadosOs>;

async function validarReferencias(conexao: PoolClient, dados: DadosOs) {
  const cliente = await conexao.query('SELECT id FROM sapataria.clientes WHERE id = $1 FOR KEY SHARE', [dados.cliente_id]);
  if (!cliente.rowCount) throw new ErroHttp(400, 'CLIENTE_INVALIDO', 'Informe um cliente existente.');
  const responsavel = await conexao.query('SELECT ativo FROM sapataria.funcionarios WHERE id = $1 FOR SHARE', [dados.responsavel_id]);
  if (!responsavel.rows[0]?.ativo) throw new ErroHttp(400, 'RESPONSAVEL_INVALIDO', 'Selecione um funcionário ativo como responsável.');
}

async function bloquear(conexao: PoolClient, id: number): Promise<OrdemServico> {
  const resultado = await conexao.query<OrdemServico>(`SELECT ${colunas} FROM sapataria.ordens_servico WHERE id = $1 FOR UPDATE`, [id]);
  if (!resultado.rows[0]) throw new ErroHttp(404, 'OS_NAO_ENCONTRADA', 'Ordem de serviço não encontrada.');
  return resultado.rows[0];
}

function exigirEditavel(os: OrdemServico) {
  if (!['Aberta', 'Em andamento'].includes(os.status)) {
    throw new ErroHttp(409, 'OS_NAO_EDITAVEL', 'A operação exige OS Aberta ou Em andamento.');
  }
}

function valores(d: DadosOs) {
  return [d.cliente_id, d.responsavel_id, d.descricao_calcado, d.servico, d.valor, d.prazo_entrega, d.forma_pagamento, d.observacoes];
}

export async function criar(dados: DadosOs) {
  return emTransacao(async (conexao) => {
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<OrdemServico>(
      `INSERT INTO sapataria.ordens_servico
       (cliente_id,responsavel_id,descricao_calcado,servico,valor,prazo_entrega,forma_pagamento,observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${colunas}`, valores(dados),
    );
    return resultado.rows[0]!;
  });
}

export async function atualizar(id: number, dados: DadosOs) {
  return emTransacao(async (conexao) => {
    exigirEditavel(await bloquear(conexao, id));
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<OrdemServico>(
      `UPDATE sapataria.ordens_servico SET cliente_id=$1,responsavel_id=$2,descricao_calcado=$3,
       servico=$4,valor=$5,prazo_entrega=$6,forma_pagamento=$7,observacoes=$8
       WHERE id=$9 RETURNING ${colunas}`, [...valores(dados), id],
    );
    return resultado.rows[0]!;
  });
}

export async function mudarStatus(id: number, status: string) {
  return emTransacao(async (conexao) => {
    const os = await bloquear(conexao, id);
    const proximo: Record<string, string> = { Aberta: 'Em andamento', 'Em andamento': 'Pronta', Pronta: 'Entregue' };
    const cancelamento = status === 'Cancelada' && ['Aberta', 'Em andamento', 'Pronta'].includes(os.status);
    if (!cancelamento && proximo[os.status] !== status) {
      throw new ErroHttp(409, 'TRANSICAO_INVALIDA', 'Avance para o próximo estado; Entregue e Cancelada são estados finais.');
    }
    // Cancelar a OS não devolve materiais já consumidos.
    const resultado = await conexao.query<OrdemServico>(`UPDATE sapataria.ordens_servico SET status=$2 WHERE id=$1 RETURNING ${colunas}`, [id, status]);
    return resultado.rows[0]!;
  });
}

export async function consumir(id: number, materialId: number, quantidade: string) {
  return emTransacao(async (conexao) => {
    exigirEditavel(await bloquear(conexao, id));
    const material = await conexao.query('SELECT id FROM sapataria.materiais WHERE id=$1 FOR UPDATE', [materialId]);
    if (!material.rowCount) throw new ErroHttp(400, 'MATERIAL_INVALIDO', 'Informe um material existente.');
    const resultado = await conexao.query(
      `INSERT INTO sapataria.materiais_os (ordem_servico_id,material_id,quantidade_usada) VALUES ($1,$2,$3) RETURNING *`,
      [id, materialId, quantidade],
    );
    await movimentar(conexao, { tipo: 'saida', material_id: materialId, produto_id: null, quantidade,
      motivo: `Uso de material na OS ${id}`, material_os_id: resultado.rows[0].id });
    return resultado.rows[0];
  });
}

export async function devolverMaterial(id: number, usoId: number, quantidade: string, motivo: string) {
  return emTransacao(async (conexao) => {
    await bloquear(conexao, id);
    const uso = await conexao.query('SELECT id FROM sapataria.materiais_os WHERE id=$1 AND ordem_servico_id=$2', [usoId, id]);
    if (!uso.rowCount) throw new ErroHttp(404, 'USO_NAO_ENCONTRADO', 'Uso de material não encontrado nesta OS.');
    const origem = await conexao.query('SELECT id FROM sapataria.movimentacoes_estoque WHERE material_os_id=$1', [usoId]);
    if (!origem.rowCount) throw new ErroHttp(409, 'ORIGEM_AUSENTE', 'O uso não possui movimentação de origem para devolução.');
    return reverter(conexao, origem.rows[0].id, quantidade, motivo);
  });
}
