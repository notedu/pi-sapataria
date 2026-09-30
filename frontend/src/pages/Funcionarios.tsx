import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import { ErroApi } from '../services/api'
import { listarFuncionarios } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'

export default function Funcionarios() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [lista, setLista] = useState<Funcionario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    listarFuncionarios().then(dados => { if (ativo) setLista(dados) }).catch(error => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.status === 403) navigate('/dashboard', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar a equipe.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [tentativa, navigate])

  return (
    <div className="mx-auto max-w-container-max">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div><h1 className="text-headline-lg">Funcionários</h1><p className="mt-2 text-on-surface-variant">Gerencie as contas de acesso da equipe.</p></div>
        <Link to="/funcionarios/novo" className="rounded-default bg-primary px-6 py-4 text-label-md text-on-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Novo funcionário</Link>
      </header>
      {state?.cadastroConcluido && <Alerta className="mb-6" mensagem="Funcionário cadastrado com sucesso. A conta já pode acessar o sistema." onFechar={() => navigate('/funcionarios', { replace: true, state: { ...state, cadastroConcluido: undefined } })} />}
      {carregando ? <p role="status">Carregando funcionários…</p> : erro ? (
        <div className="space-y-4"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p><Button onClick={() => { setErro(''); setCarregando(true); setTentativa(valor => valor + 1) }}>Tentar novamente</Button></div>
      ) : lista.length === 0 ? <p className="rounded-lg border border-outline-variant p-8">Nenhum funcionário cadastrado.</p> : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest" role="region" aria-label="Lista de funcionários" tabIndex={0}>
          <table className="w-full text-left text-body-md">
            <caption className="sr-only">Contas de funcionários e seus perfis de acesso</caption>
            <thead className="bg-surface-container-low text-label-md text-on-surface-variant"><tr>{['Nome', 'Usuário', 'E-mail', 'Perfil', 'Situação', 'Ações'].map(titulo => <th key={titulo} scope="col" className="px-5 py-4">{titulo}</th>)}</tr></thead>
            <tbody>{lista.map(pessoa => <tr key={pessoa.id} className="border-t border-outline-variant/50"><td className="min-w-40 px-5 py-5 font-medium text-primary">{pessoa.nome}</td><td className="px-5 py-5">{pessoa.usuario}</td><td className="px-5 py-5">{pessoa.email}</td><td className="px-5 py-5">{pessoa.perfil === 'administrador' ? 'Administrador' : 'Funcionário'}</td><td className="px-5 py-5"><span className={`rounded-default px-3 py-1 text-label-sm ${pessoa.ativo ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'}`}>{pessoa.ativo ? 'Ativo' : 'Inativo'}</span></td><td className="px-5 py-5"><Button variant="secondary" size="icon" title="Ver perfil" aria-label={`Ver perfil de ${pessoa.nome}`} onClick={() => navigate(`/funcionarios/${pessoa.id}`)}><Icon name="busca" /></Button></td></tr>)}</tbody>
          </table>
        </div>
      )}

    </div>
  )
}
