export type PreferenciasUsuario = {
  notificacoes: boolean
  modoEscuro: boolean
}

const padrao: PreferenciasUsuario = { notificacoes: true, modoEscuro: false }
const chave = (usuarioId: number) => `seda-preferencias-v1-${usuarioId}`

export function lerPreferencias(usuarioId: number): PreferenciasUsuario {
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(chave(usuarioId)) ?? 'null')
    if (typeof valor === 'object' && valor !== null) {
      const dados = valor as Record<string, unknown>
      return {
        notificacoes: typeof dados.notificacoes === 'boolean' ? dados.notificacoes : padrao.notificacoes,
        modoEscuro: typeof dados.modoEscuro === 'boolean' ? dados.modoEscuro : padrao.modoEscuro,
      }
    }
  } catch {
    // Armazenamento local indisponível: usa os valores padrão desta sessão.
  }
  return { ...padrao }
}

export function salvarPreferencias(usuarioId: number, preferencias: PreferenciasUsuario): void {
  try {
    localStorage.setItem(chave(usuarioId), JSON.stringify(preferencias))
  } catch {
    // A tela continua funcional nesta sessão mesmo sem armazenamento local.
  }
}

export function aplicarTemaEscuro(ativado: boolean): void {
  document.documentElement.classList.toggle('dark', ativado)
  document.documentElement.style.colorScheme = ativado ? 'dark' : 'light'
}
