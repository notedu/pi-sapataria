import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import CartaoInformacoes from '../components/CartaoInformacoes'
import ConfirmarSenhaDialog from '../components/ConfirmarSenhaDialog'
import HistoricoOrdensServico from '../components/HistoricoOrdensServico'
import Icon from '../components/Icon'
import { ErroApi } from '../services/api'
import type { Usuario } from '../services/auth'
import { buscarFuncionario, desativarFuncionario } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import { formatarCpf, formatarTelefone } from '../utils/clientes'

export default function PerfilFuncionario({ proprio = false }: { proprio?: boolean }) {
  const usuario = useOutletContext<Usuario>()
  const params = useParams()
  const id = proprio ? String(usuario.id) : params.id ?? ''
  return <Perfil key={id} id={id} usuario={usuario} />
}

function Perfil({ id, usuario }: { id: string; usuario: Usuario }) {
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const [pessoa, setPessoa] = useState<Funcionario | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [confirmando, setConfirmando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const administrador = usuario.perfil === 'administrador'
  useEffect(() => {
    let ativo = true
    buscarFuncionario(id).then(dados => { if (ativo) setPessoa(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.status === 403) navigate('/dashboard', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Funcionário não encontrado.' : error instanceof Error ? error.message : 'Não foi possível carregar o perfil.')
    })
    return () => { ativo = false }
  }, [id, tentativa, navigate])

  async function desativar(senha: string) {
    if (!pessoa) return
    try {
      const atualizado = await desativarFuncionario(pessoa.id, senha)
      setPessoa(atualizado)
      setConfirmando(false)
      setSucesso('Funcionário desativado. O histórico foi preservado.')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.codigo === 'ACESSO_NEGADO') navigate('/dashboard', { replace: true })
      throw error
    }
  }

  return <div className="mx-auto max-w-container-max space-y-6">
    <Link to={administrador ? '/funcionarios' : '/dashboard'} className="text-label-md text-primary hover:underline">{administrador ? 'Voltar para funcionários' : 'Voltar ao início'}</Link>
    {erro ? <div className="space-y-4"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div>
      : !pessoa ? <p role="status">Carregando funcionário…</p> : <>
        {state?.funcionarioEditado && <Alerta mensagem="Funcionário atualizado com sucesso." onFechar={() => navigate(pathname, { replace: true, state: { ...state, funcionarioEditado: undefined } })} />}
        {sucesso && <Alerta mensagem={sucesso} onFechar={() => setSucesso('')} />}
        <header className="flex flex-wrap items-center justify-between gap-4"><h1 className="min-w-0 break-words text-headline-lg-mobile md:text-headline-lg">{pessoa.nome}</h1>{administrador && <Button variant="secondary" size="compact" className="flex items-center gap-2" onClick={() => navigate(`/funcionarios/${pessoa.id}/editar`)}><Icon name="editar" />Editar perfil</Button>}</header>
        <div className="grid gap-6 lg:grid-cols-3">
          <section aria-label="Identificação" className="flex flex-col items-center justify-center gap-4 rounded-default border border-outline-variant bg-secondary-container p-6 text-center">
            <span aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-primary text-headline-lg text-on-primary">{pessoa.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()}</span>
            <h2 className="w-full break-words text-body-lg font-semibold">{pessoa.nome}</h2>
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">{pessoa.perfil === 'administrador' ? 'Administrador' : 'Funcionário'}</span>
          </section>
          <div className="space-y-6 lg:col-span-2">
            <CartaoInformacoes titulo="Informações pessoais" icone="clientes"><dl className="grid gap-5 sm:grid-cols-2">{[['Nome completo', pessoa.nome], ['CPF', pessoa.cpf ? formatarCpf(pessoa.cpf) : 'Não informado'], ['Telefone', pessoa.telefone ? formatarTelefone(pessoa.telefone) : 'Não informado'], ['E-mail', pessoa.email]].map(([rotulo, valor]) => <div key={rotulo}><dt className="text-label-sm text-on-surface-variant">{rotulo}</dt><dd className="mt-1 break-words text-label-md font-normal">{valor}</dd></div>)}</dl></CartaoInformacoes>
            <CartaoInformacoes titulo="Informações de acesso" icone="funcionarios"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-label-sm text-on-surface-variant">Usuário de login</dt><dd className="mt-1 break-words text-label-md font-normal">{pessoa.usuario}</dd></div><div><dt className="text-label-sm text-on-surface-variant">Situação</dt><dd className="mt-2"><span className={`rounded-full px-3 py-1 text-label-sm ${pessoa.ativo ? 'bg-success-container text-on-success-container' : 'bg-surface-container-high text-on-surface-variant'}`}>{pessoa.ativo ? 'Ativo' : 'Inativo'}</span></dd></div></dl></CartaoInformacoes>
          </div>
        </div>
        <HistoricoOrdensServico caminho={`/funcionarios/${pessoa.id}/ordens-servico`} />
        {administrador && <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-outline-variant/50 pt-5">
          {pessoa.id === usuario.id && <p id="propria-conta" className="text-label-sm text-on-surface-variant">Você não pode desativar sua própria conta.</p>}
          {pessoa.ativo ? <Button variant="dangerOutline" size="compact" disabled={pessoa.id === usuario.id} aria-describedby={pessoa.id === usuario.id ? 'propria-conta' : undefined} onClick={() => setConfirmando(true)}>Desativar funcionário</Button> : <p className="text-label-md text-on-surface-variant">Funcionário já desativado.</p>}
        </footer>}
        {confirmando && <ConfirmarSenhaDialog titulo="Desativar funcionário" descricao={<><p>Desativar <strong>{pessoa.nome}</strong>?</p><p className="mt-3">Esta conta perderá o acesso e suas sessões serão invalidadas. O histórico será preservado. Confirme com sua senha de Administrador.</p></>} acao="Confirmar desativação" textoRevisar="Fechar e atualizar perfil" onConfirmar={desativar} onCancelar={() => setConfirmando(false)} onRevisar={() => { setConfirmando(false); setPessoa(null); setErro(''); setTentativa(v => v + 1) }} />}
      </>}
  </div>
}
