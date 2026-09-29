import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatarTelefone } from '../utils/clientes'
import Icon from '../components/Icon'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import { ErroApi } from '../services/api'
import { listarClientes } from '../services/clientes'
import type { Cliente } from '../services/clientes'

export default function Clientes() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [lista, setLista] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    listarClientes().then(dados => { if (ativo) setLista(dados) }).catch(error => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar os clientes.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [tentativa, navigate])

  return (
    <div className="mx-auto max-w-container-max">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div><h1 className="text-headline-lg">Clientes</h1><p className="mt-2 text-on-surface-variant">Cadastre os clientes que serão vinculados às ordens de serviço.</p></div>
        <Link to="/clientes/novo" className="rounded-default bg-primary px-6 py-4 text-label-md text-on-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Novo cliente</Link>
      </header>
      {state?.clienteExcluido && <Alerta className="mb-6" mensagem="Cliente excluído com sucesso." onFechar={() => navigate('/clientes', { replace: true, state: { ...state, clienteExcluido: undefined } })} />}
      {state?.clienteAusente && <Alerta className="mb-6" mensagem="Este cliente não está mais cadastrado. A lista foi atualizada." onFechar={() => navigate('/clientes', { replace: true, state: { ...state, clienteAusente: undefined } })} />}
      {state?.clienteCadastrado && <Alerta className="mb-6" mensagem="Cliente cadastrado com sucesso." onFechar={() => navigate('/clientes', { replace: true, state: { ...state, clienteCadastrado: undefined } })} />}
      {carregando ? <p role="status">Carregando clientes…</p> : erro ? (
        <div className="space-y-4"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p><Button onClick={() => { setErro(''); setCarregando(true); setTentativa(valor => valor + 1) }}>Tentar novamente</Button></div>
      ) : lista.length === 0 ? <p className="rounded-lg border border-outline-variant p-8">Nenhum cliente cadastrado.</p> : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest" role="region" aria-label="Lista de clientes" tabIndex={0}>
          <table className="w-full text-left text-body-md">
            <caption className="sr-only">Clientes cadastrados e contatos</caption>
            <thead className="bg-surface-container-low text-label-md text-on-surface-variant"><tr>{['Nome', 'Telefone', 'E-mail', 'Ações'].map(titulo => <th key={titulo} scope="col" className="px-5 py-4">{titulo}</th>)}</tr></thead>
            <tbody>{lista.map(pessoa => <tr key={pessoa.id} className="border-t border-outline-variant/50"><td className="min-w-40 px-5 py-5 font-medium text-on-surface">{pessoa.nome}</td><td className="px-5 py-5">{/^\d{11}$/.test(pessoa.telefone) ? formatarTelefone(pessoa.telefone) : pessoa.telefone}</td><td className="px-5 py-5">{pessoa.email ?? 'Não informado'}</td><td className="px-5 py-5"><Button variant="secondary" size="icon" title="Ver perfil" aria-label={`Ver perfil de ${pessoa.nome}`} onClick={() => navigate(`/clientes/${pessoa.id}`)}><Icon name="busca" /></Button></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
