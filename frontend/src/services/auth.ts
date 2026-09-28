// O endereço é público; nunca coloque segredos em variáveis VITE_*.
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1').replace(/\/$/, '')

export type Usuario = {
  id: number
  nome: string
  perfil: 'administrador' | 'funcionario'
}

export class ErroApi extends Error {
  status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

async function requisitar(caminho: string, opcoes: RequestInit = {}) {
  let resposta: Response
  try {
    resposta = await fetch(`${apiUrl}${caminho}`, {
      ...opcoes,
      credentials: 'include', // Mantém o cookie de sessão HttpOnly gerenciado pelo navegador.
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('Não foi possível confirmar o acesso. Verifique sua conexão e se o servidor está disponível.')
  }

  if (!resposta.ok) {
    const mensagens: Record<number, string> = {
      400: 'Confira o usuário e a senha informados.',
      401: caminho === '/auth/login' ? 'Usuário ou senha inválidos.' : 'Sua sessão expirou. Entre novamente.',
      403: 'Não foi possível validar a sessão. Tente acessar novamente.',
      429: 'Muitas tentativas de acesso. Aguarde antes de tentar novamente.',
      503: 'O serviço está ocupado. Tente novamente em instantes.',
    }
    throw new ErroApi(resposta.status, mensagens[resposta.status] || 'O servidor não conseguiu concluir o acesso. Tente novamente mais tarde.')
  }

  if (resposta.status === 204) return null

  try {
    return await resposta.json()
  } catch {
    throw new Error('O servidor retornou uma resposta inesperada. Não foi possível confirmar o acesso.')
  }
}

function possuiToken(dados: unknown): dados is { csrfToken: string } {
  return typeof dados === 'object' && dados !== null && 'csrfToken' in dados
    && typeof dados.csrfToken === 'string' && /^[a-f0-9]{64}$/.test(dados.csrfToken)
}

export async function autenticar(usuario: string, senha: string): Promise<void> {
  // O token deve vir da mesma sessão usada no POST; não há repetição automática do login.
  const sessao: unknown = await requisitar('/auth/csrf')
  if (!possuiToken(sessao)) throw new Error('Não foi possível preparar uma sessão segura. Tente novamente.')

  const resultado: unknown = await requisitar('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessao.csrfToken },
    body: JSON.stringify({ usuario, senha }),
  })
  if (!possuiToken(resultado) || !('dados' in resultado) || !resultado.dados || typeof resultado.dados !== 'object') {
    throw new Error('O servidor retornou uma resposta inesperada. Não foi possível confirmar o acesso.')
  }
  // A sessão fica no cookie. Futuras operações podem obter o token renovado em /auth/csrf.
}


export async function consultarUsuario(): Promise<Usuario> {
  const resposta = await requisitar('/auth/me')
  const usuario = resposta?.dados
  if (!usuario || !Number.isInteger(usuario.id) || typeof usuario.nome !== 'string'
    || !usuario.nome.trim() || !['administrador', 'funcionario'].includes(usuario.perfil)) {
    throw new Error('Não foi possível identificar o usuário. Tente novamente.')
  }
  return { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil }
}

export async function sair(): Promise<void> {
  const sessao: unknown = await requisitar('/auth/csrf')
  if (!possuiToken(sessao)) throw new Error('Não foi possível preparar a saída. Tente novamente.')
  await requisitar('/auth/logout', {
    method: 'POST',
    headers: { 'X-CSRF-Token': sessao.csrfToken },
  })
}
