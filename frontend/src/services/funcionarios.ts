import { enviarComCsrf, objeto, requisitar, ResultadoIncerto } from './api'
import type { Usuario } from './auth'

export type Funcionario = Usuario & { usuario: string; email: string; ativo: boolean; cpf: string | null; telefone: string | null }
export type NovoFuncionario = {
  nome: string
  cpf: string
  telefone: string
  usuario: string
  email: string
  senha: string
  perfil: Usuario['perfil']
}

function funcionario(valor: unknown): valor is Funcionario {
  return objeto(valor) && Number.isInteger(valor.id) && typeof valor.nome === 'string'
    && typeof valor.usuario === 'string' && typeof valor.email === 'string'
    && (valor.cpf === null || typeof valor.cpf === 'string')
    && (valor.telefone === null || typeof valor.telefone === 'string')
    && typeof valor.ativo === 'boolean' && (valor.perfil === 'administrador' || valor.perfil === 'funcionario')
}

export async function listarFuncionarios(): Promise<Funcionario[]> {
  const resposta = await requisitar('/funcionarios')
  if (!objeto(resposta) || !Array.isArray(resposta.dados) || !resposta.dados.every(funcionario)) {
    throw new Error('Não foi possível interpretar a lista de funcionários.')
  }
  return resposta.dados
}

export async function cadastrarFuncionario(dados: NovoFuncionario): Promise<Funcionario> {
  // ativo é omitido: o padrão aprovado da API é true. Confirmação da senha não é enviada.
  const resposta = await enviarComCsrf('/funcionarios', dados)
  if (!objeto(resposta) || !funcionario(resposta.dados)) {
    throw new ResultadoIncerto('Não foi possível confirmar os dados retornados. Consulte a lista antes de cadastrar novamente.')
  }
  return resposta.dados
}


export async function desativarFuncionario(id: number, senha: string): Promise<Funcionario> {
  const resposta = await enviarComCsrf(`/funcionarios/${id}/desativar`, { senha_admin: senha })
  if (!objeto(resposta) || !funcionario(resposta.dados) || resposta.dados.id !== id || resposta.dados.ativo) {
    throw new ResultadoIncerto('Não foi possível confirmar a desativação. Atualize a lista antes de tentar novamente.')
  }
  return resposta.dados
}

export type DadosPessoaisFuncionario = Pick<NovoFuncionario, 'nome' | 'email' | 'cpf' | 'telefone'>

export async function buscarFuncionario(id: string): Promise<Funcionario> {
  const resposta = await requisitar(`/funcionarios/${encodeURIComponent(id)}`)
  if (!objeto(resposta) || !funcionario(resposta.dados)) throw new Error('Não foi possível interpretar os dados do funcionário.')
  return resposta.dados
}

export async function atualizarFuncionario(id: number, dados: DadosPessoaisFuncionario, senha: string): Promise<Funcionario> {
  const resposta = await enviarComCsrf(`/funcionarios/${id}`, { ...dados, senha_admin: senha }, 'PUT')
  if (!objeto(resposta) || !funcionario(resposta.dados) || resposta.dados.id !== id) {
    throw new ResultadoIncerto('Não foi possível confirmar a edição. Confira o perfil antes de repetir.')
  }
  return resposta.dados
}
