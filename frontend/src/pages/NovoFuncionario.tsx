import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { cadastrarFuncionario } from '../services/funcionarios'

export default function NovoFuncionario() {
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [incerto, setIncerto] = useState(false)
  const envioEmCurso = useRef(false)

  async function salvar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEmCurso.current || incerto) return
    const formulario = event.currentTarget
    const campos = new FormData(formulario)
    const nome = String(campos.get('nome') ?? '').trim()
    const usuario = String(campos.get('usuario') ?? '').trim()
    const email = String(campos.get('email') ?? '').trim()
    const senha = String(campos.get('senha') ?? '')
    const confirmacao = String(campos.get('confirmacao') ?? '')
    const perfil = campos.get('perfil')
    if (!nome || !usuario || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErro('Preencha nome, usuário e um e-mail válido.'); return }
    // Conta caracteres como a API, preservando espaços e caracteres Unicode da senha.
    if ([...senha].length < 15 || [...senha].length > 128) { setErro('A senha deve conter entre 15 e 128 caracteres.'); return }
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return }
    if (perfil !== 'administrador' && perfil !== 'funcionario') { setErro('Selecione o perfil de acesso.'); return }

    envioEmCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      await cadastrarFuncionario({ nome, usuario, email, senha, perfil })
      formulario.reset()
      navigate('/funcionarios', { replace: true, state: { cadastroConcluido: true } })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.status === 403 && error.codigo === 'ACESSO_NEGADO') navigate('/dashboard', { replace: true })
      else {
        setErro(error instanceof Error ? error.message : 'Não foi possível cadastrar o funcionário.')
        if (error instanceof ResultadoIncerto) {
          setIncerto(true) // Evita reenviar um cadastro que talvez já tenha sido confirmado no servidor.
          for (const campo of formulario.querySelectorAll<HTMLInputElement>('input[type="password"]')) campo.value = ''
        }
      }
    } finally { envioEmCurso.current = false; setEnviando(false) }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8"><h1 className="text-headline-lg-mobile md:text-headline-lg">Novo funcionário</h1><p className="mt-2 text-on-surface-variant">Cadastre a pessoa e suas credenciais de acesso ao sistema.</p></header>
      <form onSubmit={salvar} aria-busy={enviando} aria-describedby={erro ? 'erro-cadastro' : undefined} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-8">
        <p className="mb-6 text-label-sm text-on-surface-variant">Todos os campos são obrigatórios. A conta será criada ativa.</p>
        <fieldset disabled={enviando || incerto} className="space-y-6">
          <legend className="sr-only">Dados do funcionário e acesso</legend>
          <InputField id="nome" name="nome" label="Nome completo" autoComplete="name" required />
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField id="usuario" name="usuario" label="Usuário de login" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
            <InputField id="email" name="email" label="E-mail de contato" type="email" autoComplete="email" required />
          </div>
          <SelectField id="perfil" name="perfil" label="Perfil de acesso" defaultValue="" required><option value="" disabled>Selecione o perfil</option><option value="funcionario">Funcionário</option><option value="administrador">Administrador</option></SelectField>
          <p className="text-label-sm text-on-surface-variant">Somente Administradores podem visualizar e cadastrar funcionários.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField id="senha" name="senha" label="Senha" type="password" autoComplete="new-password" aria-describedby="orientacao-senha" required />
            <InputField id="confirmacao" name="confirmacao" label="Confirmar senha" type="password" autoComplete="new-password" required />
          </div>
          <p id="orientacao-senha" className="text-label-sm text-on-surface-variant">Use de 15 a 128 caracteres. A senha não será exibida na listagem.</p>
        </fieldset>
        {erro && <p id="erro-cadastro" role="alert" className="mt-6 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-outline-variant/50 pt-6">
          {!enviando && <Link to="/funcionarios" className="rounded-default px-4 py-3 text-label-md text-primary underline-offset-4 hover:underline focus-visible:outline-2">{incerto ? 'Consultar lista antes de tentar novamente' : 'Cancelar'}</Link>}
          <Button type="submit" disabled={enviando || incerto}>{enviando ? 'Salvando…' : 'Salvar funcionário'}</Button>
        </div>
      </form>
    </div>
  )
}
