import { objeto, requisitar } from './api'

export type OrdemResumo = { id: number; servico: string; status: string; valor: string; data_entrada: string; prazo_entrega: string | null }

export async function listarOrdens(caminho: string): Promise<OrdemResumo[]> {
  const resposta = await requisitar(caminho)
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every((os: unknown) =>
    objeto(os) && Number.isInteger(os.id) && typeof os.servico === 'string' && typeof os.status === 'string'
      && typeof os.valor === 'string' && typeof os.data_entrada === 'string'
      && (os.prazo_entrega === null || typeof os.prazo_entrega === 'string'))) throw new Error('Não foi possível interpretar as ordens de serviço.')
  return resposta.dados as OrdemResumo[]
}
