import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { consultarUsuario, ErroApi, sair } from '../services/auth'
import type { Usuario } from '../services/auth'
import { areas } from '../config/navegacao'
import Button from './Button'
import Icon from './Icon'
import Sidebar from './Sidebar'

// Uma nova rota verifica novamente a sessão e o perfil na API.
export default function AppLayout() {
  const { pathname } = useLocation()
  return <LayoutComSessao key={pathname} caminho={pathname} />
}

function LayoutComSessao({ caminho }: { caminho: string }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [saindo, setSaindo] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const envioEmCurso = useRef(false)

  useEffect(() => {
    let ativo = true
    consultarUsuario().then(dados => {
      if (ativo) setUsuario(dados)
    }).catch(error => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível verificar a sessão.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [tentativa, navigate])

  async function encerrarSessao() {
    if (envioEmCurso.current) return
    envioEmCurso.current = true
    setSaindo(true)
    setErro('')
    try {
      await sair()
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível sair. Tente novamente.')
    } finally {
      envioEmCurso.current = false
      setSaindo(false)
    }
  }

  if (carregando) return <main className="flex min-h-dvh items-center justify-center p-6"><p role="status">Verificando sessão…</p></main>
  if (!usuario) return <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6"><p role="alert">{erro || 'Sessão indisponível.'}</p><Button onClick={() => { setErro(''); setCarregando(true); setTentativa(valor => valor + 1) }}>Tentar novamente</Button></main>

  const area = areas.find(item => item.caminho === caminho)
  if (area?.administrador && usuario.perfil !== 'administrador') return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-dvh bg-surface">
      <a href="#conteudo" className="sr-only z-50 rounded-default bg-primary p-3 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
      <header className="flex items-center justify-between bg-secondary-container p-4 md:hidden">
        <span className="text-headline-md text-primary">Seda e Couro</span>
        <button type="button" aria-expanded={menuAberto} aria-controls="menu-sistema" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuAberto(valor => !valor)} className="rounded-default p-3 text-primary focus-visible:outline-2"><Icon name={menuAberto ? 'fechar' : 'menu'} /></button>
      </header>
      <div id="menu-sistema" className={`${menuAberto ? 'block' : 'hidden'} md:fixed md:inset-y-0 md:block md:w-64 md:overflow-y-auto`}>
        <Sidebar usuario={usuario} onSair={encerrarSessao} saindo={saindo} />
      </div>
      <main id="conteudo" tabIndex={-1} className="min-w-0 px-margin-mobile py-8 outline-none md:ml-64 md:p-8 lg:p-12">
        {erro && <p role="alert" className="mb-6 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
        <Outlet context={usuario} />
      </main>
    </div>
  )
}
