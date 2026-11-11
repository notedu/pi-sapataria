import {
  enviarComCsrf,
  ErroApi,
  objeto,
  requisitar,
  ResultadoIncerto,
} from './api'

export type OrdemResumo = {
  id: number
  cliente_id: number
  responsavel_id: number
  descricao_calcado: string
  servico: string
  valor: string
  data_entrada: string
  prazo_entrega: string | null
  status: string
  forma_pagamento: string | null
  pago: boolean
  observacoes: string | null
  cliente_nome?: string
  motivo_cancelamento: string | null
  itens?: ItemOrdemServico[]
  materiais_planejados?: MaterialPlanejadoOs[]
}
export type OrdemDetalhada = OrdemResumo & {
  responsavel_nome: string
  responsavel_ativo: boolean
  criado_por_nome: string | null
  motivo_cancelamento: string | null
  itens: ItemOrdemServico[]
  materiais_planejados: MaterialPlanejadoOs[]
}

export type ItemOrdemServico = {
  id?: number
  descricao_item: string
  servico: string
}

export type MaterialPlanejadoOs = {
  id: number
  material_id: number
  quantidade: string
}

export type DadosOrdem = Pick<
  OrdemResumo,
  | 'cliente_id'
  | 'responsavel_id'
  | 'valor'
  | 'prazo_entrega'
  | 'forma_pagamento'
  | 'observacoes'
> & {
  pago_na_entrada?: boolean
  itens: ItemOrdemServico[]
  materiais_planejados: Array<{
    material_id: number
    quantidade: string
  }>
}
export type DadosNovaOrdem = Omit<DadosOrdem, 'responsavel_id'>
export type UsoMaterial = {
  id: number
  material_id: number
  quantidade_usada: string
  quantidade_devolvida: string
  quantidade_restante: string
}
export type MaterialDisponivel = {
  id: number
  nome: string
  unidade: string
  quantidade: string
}

export function ordem(valor: unknown): valor is OrdemResumo {
  return (
    objeto(valor) &&
    Number.isInteger(valor.id) &&
    Number.isInteger(valor.cliente_id) &&
    Number.isInteger(valor.responsavel_id) &&
    typeof valor.descricao_calcado === 'string' &&
    typeof valor.servico === 'string' &&
    typeof valor.valor === 'string' &&
    typeof valor.data_entrada === 'string' &&
    typeof valor.status === 'string' &&
    typeof valor.pago === 'boolean' &&
    (valor.prazo_entrega === null || typeof valor.prazo_entrega === 'string') &&
    (valor.forma_pagamento === null ||
      typeof valor.forma_pagamento === 'string') &&
    (valor.observacoes === null || typeof valor.observacoes === 'string') &&
    (valor.motivo_cancelamento === null ||
      typeof valor.motivo_cancelamento === 'string') &&
    (valor.cliente_nome === undefined || typeof valor.cliente_nome === 'string')
  )
}

export function ordemDetalhada(valor: unknown): valor is OrdemDetalhada {
  return (
    ordem(valor) &&
    typeof (valor as unknown as Record<string, unknown>).responsavel_nome ===
      'string' &&
    typeof (valor as unknown as Record<string, unknown>).responsavel_ativo ===
      'boolean' &&
    ((valor as unknown as Record<string, unknown>).motivo_cancelamento === null ||
      typeof (valor as unknown as Record<string, unknown>)
        .motivo_cancelamento === 'string') &&
    Array.isArray((valor as unknown as Record<string, unknown>).itens) &&
    ((valor as unknown as Record<string, unknown>).itens as unknown[]).every(
      (item) =>
        objeto(item) &&
        Number.isInteger(item.id) &&
        typeof item.descricao_item === 'string' &&
        typeof item.servico === 'string',
    ) &&
    Array.isArray(
      (valor as unknown as Record<string, unknown>).materiais_planejados,
    ) &&
    (
      (valor as unknown as Record<string, unknown>)
        .materiais_planejados as unknown[]
    ).every(
      (material) =>
        objeto(material) &&
        Number.isInteger(material.id) &&
        Number.isInteger(material.material_id) &&
        typeof material.quantidade === 'string',
    ) &&
    ((valor as unknown as Record<string, unknown>).criado_por_nome === null ||
      typeof (valor as unknown as Record<string, unknown>).criado_por_nome ===
        'string')
  )
}

export async function listarOrdens(
  caminho = '/ordens-servico',
): Promise<OrdemResumo[]> {
  const resposta = await requisitar(caminho)
  if (
    !objeto(resposta) ||
    !Array.isArray(resposta.dados) ||
    !resposta.dados.every(ordem)
  )
    throw new Error('Não foi possível interpretar as ordens de serviço.')
  return resposta.dados
}

export async function buscarOrdem(id: string): Promise<OrdemDetalhada> {
  const resposta = await requisitar(`/ordens-servico/${encodeURIComponent(id)}`)
  if (!objeto(resposta) || !ordemDetalhada(resposta.dados))
    throw new Error('Não foi possível interpretar a ordem de serviço.')
  return resposta.dados
}

