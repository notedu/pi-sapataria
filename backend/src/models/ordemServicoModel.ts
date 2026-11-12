import type { PoolClient } from 'pg';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { dadosOs } from '../utils/operacoes';
import { transicaoOsPermitida } from '../utils/ordensServico';
import { movimentar, reverter } from './estoqueModel';
import { pool } from '../config/db';
import { registrarNaConexao, type NovaAtividade } from './atividadeModel';
import * as financeiroModel from './financeiroModel';

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
  pago: boolean;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  itens: ItemOrdemServico[];
  materiais_planejados: MaterialPlanejado[];
}

export type ItemOrdemServico = {
  id: number;
  descricao_item: string;
  servico: string;
};

export type MaterialPlanejado = {
  id: number;
  material_id: number;
  quantidade: string;
};

const colunas = `os.id, os.cliente_id, os.responsavel_id, os.descricao_calcado, os.servico, os.valor,
  to_char(os.data_entrada, 'YYYY-MM-DD') AS data_entrada,
  to_char(os.prazo_entrega, 'YYYY-MM-DD') AS prazo_entrega,
  os.status, os.forma_pagamento, os.observacoes, os.motivo_cancelamento,
  (COALESCE((SELECT SUM(p.valor) FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE l.origem_tipo='ordem_servico' AND l.origem_id=os.id AND l.estorno_de_id IS NULL),0) >= os.valor) AS pago,
  COALESCE((SELECT json_agg(json_build_object('id', i.id, 'descricao_item', i.descricao_item, 'servico', i.servico) ORDER BY i.id)
    FROM sapataria.itens_ordem_servico i WHERE i.ordem_servico_id=os.id), '[]'::json) AS itens,
  COALESCE((SELECT json_agg(json_build_object('id', mp.id, 'material_id', mp.material_id, 'quantidade', mp.quantidade::text) ORDER BY mp.id)
    FROM sapataria.materiais_planejados_os mp WHERE mp.ordem_servico_id=os.id), '[]'::json) AS materiais_planejados`;

export async function listar(
  clienteId?: number,
  responsavelId?: number,
): Promise<OrdemServico[]> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico os ${clienteId !== undefined ? 'WHERE os.cliente_id = $1' : responsavelId !== undefined ? 'WHERE os.responsavel_id = $1' : ''} ORDER BY os.id`,
    clienteId !== undefined
      ? [clienteId]
      : responsavelId !== undefined
        ? [responsavelId]
        : [],
  );
  return resultado.rows;
}

export type OrdemFuncionarioComCliente = OrdemServico & {
  cliente_nome: string;
};

export async function listarPorResponsavelComCliente(
  responsavelId: number,
): Promise<OrdemFuncionarioComCliente[]> {
  const resultado = await pool.query<OrdemFuncionarioComCliente>(
    `SELECT ${colunas}, c.nome AS cliente_nome
       FROM sapataria.ordens_servico AS os
       JOIN sapataria.clientes AS c ON c.id = os.cliente_id
      WHERE os.responsavel_id = $1 ORDER BY os.id`,
    [responsavelId],
  );
  return resultado.rows;
}

export type OrdemClienteComResponsavel = OrdemServico & {
  responsavel_nome: string;
  responsavel_ativo: boolean;
};

export type OrdemDetalhada = OrdemClienteComResponsavel & {
  criado_por_nome: string | null;
  itens: ItemOrdemServico[];
  materiais_planejados: MaterialPlanejado[];
};

// O perfil do cliente recebe apenas a identificação necessária para o histórico de OS.
export async function listarPorClienteComResponsavel(
  clienteId: number,
): Promise<OrdemClienteComResponsavel[]> {
  const resultado = await pool.query<OrdemClienteComResponsavel>(
    `SELECT ${colunas}, f.nome AS responsavel_nome, f.ativo AS responsavel_ativo
       FROM sapataria.ordens_servico AS os
       JOIN sapataria.funcionarios AS f ON f.id = os.responsavel_id
      WHERE os.cliente_id = $1 ORDER BY os.id`,
    [clienteId],
  );
  return resultado.rows;
}

export async function buscar(id: number): Promise<OrdemServico | undefined> {
  const resultado = await pool.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico os WHERE os.id = $1`,
    [id],
  );
  return resultado.rows[0];
}

