import { objeto } from './api'

export type EnderecoCep = {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export async function buscarCepPorEndereco(
  uf: string,
  cidade: string,
  logradouro: string,
  signal: AbortSignal,
): Promise<Array<EnderecoCep & { cep: string }>> {
  if (!/^[A-Z]{2}$/.test(uf) || !cidade.trim() || logradouro.trim().length < 3)
    return []
  const caminho = [uf, cidade.trim(), logradouro.trim()]
    .map(encodeURIComponent)
    .join('/')
  const resposta = await fetch(`https://viacep.com.br/ws/${caminho}/json/`, {
    credentials: 'omit',
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  })
  if (!resposta.ok) throw new Error('Não foi possível pesquisar o endereço.')
  const dados: unknown = await resposta.json()
  if (!Array.isArray(dados)) throw new Error('Resposta de endereço inválida.')
  return dados.flatMap((valor) =>
    objeto(valor) &&
    typeof valor.cep === 'string' &&
    typeof valor.logradouro === 'string' &&
    typeof valor.bairro === 'string' &&
    typeof valor.localidade === 'string' &&
    typeof valor.uf === 'string'
      ? [{
          cep: valor.cep.replace(/\D/g, ''),
          logradouro: valor.logradouro,
          bairro: valor.bairro,
          localidade: valor.localidade,
          uf: valor.uf,
        }]
      : [],
  )
}

export async function consultarCep(
  cep: string,
  signal: AbortSignal,
): Promise<EnderecoCep> {
  if (!/^\d{8}$/.test(cep)) throw new Error('Informe os 8 números do CEP.')
  // Apenas o endereço consultado é enviado; cookies e outros dados pessoais não acompanham a requisição.
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    credentials: 'omit',
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  })
  if (!resposta.ok)
    throw new Error('Não foi possível consultar o CEP. Tente novamente.')
  const dados: unknown = await resposta.json()
  if (objeto(dados) && (dados.erro === true || dados.erro === 'true'))
    throw new Error('CEP não encontrado.')
  if (
    !objeto(dados) ||
    typeof dados.logradouro !== 'string' ||
    typeof dados.bairro !== 'string' ||
    typeof dados.localidade !== 'string' ||
    typeof dados.uf !== 'string'
  )
    throw new Error('Resposta de endereço inválida.')
  return {
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    localidade: dados.localidade,
    uf: dados.uf,
  }
}