export async function cadastrarOrdem(
  dados: DadosNovaOrdem,
): Promise<OrdemResumo> {
  const resposta = await enviarComCsrf('/ordens-servico', dados)
  if (!objeto(resposta) || !ordem(resposta.dados))
    throw new ResultadoIncerto(
      'Não foi possível confirmar o cadastro. Consulte a lista antes de repetir.',
    )
  return resposta.dados
}

export async function atualizarOrdem(
  id: number,
  dados: DadosOrdem,
): Promise<OrdemResumo> {
  let resposta: unknown
  try {
    resposta = await enviarComCsrf(`/ordens-servico/${id}`, dados, 'PUT')
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409)
      throw new ErroApi(
        409,
        'Esta OS não pode mais ser editada. Consulte o estado atual.',
        error.codigo,
      )
    throw error
  }
  if (!objeto(resposta) || !ordem(resposta.dados) || resposta.dados.id !== id)
    throw new ResultadoIncerto(
      'Não foi possível confirmar a edição. Consulte a OS antes de repetir.',
    )
  return resposta.dados
}

export async function mudarStatusOrdem(
  id: number,
  status: string,
  motivoCancelamento?: string,
  formaPagamento?: string,
): Promise<OrdemResumo> {
  let resposta: unknown
  try {
    resposta = await enviarComCsrf(
      `/ordens-servico/${id}/status`,
      {
        status,
        ...(motivoCancelamento === undefined
          ? {}
          : { motivo_cancelamento: motivoCancelamento }),
        ...(formaPagamento ? { forma_pagamento: formaPagamento } : {}),
      },
      'PUT',
    )
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409)
      throw new ErroApi(
        409,
        error.codigo === 'OS_PAGA_NAO_CANCELAVEL'
          ? 'Não é possível cancelar uma OS que já possui pagamento.'
          : 'A OS mudou de estado ou não permite essa transição. Atualize a página.',
        error.codigo,
      )
    throw error
  }
  if (!objeto(resposta) || !ordem(resposta.dados) || resposta.dados.id !== id)
    throw new ResultadoIncerto(
      'Não foi possível confirmar o novo estado. Consulte a OS antes de repetir.',
    )
  return resposta.dados
}

export async function listarUsosOrdem(id: number): Promise<UsoMaterial[]> {
  const resposta = await requisitar(`/ordens-servico/${id}/materiais`)
  if (
    !objeto(resposta) ||
    !Array.isArray(resposta.dados) ||
    !resposta.dados.every(
      (uso: unknown) =>
        objeto(uso) &&
        Number.isInteger(uso.id) &&
        Number.isInteger(uso.material_id) &&
        typeof uso.quantidade_usada === 'string' &&
        typeof uso.quantidade_devolvida === 'string' &&
        typeof uso.quantidade_restante === 'string',
    )
  )
    throw new Error('Não foi possível interpretar os materiais utilizados.')
  return resposta.dados
}

export async function registrarDevolucaoMaterial(
  id: number,
  usoId: number,
  quantidade: string,
  motivo: string,
): Promise<void> {
  let resposta: unknown
  try {
    resposta = await enviarComCsrf(
      `/ordens-servico/${id}/materiais/${usoId}/devolucoes`,
      { quantidade, motivo },
    )
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409)
      throw new ErroApi(
        409,
        'A quantidade excede o que ainda pode ser devolvido. Atualize a OS e confira o saldo restante.',
        error.codigo,
      )
    throw error
  }
  if (!objeto(resposta) || !objeto(resposta.dados))
    throw new ResultadoIncerto(
      'Não foi possível confirmar a devolução. Consulte a OS antes de repetir.',
    )
}


export async function removerMaterialPlanejado(
  id: number,
  planejadoId: number,
): Promise<void> {
  try {
    await enviarComCsrf(
      `/ordens-servico/${id}/materiais-planejados/${planejadoId}`,
      undefined,
      'DELETE',
    )
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409)
      throw new ErroApi(
        409,
        'O planejamento só pode ser alterado em OS Aberta ou Em andamento.',
        error.codigo,
      )
    throw error
  }
}

export async function listarMateriaisDisponiveis(): Promise<
  MaterialDisponivel[]
> {
  const resposta = await requisitar('/materiais')
  if (
    !objeto(resposta) ||
    !Array.isArray(resposta.dados) ||
    !resposta.dados.every(
      (material: unknown) =>
        objeto(material) &&
        Number.isInteger(material.id) &&
        typeof material.nome === 'string' &&
        typeof material.unidade === 'string' &&
        typeof material.quantidade === 'string',
    )
  )
    throw new Error('Não foi possível interpretar a lista de materiais.')
  return resposta.dados
}

export async function registrarUsoMaterial(
  id: number,
  materialId: number,
  quantidade: string,
): Promise<void> {
  let resposta: unknown
  try {
    resposta = await enviarComCsrf(`/ordens-servico/${id}/materiais`, {
      material_id: materialId,
      quantidade_usada: quantidade,
    })
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409)
      throw new ErroApi(
        409,
        'Não foi possível registrar o uso. Confira o saldo e o estado da OS.',
        error.codigo,
      )
    throw error
  }
  if (
    !objeto(resposta) ||
    !objeto(resposta.dados) ||
    !Number.isInteger(resposta.dados.id)
  )
    throw new ResultadoIncerto(
      'Não foi possível confirmar o uso. Consulte a OS antes de repetir.',
    )
}
