import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/Button'
import Icon from '../components/Icon'
import { ErroApi } from '../services/api'
import type { Usuario } from '../services/auth'
import { listarOrdens } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'
import { data, dinheiro } from '../utils/ordensServico'

export default function Dashboard() {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const [ordens, setOrdens] = useState<OrdemResumo[] | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    listarOrdens().then(dados => { if (ativo) setOrdens(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar o painel.')
    })
    return () => { ativo = false }
  }, [navigate, tentativa])

  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const indicadores = [
    ['Entradas de hoje', ordens?.filter(os => os.data_entrada === hoje).length],
    ['Em andamento', ordens?.filter(os => os.status === 'Em andamento').length],
    ['Prontas', ordens?.filter(os => os.status === 'Pronta').length],
    ['Abertas', ordens?.filter(os => os.status === 'Aberta').length],
  ]
  const recentes = ordens?.filter(os => !['Entregue', 'Cancelada'].includes(os.status)).slice().sort((a, b) => b.id - a.id).slice(0, 6) ?? []
  return <div className="mx-auto max-w-container-max space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div><h1 className="text-headline-lg-mobile md:text-headline-lg">Olá, {usuario.nome.split(' ')[0]}!</h1><p className="mt-1 text-on-surface-variant">Acompanhe as ordens de serviço da sapataria.</p></div>
      <Link to="/ordens-servico/nova" className="inline-flex min-h-11 items-center gap-2 rounded-default bg-primary px-5 py-3 text-label-md text-on-primary hover:bg-primary-container"><span aria-hidden="true">＋</span>Nova OS</Link>
    </header>
    {erro ? <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div> : <>
      <section aria-label="Resumo de ordens" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{indicadores.map(([titulo, numero]) => <div key={titulo} className="rounded-xl border border-primary/20 bg-surface-container-lowest p-5"><p className="text-label-md text-on-surface-variant">{titulo}</p><p className="mt-3 text-headline-lg text-primary">{ordens ? numero : '…'}</p></div>)}</section>
      <section className="rounded-xl border border-primary/20 bg-surface-container-low p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-headline-md">Fluxo de ordens</h2><p className="text-label-sm text-on-surface-variant">Ordens abertas, em andamento e prontas</p></div><Link to="/ordens-servico" className="text-label-md text-primary hover:underline">Ver todas</Link></div>
        {!ordens ? <p role="status">Carregando ordens…</p> : recentes.length === 0 ? <p className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">Nenhuma ordem ativa.</p> : <div className="grid gap-4 lg:grid-cols-3">{(['Aberta', 'Em andamento', 'Pronta'] as const).map(status => <div key={status}><h3 className="mb-3 text-label-md text-primary">{status} <span className="ml-1 text-on-surface-variant">{ordens.filter(os => os.status === status).length}</span></h3><div className="space-y-3">{recentes.filter(os => os.status === status).map(os => <Link key={os.id} to={`/ordens-servico/${os.id}`} className="block rounded-lg border border-outline-variant bg-surface-container-lowest p-4 hover:border-primary"><div className="flex justify-between gap-3"><strong>OS #{os.id}</strong><span className="text-label-md">{dinheiro(os.valor)}</span></div><p className="mt-2 line-clamp-2 text-label-md font-normal">{os.servico}</p><p className="mt-3 flex items-center gap-1 text-label-sm text-on-surface-variant"><Icon name="calendario" className="h-4 w-4" />Entrada: {data(os.data_entrada)}</p></Link>)}</div></div>)}</div>}
      </section>
    </>}
  </div>
}
