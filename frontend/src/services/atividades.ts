import { enviarComCsrf, objeto, requisitar } from './api'

export type Atividade = {
  id: number
  ator_id: number | null
  ator_nome: string
  acao: string
  entidade_tipo: string
  entidade_id: number | null
  detalhes: Record<string, unknown>
  criado_em: string
}

export type Notificacao = {
  id: string
  mensagem: string
  criada_em: string
  lida_em: string | null
  acao: string
  entidade_tipo: string
  entidade_id: number | null
  ator_nome: string
}

function extrairLista<T>(
  resposta: unknown,
  validar: (item: unknown) => item is T,
): T[] {
  const dados = objeto(resposta) ? resposta.dados : null
  if (!Array.isArray(dados) || !dados.every(validar))
    throw new Error('A API retornou dados inválidos.')
  return dados
}

function atividadeValida(valor: unknown): valor is Atividade {
  return (
    objeto(valor) &&
    Number.isInteger(valor.id) &&
    (valor.ator_id === null || Number.isInteger(valor.ator_id)) &&
    typeof valor.ator_nome === 'string' &&
    typeof valor.acao === 'string' &&
    typeof valor.entidade_tipo === 'string' &&
    (valor.entidade_id === null || Number.isInteger(valor.entidade_id)) &&
    objeto(valor.detalhes) &&
    typeof valor.criado_em === 'string'
  )
}

function notificacaoValida(valor: unknown): valor is Notificacao {
  return (
    objeto(valor) &&
    typeof valor.id === 'string' &&
    /^[1-9]\d*$/.test(valor.id) &&
    typeof valor.mensagem === 'string' &&
    typeof valor.criada_em === 'string' &&
    (valor.lida_em === null || typeof valor.lida_em === 'string') &&
    typeof valor.acao === 'string' &&
    typeof valor.entidade_tipo === 'string' &&
    (valor.entidade_id === null || Number.isInteger(valor.entidade_id)) &&
    typeof valor.ator_nome === 'string'
  )
}

export async function listarAtividades(
  filtros: {
    de?: string
    ate?: string
    funcionario_id?: number
    acao?: string
  } = {},
): Promise<Atividade[]> {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== '') params.set(chave, String(valor))
  })
  const resposta = await requisitar(
    `/atividades${params.size ? `?${params}` : ''}`,
  )
  return extrairLista(resposta, atividadeValida)
}

export async function listarNotificacoes(): Promise<Notificacao[]> {
  return extrairLista(await requisitar('/notificacoes'), notificacaoValida)
}

export async function contarNotificacoesNaoLidas(): Promise<number> {
  const resposta = await requisitar('/notificacoes/nao-lidas')
  const dados = objeto(resposta) ? resposta.dados : null
  if (!objeto(dados) || !Number.isInteger(dados.quantidade))
    throw new Error('A API retornou uma contagem inválida.')
  return dados.quantidade as number
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  await enviarComCsrf(`/notificacoes/${id}/lida`)
  window.dispatchEvent(new Event('notificacoes-atualizadas'))
}

export async function marcarTodasNotificacoesLidas(): Promise<void> {
  await enviarComCsrf('/notificacoes/lidas')
  window.dispatchEvent(new Event('notificacoes-atualizadas'))
}
