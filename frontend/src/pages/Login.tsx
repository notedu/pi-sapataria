import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SubmitEvent } from 'react'
import logo from '../assets/logo-sapataria.png'
import Button from '../components/Button'
import InputField from '../components/InputField'
import PasswordField from '../components/PasswordField'
import { autenticar, consultarUsuario, ErroApi } from '../services/auth'
import { aplicarTemaEscuro } from '../services/preferencias'

function LoginIcon({ tipo }: { tipo: 'usuario' | 'senha' | 'info' }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {tipo === 'usuario' && <><circle cx="12" cy="8" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3Z" /></>}
      {tipo === 'senha' && <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>}
      {tipo === 'info' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>}
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [enviando, setEnviando] = useState(false)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [erro, setErro] = useState('')
  const envioEmCurso = useRef(false)

  useEffect(() => { aplicarTemaEscuro(false) }, [])

  useEffect(() => {
    let ativo = true
    consultarUsuario().then(() => {
      if (ativo) navigate('/dashboard', { replace: true })
    }).catch(error => {
      if (!ativo) return
      if (!(error instanceof ErroApi && error.status === 401)) {
        setErro('Não foi possível verificar sua sessão. Você ainda pode tentar entrar com usuário e senha.')
      }
    }).finally(() => {
      if (ativo) setVerificandoSessao(false)
    })
    return () => { ativo = false }
  }, [navigate])

  async function entrar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // Envia pela API, sem recarregar a página.
    if (verificandoSessao || envioEmCurso.current) return
    const formulario = event.currentTarget
    const campos = new FormData(formulario)
    const usuario = String(campos.get('usuario') ?? '').trim()
    const senha = String(campos.get('senha') ?? '') // Espaços podem fazer parte da senha.
    if (!usuario || !senha) {
      setErro('Preencha o usuário e a senha.')
      return
    }

    envioEmCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      await autenticar(usuario, senha)
      formulario.reset()
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.')
    } finally {
      envioEmCurso.current = false
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-dvh bg-surface text-on-surface">
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-secondary-container md:flex">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-primary opacity-10">
          <defs>
            <pattern id="ondas-login" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 Q25 25 50 50 T100 50" fill="none" stroke="currentColor" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ondas-login)" />
        </svg>
        <img src={logo} alt="Seda e Couro Sapataria" className="relative w-80 max-w-[80%] mix-blend-multiply" />
      </div>

      <section aria-labelledby="titulo-login" className="flex w-full flex-col justify-center px-margin-mobile py-12 md:w-1/2 md:px-margin-desktop lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <header className="mb-12 text-center md:text-left">
            <h1 id="titulo-login" className="mb-2 text-headline-lg-mobile text-primary md:text-headline-lg">Acesso ao Sistema</h1>
            <p className="text-body-md text-on-surface-variant">Seda e Couro Gestão Interna</p>
          </header>

          {location.state?.senhaAlterada && <p role="status" className="mb-6 rounded-default border border-success/25 bg-success-container p-4 text-on-success-container">Senha atualizada. Entre novamente com a nova senha.</p>}

          {verificandoSessao && <p role="status" className="mb-4 text-center text-body-md text-on-surface-variant">Verificando se você já está conectado…</p>}

          <form onSubmit={entrar} className="flex flex-col gap-6" aria-busy={enviando || verificandoSessao} aria-describedby={erro ? 'erro-login' : undefined}>
            <InputField id="usuario" name="usuario" label="Usuário" placeholder="Seu nome de usuário" autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={enviando || verificandoSessao} icon={<LoginIcon tipo="usuario" />} />
            <PasswordField id="senha" name="senha" label="Senha" placeholder="Sua senha" autoComplete="current-password" required disabled={enviando || verificandoSessao} icon={<LoginIcon tipo="senha" />} />
            {erro && <p id="erro-login" role="alert" className="rounded-default bg-error-container p-4 text-body-md text-on-error-container">{erro}</p>}
            <Button type="submit" disabled={enviando || verificandoSessao} className="mt-4 w-full">{verificandoSessao ? 'Verificando sessão…' : enviando ? 'Acessando…' : 'Acessar'}</Button>
          </form>

          <footer className="mt-16 border-t border-outline-variant/20 pt-8 text-center">
            <p className="flex items-center justify-center gap-2 text-label-sm text-on-surface-variant"><LoginIcon tipo="info" />Acesso Restrito a Funcionários</p>
          </footer>
        </div>
      </section>
    </main>
  )
}
