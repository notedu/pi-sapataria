import { ErroApi, enviarComCsrf, objeto, requisitar, ResultadoIncerto } from './api'

export type DadosCliente = {
  nome: string
  telefone: string
  cpf: string
  cep: string
  numero: string
  email: string | null
  observacoes: string | null
}
export type Cliente = Omit<DadosCliente, 'cpf' | 'cep' | 'numero'> & {
  id: number; cpf: string | null; cep: string | null; numero: string | null
  endereco: string | null; criado_em: string | null
}

function cliente(valor: unknown): valor is Cliente {
  return objeto(valor) && Number.isInteger(valor.id) && typeof valor.nome === 'string'
    && typeof valor.telefone === 'string'
    && ['cpf', 'cep', 'numero', 'endereco', 'criado_em'].every(campo => valor[campo] === null || typeof valor[campo] === 'string')
    && (valor.email === null || typeof valor.email === 'string')
    && (valor.observacoes === null || typeof valor.observacoes === 'string')
}

export async function listarClientes(): Promise<Cliente[]> {
  const resposta = await requisitar('/clientes')
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every(cliente)) {
    throw new Error('Não foi possível interpretar a lista de clientes.')
  }
  return resposta.dados
}

export async function cadastrarCliente(dados: DadosCliente): Promise<Cliente> {
  const resposta = await enviarComCsrf('/clientes', dados)
  if (!objeto(resposta) || !cliente(resposta.dados)) {
    throw new ResultadoIncerto('Não foi possível confirmar o cadastro. Consulte a lista antes de cadastrar novamente.')
  }
  return resposta.dados
}

export async function buscarCliente(id: string): Promise<Cliente> {
  const resposta = await requisitar(`/clientes/${encodeURIComponent(id)}`)
  if (!objeto(resposta) || !cliente(resposta.dados)) throw new Error('Não foi possível interpretar os dados do cliente.')
  return resposta.dados
}

export type OrdemCliente = { id: number; servico: string; status: string; valor: string; data_entrada: string; prazo_entrega: string | null }
export async function listarOrdensCliente(id: string): Promise<OrdemCliente[]> {
  const resposta = await requisitar(`/clientes/${encodeURIComponent(id)}/ordens-servico`)
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every((os: unknown) =>
    objeto(os) && Number.isInteger(os.id) && typeof os.servico === 'string' && typeof os.status === 'string'
      && typeof os.valor === 'string' && typeof os.data_entrada === 'string'
      && (os.prazo_entrega === null || typeof os.prazo_entrega === 'string'))) throw new Error('Não foi possível interpretar as ordens de serviço.')
  return resposta.dados as OrdemCliente[]
}

export async function excluirCliente(id: number): Promise<void> {
  try {
    const resposta = await enviarComCsrf(`/clientes/${id}`, undefined, 'DELETE')
    if (resposta !== null) throw new ResultadoIncerto('Não foi possível confirmar a exclusão. Consulte a lista antes de tentar novamente.')
  } catch (error) {
    if (error instanceof ErroApi && error.status === 409) {
      throw new ErroApi(409, 'Este cliente possui ordens de serviço vinculadas e não pode ser excluído.', error.codigo)
    }
    throw error
  }
}

export async function atualizarCliente(id: number, dados: DadosCliente): Promise<Cliente> {
  const resposta = await enviarComCsrf(`/clientes/${id}`, dados, 'PUT')
  if (!objeto(resposta) || !cliente(resposta.dados) || resposta.dados.id !== id) {
    throw new ResultadoIncerto('Não foi possível confirmar a edição. Consulte o perfil antes de tentar novamente.')
  }
  return resposta.dados
}
