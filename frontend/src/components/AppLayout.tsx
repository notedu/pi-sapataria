import { Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { consultarUsuario, ErroApi, sair } from '../services/auth'
import type { Usuario } from '../services/auth'
import { areas } from '../config/navegacao'
import Button from './Button'
import Icon from './Icon'
import Sidebar from './Sidebar'
import BotaoNotificacoes from './BotaoNotificacoes'
import { contarNotificacoesNaoLidas } from '../services/atividades'
import { aplicarTemaEscuro, lerPreferencias } from '../services/preferencias'

// Uma nova rota verifica novamente a sessão e o perfil na API.
export default function AppLayout() {
  const { pathname } = useLocation()
  return <LayoutComSessao caminho={pathname} />
}

function LayoutComSessao({ caminho }: { caminho: string }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [erro, setErro] = useState('')
  const [erroSessao, setErroSessao] = useState<{
    chave: string
    mensagem: string
  } | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const chaveVerificacao = `${caminho}:${tentativa}`
  const [verificacaoConcluida, setVerificacaoConcluida] = useState<
    string | null
  >(null)
  const [saindo, setSaindo] = useState(false)
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)
  const [menuAberto, setMenuAberto] = useState(false)
  const envioEmCurso = useRef(false)

  useEffect(() => {
    let ativo = true
    consultarUsuario()
      .then((dados) => {
        if (ativo) {
          aplicarTemaEscuro(lerPreferencias(dados.id).modoEscuro)
          setUsuario(dados)
          setErro('')
          setErroSessao(null)
        }
      })
      .catch((error) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErroSessao({
            chave: chaveVerificacao,
            mensagem:
              error instanceof Error
                ? error.message
                : 'Não foi possível verificar a sessão.',
          })
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false)
          setVerificacaoConcluida(chaveVerificacao)
        }
      })
    return () => {
      ativo = false
    }
  }, [chaveVerificacao, navigate])

  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      contarNotificacoesNaoLidas()
        .then((total) => {
          if (ativo) setNotificacoesNaoLidas(total)
        })
        .catch(() => undefined)
    void atualizar()
    const intervalo = window.setInterval(atualizar, 60000)
    window.addEventListener('notificacoes-atualizadas', atualizar)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
      window.removeEventListener('notificacoes-atualizadas', atualizar)
    }
  }, [caminho])

  useEffect(() => {
    if (!menuAberto) return
    const overflowAnterior = document.body.style.overflow
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuAberto(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', fecharComEsc)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', fecharComEsc)
    }
  }, [menuAberto])

  async function encerrarSessao() {
    if (envioEmCurso.current) return
    envioEmCurso.current = true
    setSaindo(true)
    setErro('')
    try {
      await sair()
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível sair. Tente novamente.',
        )
    } finally {
      envioEmCurso.current = false
      setSaindo(false)
    }
  }

  if (!usuario && (carregando || verificacaoConcluida !== chaveVerificacao))
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <p role="status">Verificando sessão…</p>
      </main>
    )
  if (!usuario)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
        <p role="alert">
          {erroSessao?.chave === chaveVerificacao
            ? erroSessao.mensagem
            : 'Sessão indisponível.'}
        </p>
        <Button onClick={() => setTentativa((valor) => valor + 1)}>
          Tentar novamente
        </Button>
      </main>
    )

  const area = areas.find(
    (item) =>
      item.caminho &&
      (item.caminho === caminho || caminho.startsWith(`${item.caminho}/`)),
  )
  const tituloArea = area?.titulo ?? 'Sistema'
  if (area?.administrador && usuario.perfil !== 'administrador')
    return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-default bg-primary p-3 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <header className="app-header sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-outline-variant/50 bg-surface/95 px-4 py-3 backdrop-blur md:ml-64 md:justify-between md:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-label-md font-bold text-primary md:hidden">
            Seda e Couro
          </span>
          <span className="hidden truncate text-body-lg font-semibold text-on-surface md:block">
            {tituloArea}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <BotaoNotificacoes naoLidas={notificacoesNaoLidas} />
          <button
            type="button"
            aria-expanded={menuAberto}
            aria-controls="menu-sistema"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuAberto((valor) => !valor)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-default text-primary hover:bg-primary/5 focus-visible:outline-2 md:hidden"
          >
            <Icon name={menuAberto ? 'fechar' : 'menu'} />
          </button>
        </div>
      </header>
      <div className="md:hidden">
        {menuAberto && (
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-[2px]"
          />
        )}
        <aside
          id="menu-sistema"
          aria-label="Menu do sistema"
          aria-hidden={!menuAberto}
          inert={!menuAberto || undefined}
          className={`app-drawer fixed inset-y-0 left-0 z-50 h-dvh w-[min(88vw,22rem)] transform bg-secondary-container shadow-2xl transition-transform duration-200 ease-out ${menuAberto ? 'pointer-events-auto translate-x-0' : 'pointer-events-none -translate-x-full'}`}
        >
          <div className="relative h-full">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuAberto(false)}
              className="absolute right-3 top-3 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-default text-primary hover:bg-primary/5 focus-visible:outline-2"
            >
              <Icon name="fechar" />
            </button>
            <Sidebar
              usuario={usuario}
              onSair={encerrarSessao}
              saindo={saindo}
              onNavigate={() => setMenuAberto(false)}
            />
          </div>
        </aside>
      </div>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <Sidebar usuario={usuario} onSair={encerrarSessao} saindo={saindo} />
      </aside>
      <main
        id="conteudo"
        tabIndex={-1}
        className="min-w-0 px-margin-mobile py-8 outline-none md:ml-64 md:p-8 lg:p-12"
      >
        {erro && (
          <p
            role="alert"
            className="mb-6 rounded-default bg-error-container p-4 text-on-error-container"
          >
            {erro}
          </p>
        )}
        <div className="page-transition">
          {carregando || verificacaoConcluida !== chaveVerificacao ? (
            <p role="status" className="py-8 text-center">
              Verificando sessão…
            </p>
          ) : erroSessao?.chave === chaveVerificacao ? (
            <div className="space-y-4">
              <p
                role="alert"
                className="rounded-default bg-error-container p-4 text-on-error-container"
              >
                {erroSessao.mensagem}
              </p>
              <Button onClick={() => setTentativa((valor) => valor + 1)}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Suspense
              fallback={
                <p role="status" className="py-8 text-center">
                  Carregando tela…
                </p>
              }
            >
              <Outlet context={usuario} />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  )
}