export async function buscarComResponsavel(
  id: number,
): Promise<OrdemDetalhada | undefined> {
  const resultado = await pool.query<OrdemDetalhada>(
    `SELECT ${colunas},
            f.nome AS responsavel_nome, f.ativo AS responsavel_ativo,
            criacao.ator_nome AS criado_por_nome
       FROM sapataria.ordens_servico AS os
       JOIN sapataria.funcionarios AS f ON f.id = os.responsavel_id
       LEFT JOIN LATERAL (
         SELECT a.ator_nome
           FROM sapataria.atividades AS a
          WHERE a.entidade_tipo = 'ordem_servico'
            AND a.entidade_id = os.id
            AND a.acao = 'ordem_servico.criada'
          ORDER BY a.id
          LIMIT 1
       ) AS criacao ON true
      WHERE os.id = $1`,
    [id],
  );
  return resultado.rows[0];
}

export type DadosOs = ReturnType<typeof dadosOs>;

async function validarReferencias(conexao: PoolClient, dados: DadosOs) {
  const cliente = await conexao.query(
    'SELECT id FROM sapataria.clientes WHERE id = $1 FOR KEY SHARE',
    [dados.cliente_id],
  );
  if (!cliente.rowCount)
    throw new ErroHttp(
      400,
      'CLIENTE_INVALIDO',
      'Informe um cliente existente.',
    );
  const responsavel = await conexao.query(
    'SELECT ativo FROM sapataria.funcionarios WHERE id = $1 FOR SHARE',
    [dados.responsavel_id],
  );
  if (!responsavel.rows[0]?.ativo)
    throw new ErroHttp(
      400,
      'RESPONSAVEL_INVALIDO',
      'Selecione um funcionário ativo como responsável.',
    );
  for (const material of dados.materiais_planejados) {
    const existente = await conexao.query(
      'SELECT id FROM sapataria.materiais WHERE id=$1 FOR KEY SHARE',
      [material.material_id],
    );
    if (!existente.rowCount)
      throw new ErroHttp(
        400,
        'MATERIAL_INVALIDO',
        'Selecione materiais existentes para o planejamento da OS.',
      );
  }
}

async function bloquear(
  conexao: PoolClient,
  id: number,
): Promise<OrdemServico> {
  const resultado = await conexao.query<OrdemServico>(
    `SELECT ${colunas} FROM sapataria.ordens_servico os WHERE os.id = $1 FOR UPDATE`,
    [id],
  );
  if (!resultado.rows[0])
    throw new ErroHttp(
      404,
      'OS_NAO_ENCONTRADA',
      'Ordem de serviço não encontrada.',
    );
  return resultado.rows[0];
}

function exigirEditavel(os: OrdemServico) {
  if (!['Aberta', 'Em andamento'].includes(os.status)) {
    throw new ErroHttp(
      409,
      'OS_NAO_EDITAVEL',
      'A operação exige OS Aberta ou Em andamento.',
    );
  }
}

function valores(d: DadosOs) {
  return [
    d.cliente_id,
    d.responsavel_id,
    d.descricao_calcado,
    d.servico,
    d.valor,
    d.prazo_entrega,
    d.forma_pagamento,
    d.observacoes,
  ];
}

