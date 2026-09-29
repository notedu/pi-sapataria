import { objeto } from './api'

export type EnderecoCep = { logradouro: string; bairro: string; localidade: string; uf: string }

export async function consultarCep(cep: string, signal: AbortSignal): Promise<EnderecoCep> {
  if (!/^\d{8}$/.test(cep)) throw new Error('Informe os 8 números do CEP.')
  // Apenas o CEP é enviado ao serviço externo; cookies e dados pessoais não acompanham a consulta.
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    credentials: 'omit', signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  })
  if (!resposta.ok) throw new Error('Não foi possível consultar o CEP. Tente novamente.')
  const dados: unknown = await resposta.json()
  if (objeto(dados) && (dados.erro === true || dados.erro === 'true')) throw new Error('CEP não encontrado.')
  if (!objeto(dados) || typeof dados.logradouro !== 'string' || typeof dados.bairro !== 'string'
    || typeof dados.localidade !== 'string' || typeof dados.uf !== 'string') throw new Error('Resposta de endereço inválida.')
  return { logradouro: dados.logradouro, bairro: dados.bairro, localidade: dados.localidade, uf: dados.uf }
}
