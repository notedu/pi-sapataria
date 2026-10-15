import type { PoolClient } from 'pg';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { dadosOs } from '../utils/operacoes';
import { movimentar, reverter } from './estoqueModel';
import { pool } from '../config/db';
import { registrarNaConexao, type NovaAtividade } from './atividadeModel';

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

export async function listar(clienteId?: number, responsavelId?: number): Promise<OrdemServico[]> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico ${clienteId !== undefined ? 'WHERE cliente_id = $1' : responsavelId !== undefined ? 'WHERE responsavel_id = $1' : ''} ORDER BY id`,
    clienteId !== undefined ? [clienteId] : responsavelId !== undefined ? [responsavelId] : [],
  );
  return resultado.rows;
}

export type OrdemClienteComResponsavel = OrdemServico & {
  responsavel_nome: string;
  responsavel_ativo: boolean;
};

// O perfil do cliente recebe apenas a identificação necessária para o histórico de OS.
export async function listarPorClienteComResponsavel(clienteId: number): Promise<OrdemClienteComResponsavel[]> {
  const resultado = await pool.query<OrdemClienteComResponsavel>(
    `SELECT os.id, os.cliente_id, os.responsavel_id, os.descricao_calcado, os.servico,
            os.valor, to_char(os.data_entrada, 'YYYY-MM-DD') AS data_entrada,
            to_char(os.prazo_entrega, 'YYYY-MM-DD') AS prazo_entrega,
            os.status, os.forma_pagamento, os.observacoes,
            f.nome AS responsavel_nome, f.ativo AS responsavel_ativo
       FROM sapataria.ordens_servico AS os
       JOIN sapataria.funcionarios AS f ON f.id = os.responsavel_id
      WHERE os.cliente_id = $1 ORDER BY os.id`,
    [clienteId],
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<OrdemServico | undefined> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export async function buscarComResponsavel(id: number): Promise<OrdemClienteComResponsavel | undefined> {
  const resultado = await pool.query<OrdemClienteComResponsavel>(
    `SELECT os.id, os.cliente_id, os.responsavel_id, os.descricao_calcado, os.servico,
            os.valor, to_char(os.data_entrada, 'YYYY-MM-DD') AS data_entrada,
            to_char(os.prazo_entrega, 'YYYY-MM-DD') AS prazo_entrega,
            os.status, os.forma_pagamento, os.observacoes,
            f.nome AS responsavel_nome, f.ativo AS responsavel_ativo
       FROM sapataria.ordens_servico AS os
       JOIN sapataria.funcionarios AS f ON f.id = os.responsavel_id
      WHERE os.id = $1`,
    [id],
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

export async function criar(dados: DadosOs, ator?: { id: number; nome: string }) {
  return emTransacao(async (conexao) => {
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<OrdemServico>(
      `INSERT INTO sapataria.ordens_servico
       (cliente_id,responsavel_id,descricao_calcado,servico,valor,prazo_entrega,forma_pagamento,observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${colunas}`, valores(dados),
    );
    const ordem = resultado.rows[0]!;
    if (ator) await registrarNaConexao(conexao, {
      atorId: ator.id, atorNome: ator.nome, acao: 'ordem_servico.criada', entidadeTipo: 'ordem_servico', entidadeId: ordem.id,
      detalhes: { status: ordem.status, responsavelId: ordem.responsavel_id }, notificarFuncionarios: [ordem.responsavel_id],
      notificarAdministradores: true, mensagem: `Nova OS #${ordem.id} criada.`,
    });
    return ordem;
  });
}