async function salvarComposicao(
  conexao: PoolClient,
  ordemId: number,
  dados: DadosOs,
) {
  await conexao.query(
    'DELETE FROM sapataria.itens_ordem_servico WHERE ordem_servico_id=$1',
    [ordemId],
  );
  for (const item of dados.itens)
    await conexao.query(
      `INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico)
       VALUES ($1,$2,$3)`,
      [ordemId, item.descricao_item, item.servico],
    );
  await conexao.query(
    'DELETE FROM sapataria.materiais_planejados_os WHERE ordem_servico_id=$1',
    [ordemId],
  );
  for (const material of dados.materiais_planejados)
    await conexao.query(
      `INSERT INTO sapataria.materiais_planejados_os (ordem_servico_id,material_id,quantidade)
       VALUES ($1,$2,$3)`,
      [ordemId, material.material_id, material.quantidade],
    );
}

export async function criar(
  dados: DadosOs,
  ator: { id: number; nome: string },
) {
  return emTransacao(async (conexao) => {
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<{ id: number }>(
      `INSERT INTO sapataria.ordens_servico AS os
       (cliente_id,responsavel_id,descricao_calcado,servico,valor,prazo_entrega,forma_pagamento,observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING os.id`,
      valores(dados),
    );
    const ordemId = resultado.rows[0]!.id;
    await salvarComposicao(conexao, ordemId, dados);
    const completa = await conexao.query<OrdemServico>(
      `SELECT ${colunas} FROM sapataria.ordens_servico os WHERE os.id=$1`,
      [ordemId],
    );
    const ordem = completa.rows[0]!;
    await financeiroModel.criarOrdemServico(
      conexao,
      ordem.id,
      ordem.valor,
      ator.id,
      ordem.forma_pagamento as financeiroModel.FormaPagamento | null,
      dados.pago_na_entrada,
    );
    await registrarNaConexao(conexao, {
      atorId: ator.id,
      atorNome: ator.nome,
      acao: 'ordem_servico.criada',
      entidadeTipo: 'ordem_servico',
      entidadeId: ordem.id,
      detalhes: { status: ordem.status, responsavelId: ordem.responsavel_id },
      notificarFuncionarios: [ordem.responsavel_id],
      notificarAdministradores: true,
      mensagem: `Nova OS #${ordem.id} criada.`,
    });
    return ordem;
  });
}

export async function atualizar(
  id: number,
  dados: DadosOs,
  ator?: { id: number; nome: string },
) {
  return emTransacao(async (conexao) => {
    const anterior = await bloquear(conexao, id);
    exigirEditavel(anterior);
    if((await financeiroModel.totalPagoOrigem(conexao,'ordem_servico',id))>0 && anterior.forma_pagamento!==dados.forma_pagamento) throw new ErroHttp(409,'FORMA_PAGAMENTO_OS_PAGA','A forma de pagamento de uma OS já recebida não pode ser alterada.');
    await validarReferencias(conexao, dados);
    const resultado = await conexao.query<{ id: number }>(
      `UPDATE sapataria.ordens_servico AS os SET cliente_id=$1,responsavel_id=$2,descricao_calcado=$3,
       servico=$4,valor=$5,prazo_entrega=$6,forma_pagamento=$7,observacoes=$8
       WHERE os.id=$9 RETURNING os.id`,
      [...valores(dados), id],
    );
    const ordemId = resultado.rows[0]!.id;
    await salvarComposicao(conexao, ordemId, dados);
    const completa = await conexao.query<OrdemServico>(
      `SELECT ${colunas} FROM sapataria.ordens_servico os WHERE os.id=$1`,
      [ordemId],
    );
    const ordem = completa.rows[0]!;
    await financeiroModel.atualizarValorOrigem(
      conexao,
      'ordem_servico',
      ordem.id,
      ordem.valor,
    );
    if (ator)
      await registrarNaConexao(conexao, {
        atorId: ator.id,
        atorNome: ator.nome,
        acao: 'ordem_servico.atualizada',
        entidadeTipo: 'ordem_servico',
        entidadeId: ordem.id,
        detalhes: {
          camposAlterados: (
            [
              'cliente_id',
              'responsavel_id',
              'descricao_calcado',
              'servico',
              'valor',
              'prazo_entrega',
              'forma_pagamento',
              'observacoes',
              'itens',
              'materiais_planejados',
            ] as const
          ).filter((campo) => anterior[campo] !== ordem[campo]),
          responsavelAnteriorId: anterior.responsavel_id,
          responsavelNovoId: ordem.responsavel_id,
        },
        notificarFuncionarios:
          anterior.responsavel_id !== ordem.responsavel_id
            ? [ordem.responsavel_id]
            : [],
        mensagem: `A OS #${ordem.id} foi atribuída a você.`,
      });
    return ordem;
  });
}

