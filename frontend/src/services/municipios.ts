const urlIbge = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export async function listarMunicipios(
  uf: string,
  signal: AbortSignal,
): Promise<string[]> {
  const resposta = await fetch(
    `${urlIbge}/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`,
    {
      credentials: 'omit',
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    },
  )
  if (!resposta.ok) throw new Error('Não foi possível carregar as cidades.')
  const dados: unknown = await resposta.json()
  if (!Array.isArray(dados)) throw new Error('Lista de cidades inválida.')
  return dados.flatMap((valor) =>
    typeof valor === 'object' &&
    valor !== null &&
    'nome' in valor &&
    typeof valor.nome === 'string'
      ? [valor.nome]
      : [],
  )
}
