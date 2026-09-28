import { enviarComCsrf, objeto, possuiToken, requisitar } from './api'
export { ErroApi } from './api'

export type Usuario = {
  id: number
  nome: string
  perfil: 'administrador' | 'funcionario'
}

export async function autenticar(usuario: string, senha: string): Promise<void> {
  const resultado = await enviarComCsrf('/auth/login', { usuario, senha })
  if (!possuiToken(resultado) || !('dados' in resultado) || !objeto(resultado.dados)) {
    throw new Error('O servidor retornou uma resposta inesperada. Não foi possível confirmar o acesso.')
  }
}

export async function consultarUsuario(): Promise<Usuario> {
  const resposta = await requisitar('/auth/me')
  const usuario = objeto(resposta) ? resposta.dados : null
  if (!objeto(usuario) || !Number.isInteger(usuario.id) || typeof usuario.nome !== 'string'
    || !usuario.nome.trim() || (usuario.perfil !== 'administrador' && usuario.perfil !== 'funcionario')) {
    throw new Error('Não foi possível identificar o usuário. Tente novamente.')
  }
  return { id: usuario.id as number, nome: usuario.nome, perfil: usuario.perfil }
}

export async function sair(): Promise<void> {
  await enviarComCsrf('/auth/logout')
}