export async function mudarStatus(
  id: number,
  status: string,
  motivoCancelamento: string | null,
  ator?: { id: number; nome: string },
  formaPagamento?: financeiroModel.FormaPagamento | null,
) {
  return emTransacao(async (conexao) => {
    const os = await bloquear(conexao, id);
    const cancelamento =
      status === 'Cancelada' &&
      ['Aberta', 'Em andamento', 'Pronta'].includes(os.status);
    if (!transicaoOsPermitida(os.status, status)) {
      throw new ErroHttp(
        409,
        'TRANSICAO_INVALIDA',
        'Avance ou retroceda uma etapa; uma OS cancelada é estado final.',
      );
    }
    if (cancelamento) {
      if (!motivoCancelamento?.trim())
        throw new ErroHttp(
          400,
          'MOTIVO_CANCELAMENTO_OBRIGATORIO',
          'Informe o motivo do cancelamento da OS.',
        );
      const totalPago=await financeiroModel.totalPagoOrigem(conexao,'ordem_servico',id);
      if(totalPago>0) await financeiroModel.estornarOrigem(conexao,'ordem_servico',id,ator?.id??null,motivoCancelamento!.trim());
    }
    if(status==='Entregue') {
      const totalPago=await financeiroModel.totalPagoOrigem(conexao,'ordem_servico',id);
      const falta=Number(os.valor)-totalPago;
      if(falta>0.000001) {
        if(!formaPagamento) throw new ErroHttp(400,'FORMA_PAGAMENTO_OBRIGATORIA','Informe a forma de pagamento para entregar uma OS ainda não paga.');
        const parcela=await conexao.query<{id:number}>(`SELECT pa.id FROM sapataria.parcelas_financeiras pa JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE l.origem_tipo='ordem_servico' AND l.origem_id=$1 AND l.estorno_de_id IS NULL ORDER BY pa.numero LIMIT 1`,[id]);
        if(!parcela.rows[0]) throw new ErroHttp(409,'LANCAMENTO_OS_AUSENTE','Lançamento financeiro da OS não encontrado.');
        await financeiroModel.registrarPagamento(conexao,parcela.rows[0].id,falta.toFixed(2),formaPagamento,ator?.id??null);
      }
    }
    // Cancelar a OS não devolve materiais já consumidos.
    const resultado = await conexao.query<OrdemServico>(
      `UPDATE sapataria.ordens_servico AS os
          SET status=$2,
              forma_pagamento=CASE WHEN $2='Entregue' AND $4::text IS NOT NULL THEN $4::text ELSE os.forma_pagamento END,
              motivo_cancelamento=CASE WHEN $2='Cancelada' THEN $3 ELSE os.motivo_cancelamento END
        WHERE os.id=$1 RETURNING ${colunas}`,
      [id, status, cancelamento ? motivoCancelamento!.trim() : null, formaPagamento ?? null],
    );
    const atualizada = resultado.rows[0]!;
    if (ator)
      await registrarNaConexao(conexao, {
        atorId: ator.id,
        atorNome: ator.nome,
        acao:
          status === 'Cancelada'
            ? 'ordem_servico.cancelada'
            : 'ordem_servico.status_alterado',
        entidadeTipo: 'ordem_servico',
        entidadeId: atualizada.id,
        detalhes: {
          statusAnterior: os.status,
          statusNovo: status,
          ...(cancelamento
            ? { motivoCancelamento: motivoCancelamento!.trim() }
            : {}),
        },
        notificarFuncionarios: [atualizada.responsavel_id],
        notificarAdministradores: status === 'Cancelada',
        mensagem:
          status === 'Pronta'
            ? `A OS #${id} está pronta para entrega.`
            : `A OS #${id} mudou para ${status}.`,
      });
    return atualizada;
  });
}

