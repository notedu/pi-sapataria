import { enviarComCsrf, ErroApi, objeto, requisitar, ResultadoIncerto } from './api'

export type OrdemResumo = {
  id: number; cliente_id: number; responsavel_id: number; descricao_calcado: string
  servico: string; valor: string; data_entrada: string; prazo_entrega: string | null
  status: string; forma_pagamento: string | null; observacoes: string | null
}

export type DadosOrdem = Pick<OrdemResumo, 'cliente_id' | 'responsavel_id' | 'descricao_calcado' | 'servico' | 'valor' | 'prazo_entrega' | 'forma_pagamento' | 'observacoes'>
export type UsoMaterial = { id: number; material_id: number; quantidade_usada: string }
export type MaterialDisponivel = { id: number; nome: string; unidade: string; quantidade: string }

function ordem(valor: unknown): valor is OrdemResumo {
  return objeto(valor) && Number.isInteger(valor.id) && Number.isInteger(valor.cliente_id)
    && Number.isInteger(valor.responsavel_id) && typeof valor.descricao_calcado === 'string'
    && typeof valor.servico === 'string' && typeof valor.valor === 'string'
    && typeof valor.data_entrada === 'string' && typeof valor.status === 'string'
    && (valor.prazo_entrega === null || typeof valor.prazo_entrega === 'string')
    && (valor.forma_pagamento === null || typeof valor.forma_pagamento === 'string')
    && (valor.observacoes === null || typeof valor.observacoes === 'string')
}

export async function listarOrdens(caminho = '/ordens-servico'): Promise<OrdemResumo[]> {
  const resposta = await requisitar(caminho)
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every(ordem)) throw new Error('Não foi possível interpretar as ordens de serviço.')
  return resposta.dados
}

export async function buscarOrdem(id: string): Promise<OrdemResumo> {
  const resposta = await requisitar(`/ordens-servico/${encodeURIComponent(id)}`)
  if (!objeto(resposta) || !ordem(resposta.dados)) throw new Error('Não foi possível interpretar a ordem de serviço.')
  return resposta.dados
}

export async function cadastrarOrdem(dados: DadosOrdem): Promise<OrdemResumo> {
  const resposta = await enviarComCsrf('/ordens-servico', dados)
  if (!objeto(resposta) || !ordem(resposta.dados)) throw new ResultadoIncerto('Não foi possível confirmar o cadastro. Consulte a lista antes de repetir.')
  return resposta.dados
}

export async function atualizarOrdem(id: number, dados: DadosOrdem): Promise<OrdemResumo> {
  let resposta: unknown
  try { resposta = await enviarComCsrf(`/ordens-servico/${id}`, dados, 'PUT') }
  catch (error) {
    if (error instanceof ErroApi && error.status === 409) throw new ErroApi(409, 'Esta OS não pode mais ser editada. Consulte o estado atual.', error.codigo)
    throw error
  }
  if (!objeto(resposta) || !ordem(resposta.dados) || resposta.dados.id !== id) throw new ResultadoIncerto('Não foi possível confirmar a edição. Consulte a OS antes de repetir.')
  return resposta.dados
}

export async function mudarStatusOrdem(id: number, status: string): Promise<OrdemResumo> {
  let resposta: unknown
  try { resposta = await enviarComCsrf(`/ordens-servico/${id}/status`, { status }, 'PUT') }
  catch (error) {
    if (error instanceof ErroApi && error.status === 409) throw new ErroApi(409, 'O estado da OS mudou. Atualize a página antes de tentar novamente.', error.codigo)
    throw error
  }
  if (!objeto(resposta) || !ordem(resposta.dados) || resposta.dados.id !== id) throw new ResultadoIncerto('Não foi possível confirmar o novo estado. Consulte a OS antes de repetir.')
  return resposta.dados
}

export async function listarUsosOrdem(id: number): Promise<UsoMaterial[]> {
  const resposta = await requisitar(`/ordens-servico/${id}/materiais`)
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every((uso: unknown) => objeto(uso) && Number.isInteger(uso.id) && Number.isInteger(uso.material_id) && typeof uso.quantidade_usada === 'string')) throw new Error('Não foi possível interpretar os materiais utilizados.')
  return resposta.dados
}

export async function listarMateriaisDisponiveis(): Promise<MaterialDisponivel[]> {
  const resposta = await requisitar('/materiais')
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every((material: unknown) => objeto(material) && Number.isInteger(material.id) && typeof material.nome === 'string' && typeof material.unidade === 'string' && typeof material.quantidade === 'string')) throw new Error('Não foi possível interpretar a lista de materiais.')
  return resposta.dados
}

export async function registrarUsoMaterial(id: number, materialId: number, quantidade: string): Promise<void> {
  let resposta: unknown
  try { resposta = await enviarComCsrf(`/ordens-servico/${id}/materiais`, { material_id: materialId, quantidade_usada: quantidade }) }
  catch (error) {
    if (error instanceof ErroApi && error.status === 409) throw new ErroApi(409, 'Não foi possível registrar o uso. Confira o saldo e o estado da OS.', error.codigo)
    throw error
  }
  if (!objeto(resposta) || !objeto(resposta.dados) || !Number.isInteger(resposta.dados.id)) throw new ResultadoIncerto('Não foi possível confirmar o uso. Consulte a OS antes de repetir.')
}