export async function atualizar(id: number, dados: DadosOs, ator?: { id: number; nome: string }) {
  return emTransacao(async (conexao) => {
    const anterior = await bloquear(conexao, id);
    exigirEditavel(anterior);
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<OrdemServico>(
      `UPDATE sapataria.ordens_servico SET cliente_id=$1,responsavel_id=$2,descricao_calcado=$3,
       servico=$4,valor=$5,prazo_entrega=$6,forma_pagamento=$7,observacoes=$8
       WHERE id=$9 RETURNING ${colunas}`, [...valores(dados), id],
    );
    const ordem = resultado.rows[0]!;
    if (ator) await registrarNaConexao(conexao, {
      atorId: ator.id, atorNome: ator.nome, acao: 'ordem_servico.atualizada', entidadeTipo: 'ordem_servico', entidadeId: ordem.id,
      detalhes: {
        camposAlterados: (['cliente_id', 'responsavel_id', 'descricao_calcado', 'servico', 'valor', 'prazo_entrega', 'forma_pagamento', 'observacoes'] as const)
          .filter(campo => anterior[campo] !== ordem[campo]),
        responsavelAnteriorId: anterior.responsavel_id, responsavelNovoId: ordem.responsavel_id,
      },
      notificarFuncionarios: anterior.responsavel_id !== ordem.responsavel_id ? [ordem.responsavel_id] : [],
      mensagem: `A OS #${ordem.id} foi atribuída a você.`,
    });
    return ordem;
  });
}

export async function mudarStatus(id: number, status: string, ator?: { id: number; nome: string }) {
  return emTransacao(async (conexao) => {
    const os = await bloquear(conexao, id);
    const proximo: Record<string, string> = { Aberta: 'Em andamento', 'Em andamento': 'Pronta', Pronta: 'Entregue' };
    const cancelamento = status === 'Cancelada' && ['Aberta', 'Em andamento', 'Pronta'].includes(os.status);
    if (!cancelamento && proximo[os.status] !== status) {
      throw new ErroHttp(409, 'TRANSICAO_INVALIDA', 'Avance para o próximo estado; Entregue e Cancelada são estados finais.');
    }
    // Cancelar a OS não devolve materiais já consumidos.
    const resultado = await conexao.query<OrdemServico>(`UPDATE sapataria.ordens_servico SET status=$2 WHERE id=$1 RETURNING ${colunas}`, [id, status]);
    const atualizada = resultado.rows[0]!;
    if (ator) await registrarNaConexao(conexao, {
      atorId: ator.id, atorNome: ator.nome, acao: status === 'Cancelada' ? 'ordem_servico.cancelada' : 'ordem_servico.status_alterado',
      entidadeTipo: 'ordem_servico', entidadeId: atualizada.id, detalhes: { statusAnterior: os.status, statusNovo: status },
      notificarFuncionarios: [atualizada.responsavel_id], notificarAdministradores: status === 'Cancelada',
      mensagem: status === 'Pronta' ? `A OS #${id} está pronta para entrega.` : `A OS #${id} mudou para ${status}.`,
    });
    return atualizada;
  });
}

export async function consumir(id: number, materialId: number, quantidade: string, ator?: { id: number; nome: string }) {
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
    if (ator) await registrarNaConexao(conexao, {
      atorId: ator.id, atorNome: ator.nome, acao: 'ordem_servico.material_utilizado', entidadeTipo: 'ordem_servico', entidadeId: id,
      detalhes: { materialId, quantidade },
    });
    return resultado.rows[0];
  });
}

export async function devolverMaterial(id: number, usoId: number, quantidade: string, motivo: string, ator?: { id: number; nome: string }) {
  return emTransacao(async (conexao) => {
    await bloquear(conexao, id);
    const uso = await conexao.query('SELECT id FROM sapataria.materiais_os WHERE id=$1 AND ordem_servico_id=$2', [usoId, id]);
    if (!uso.rowCount) throw new ErroHttp(404, 'USO_NAO_ENCONTRADO', 'Uso de material não encontrado nesta OS.');
    const origem = await conexao.query('SELECT id FROM sapataria.movimentacoes_estoque WHERE material_os_id=$1', [usoId]);
    if (!origem.rowCount) throw new ErroHttp(409, 'ORIGEM_AUSENTE', 'O uso não possui movimentação de origem para devolução.');
    const resultado = await reverter(conexao, origem.rows[0].id, quantidade, motivo);
    if (ator) await registrarNaConexao(conexao, {
      atorId: ator.id, atorNome: ator.nome, acao: 'ordem_servico.material_devolvido', entidadeTipo: 'ordem_servico', entidadeId: id,
      detalhes: { quantidade },
    });
    return resultado;
  });
}