export async function removerMaterialPlanejado(
  id: number,
  planejadoId: number,
  ator?: { id: number; nome: string },
) {
  return emTransacao(async (conexao) => {
    const os = await bloquear(conexao, id);
    exigirEditavel(os);
    const removido = await conexao.query(
      `DELETE FROM sapataria.materiais_planejados_os
        WHERE id=$1 AND ordem_servico_id=$2 RETURNING material_id, quantidade`,
      [planejadoId, id],
    );
    if (!removido.rowCount)
      throw new ErroHttp(
        404,
        'MATERIAL_PLANEJADO_NAO_ENCONTRADO',
        'Material planejado não encontrado nesta OS.',
      );
    if (ator)
      await registrarNaConexao(conexao, {
        atorId: ator.id,
        atorNome: ator.nome,
        acao: 'ordem_servico.material_planejado_removido',
        entidadeTipo: 'ordem_servico',
        entidadeId: id,
        detalhes: {
          materialId: removido.rows[0].material_id,
          quantidade: removido.rows[0].quantidade,
        },
      });
  });
}

export async function consumir(
  id: number,
  materialId: number,
  quantidade: string,
  ator?: { id: number; nome: string },
) {
  return emTransacao(async (conexao) => {
    exigirEditavel(await bloquear(conexao, id));
    const material = await conexao.query(
      'SELECT id FROM sapataria.materiais WHERE id=$1 FOR UPDATE',
      [materialId],
    );
    if (!material.rowCount)
      throw new ErroHttp(
        400,
        'MATERIAL_INVALIDO',
        'Informe um material existente.',
      );
    const resultado = await conexao.query(
      `INSERT INTO sapataria.materiais_os (ordem_servico_id,material_id,quantidade_usada) VALUES ($1,$2,$3) RETURNING *`,
      [id, materialId, quantidade],
    );
    await movimentar(conexao, {
      tipo: 'saida',
      material_id: materialId,
      produto_id: null,
      quantidade,
      motivo: `Uso de material na OS ${id}`,
      material_os_id: resultado.rows[0].id,
    });
    if (ator)
      await registrarNaConexao(conexao, {
        atorId: ator.id,
        atorNome: ator.nome,
        acao: 'ordem_servico.material_utilizado',
        entidadeTipo: 'ordem_servico',
        entidadeId: id,
        detalhes: { materialId, quantidade },
      });
    return resultado.rows[0];
  });
}

export async function devolverMaterial(
  id: number,
  usoId: number,
  quantidade: string,
  motivo: string,
  ator?: { id: number; nome: string },
) {
  return emTransacao(async (conexao) => {
    await bloquear(conexao, id);
    const uso = await conexao.query(
      'SELECT id FROM sapataria.materiais_os WHERE id=$1 AND ordem_servico_id=$2',
      [usoId, id],
    );
    if (!uso.rowCount)
      throw new ErroHttp(
        404,
        'USO_NAO_ENCONTRADO',
        'Uso de material não encontrado nesta OS.',
      );
    const origem = await conexao.query(
      'SELECT id FROM sapataria.movimentacoes_estoque WHERE material_os_id=$1',
      [usoId],
    );
    if (!origem.rowCount)
      throw new ErroHttp(
        409,
        'ORIGEM_AUSENTE',
        'O uso não possui movimentação de origem para devolução.',
      );
    const resultado = await reverter(
      conexao,
      origem.rows[0].id,
      quantidade,
      motivo,
    );
    if (ator)
      await registrarNaConexao(conexao, {
        atorId: ator.id,
        atorNome: ator.nome,
        acao: 'ordem_servico.material_devolvido',
        entidadeTipo: 'ordem_servico',
        entidadeId: id,
        detalhes: { quantidade },
      });
    return resultado;
  });
}
