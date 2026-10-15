import { enviarComCsrf, objeto, requisitar } from './api'

export type DadosLoja = { endereco: string }

function dadosLoja(valor: unknown): valor is DadosLoja {
  return objeto(valor) && typeof valor.endereco === 'string'
}

export async function consultarDadosLoja(): Promise<DadosLoja> {
  const resposta = await requisitar('/configuracoes/loja')
  if (!objeto(resposta) || !dadosLoja(resposta.dados)) throw new Error('Não foi possível interpretar o endereço da loja.')
  return resposta.dados
}

export async function atualizarEnderecoLoja(endereco: string): Promise<DadosLoja> {
  const resposta = await enviarComCsrf('/configuracoes/loja', { endereco }, 'PUT')
  if (!objeto(resposta) || !dadosLoja(resposta.dados)) throw new Error('Não foi possível confirmar o endereço salvo.')
  return resposta.dados
}

export async function atualizarSenha(senhaAtual: string, senhaNova: string, confirmarSenhaNova: string): Promise<void> {
  await enviarComCsrf('/auth/senha', {
    senha_atual: senhaAtual,
    senha_nova: senhaNova,
    confirmar_senha_nova: confirmarSenhaNova,
  }, 'PUT')
}
