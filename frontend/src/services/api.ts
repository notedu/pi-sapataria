// VITE_* é público: este endereço nunca deve conter segredos.
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1').replace(/\/$/, '')

export class ErroApi extends Error {
  status: number
  codigo?: string
  constructor(status: number, mensagem: string, codigo?: string) {
    super(mensagem)
    this.status = status
    this.codigo = codigo
  }
}

export class ResultadoIncerto extends Error {}

export async function requisitar(caminho: string, opcoes: RequestInit = {}): Promise<unknown> {
  const alteraDados = opcoes.method && opcoes.method !== 'GET'
  let resposta: Response
  try {
    resposta = await fetch(`${apiUrl}${caminho}`, {
      ...opcoes,
      credentials: 'include',
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    if (alteraDados) throw new ResultadoIncerto('Não foi possível confirmar o resultado da operação. Confira os dados antes de tentar novamente.')
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!resposta.ok) {
    const corpo: unknown = await resposta.json().catch(() => null)
    const erro = objeto(corpo) && objeto(corpo.erro) ? corpo.erro : null
    const codigo = typeof erro?.codigo === 'string' ? erro.codigo : undefined
    const mensagensPorCodigo: Record<string, string> = {
      AUTODESATIVACAO_PROIBIDA: 'Você não pode desativar sua própria conta.',
      SENHA_CONFIRMACAO_INVALIDA: 'Sua senha está incorreta. A desativação não foi realizada.',
      CONFIRMACAO_OBRIGATORIA: 'Informe sua senha para confirmar a desativação.',
      FUNCIONARIO_NAO_ENCONTRADO: 'Funcionário não encontrado. Atualize a lista.',
    }
    const mensagens: Record<number, string> = {
      400: 'Confira os dados informados.',
      401: caminho === '/auth/login' ? 'Usuário ou senha inválidos.' : 'Sua sessão expirou. Entre novamente.',
      403: codigo === 'ACESSO_NEGADO' ? 'Este recurso é exclusivo do Administrador.' : 'Não foi possível validar a sessão. Tente novamente.',
      409: 'Este usuário já está cadastrado. Escolha outro nome de usuário.',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
      503: 'O serviço está ocupado. Tente novamente em instantes.',
    }
    throw new ErroApi(resposta.status, (codigo && mensagensPorCodigo[codigo]) || mensagens[resposta.status] || 'O servidor não conseguiu concluir a operação. Tente novamente mais tarde.', codigo)
  }
  if (resposta.status === 204) return null
  try {
    return await resposta.json()
  } catch {
    if (alteraDados) throw new ResultadoIncerto('O servidor retornou uma resposta inesperada. Confira os dados antes de repetir a operação.')
    throw new Error('O servidor retornou uma resposta inesperada.')
  }
}

export function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function possuiToken(dados: unknown): dados is { csrfToken: string } {
  return objeto(dados) && typeof dados.csrfToken === 'string' && /^[a-f0-9]{64}$/.test(dados.csrfToken)
}

export async function enviarComCsrf(caminho: string, dados?: unknown): Promise<unknown> {
  const sessao = await requisitar('/auth/csrf')
  if (!possuiToken(sessao)) throw new Error('Não foi possível preparar uma sessão segura. Tente novamente.')
  // Token e cookie pertencem à mesma sessão. Nunca repete o POST automaticamente.
  return requisitar(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessao.csrfToken },
    ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
  })
}
