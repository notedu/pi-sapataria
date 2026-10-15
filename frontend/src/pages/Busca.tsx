import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/Button'
import Icon from '../components/Icon'
import type { IconName } from '../components/Icon'
import { areas } from '../config/navegacao'
import { ErroApi } from '../services/api'
import type { Usuario } from '../services/auth'
import { listarClientes } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import { listarFuncionarios } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import { listarOrdens } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'

const atalhos = [
  { titulo: 'Nova OS', caminho: '/ordens-servico/nova', icone: 'servicos' as const },
  { titulo: 'Cadastrar cliente', caminho: '/clientes/novo', icone: 'clientes' as const },
  { titulo: 'Ordens de Serviço', caminho: '/ordens-servico', icone: 'servicos' as const },
  { titulo: 'Ver Dashboard', caminho: '/dashboard', icone: 'dashboard' as const },
]

const paginasExtras: { titulo: string; caminho: string; icone: IconName; administrador?: boolean }[] = [
  { titulo: 'Meu perfil', caminho: '/meu-perfil', icone: 'funcionarios' },
  { titulo: 'Cadastrar cliente', caminho: '/clientes/novo', icone: 'clientes' },
  { titulo: 'Perfis de clientes', caminho: '/clientes', icone: 'clientes' },
  { titulo: 'Nova ordem de serviço', caminho: '/ordens-servico/nova', icone: 'servicos' },
  { titulo: 'Detalhes e edição de OS', caminho: '/ordens-servico', icone: 'servicos' },
  { titulo: 'Cadastrar funcionário', caminho: '/funcionarios/novo', icone: 'funcionarios', administrador: true },
  { titulo: 'Perfis e edição de funcionários', caminho: '/funcionarios', icone: 'funcionarios', administrador: true },
]

export default function Busca() {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const [termo, setTermo] = useState('')
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [ordens, setOrdens] = useState<OrdemResumo[] | null>(null)
  const [funcionarios, setFuncionarios] = useState<Funcionario[] | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    Promise.all([listarClientes(), listarOrdens(), usuario.perfil === 'administrador' ? listarFuncionarios() : Promise.resolve([] as Funcionario[])]).then(([pessoas, lista, equipe]) => {
      if (ativo) { setClientes(pessoas); setOrdens(lista); setFuncionarios(equipe) }
    }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar a busca.')
    })
    return () => { ativo = false }
  }, [navigate, tentativa, usuario.perfil])
  const consulta = termo.trim().toLocaleLowerCase('pt-BR')
  const pessoas = consulta ? clientes?.filter(cliente => `${cliente.nome} ${cliente.telefone}`.toLocaleLowerCase('pt-BR').includes(consulta)) ?? [] : []
  const servicos = consulta ? ordens?.filter(os => `os ${os.id} ${os.descricao_calcado} ${os.servico}`.toLocaleLowerCase('pt-BR').includes(consulta)) ?? [] : []
  const paginasDisponiveis = [...areas.filter(area => area.caminho).map(area => ({ ...area, caminho: area.caminho! })), ...paginasExtras]
    .filter(pagina => !pagina.administrador || usuario.perfil === 'administrador')
  const paginas = consulta ? paginasDisponiveis.filter(pagina => pagina.titulo.toLocaleLowerCase('pt-BR').includes(consulta)) : []
  const equipe = consulta ? funcionarios?.filter(pessoa => `${pessoa.nome} ${pessoa.usuario}`.toLocaleLowerCase('pt-BR').includes(consulta)) ?? [] : []
  return <div className="mx-auto max-w-4xl py-4 md:py-16">
    <header className="text-center"><h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">O que você precisa encontrar?</h1><p className="mt-3 text-on-surface-variant">Localize ordens, clientes ou páginas do sistema.</p></header>
    <div className="relative mt-10"><label htmlFor="busca-geral" className="sr-only">Buscar ordens, clientes ou páginas</label><span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-primary"><Icon name="busca" /></span><input id="busca-geral" type="search" value={termo} onChange={event => setTermo(event.target.value)} placeholder="Buscar ordens, clientes ou páginas…" className="w-full rounded-xl border border-primary/25 bg-surface-container-low py-5 pl-14 pr-5 text-body-lg focus:outline-2 focus:outline-primary" /></div>
    {erro ? <div className="mt-6 space-y-3"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div> : !clientes || !ordens || !funcionarios ? <p role="status" className="mt-6 text-center">Carregando busca…</p> : consulta ? <div className="mt-8 space-y-6">
      {pessoas.length + servicos.length + paginas.length + equipe.length === 0 && <p className="rounded-lg border border-dashed border-outline-variant p-8 text-center">Nenhum resultado para “{termo.trim()}”.</p>}
      {servicos.length > 0 && <section><h2 className="mb-3 text-label-md text-on-surface-variant">Ordens de serviço ({servicos.length})</h2><ul className="space-y-2">{servicos.map(os => <li key={os.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4"><Link to={`/ordens-servico/${os.id}`} className="font-semibold text-primary hover:underline">OS #{os.id} · {os.servico}</Link><span className="ml-2 text-label-sm text-on-surface-variant">{os.status}</span>{['Aberta', 'Em andamento'].includes(os.status) && <Link to={`/ordens-servico/${os.id}/editar`} className="ml-4 text-label-sm text-primary hover:underline">Editar OS</Link>}</li>)}</ul></section>}
      {pessoas.length > 0 && <section><h2 className="mb-3 text-label-md text-on-surface-variant">Clientes ({pessoas.length})</h2><ul className="space-y-2">{pessoas.map(cliente => <li key={cliente.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4"><Link to={`/clientes/${cliente.id}`} className="font-semibold text-primary hover:underline">{cliente.nome}</Link><span className="ml-2 text-on-surface-variant">{cliente.telefone}</span><Link to={`/clientes/${cliente.id}/editar`} className="ml-4 text-label-sm text-primary hover:underline">Editar cliente</Link></li>)}</ul></section>}
      {equipe.length > 0 && <section><h2 className="mb-3 text-label-md text-on-surface-variant">Funcionários ({equipe.length})</h2><ul className="space-y-2">{equipe.map(pessoa => <li key={pessoa.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4"><Link to={`/funcionarios/${pessoa.id}`} className="font-semibold text-primary hover:underline">{pessoa.nome}</Link><span className="ml-2 text-label-sm text-on-surface-variant">{pessoa.ativo ? 'Ativo' : 'Inativo'}</span><Link to={`/funcionarios/${pessoa.id}/editar`} className="ml-4 text-label-sm text-primary hover:underline">Editar perfil</Link></li>)}</ul></section>}
      {paginas.length > 0 && <section><h2 className="mb-3 text-label-md text-on-surface-variant">Páginas</h2><ul className="grid gap-2 sm:grid-cols-2">{paginas.map(pagina => <li key={`${pagina.caminho}-${pagina.titulo}`}><Link to={pagina.caminho} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 hover:border-primary"><Icon name={pagina.icone} />{pagina.titulo}</Link></li>)}</ul></section>}
    </div> : <><section className="mt-14"><h2 className="mb-5 text-center text-label-sm uppercase tracking-wide text-on-surface-variant">Ações rápidas</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{atalhos.map(atalho => <Link key={atalho.caminho} to={atalho.caminho} className="flex min-h-32 flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-center text-label-md hover:border-primary"><span className="rounded-full bg-primary-fixed p-3 text-on-primary-fixed"><Icon name={atalho.icone} /></span>{atalho.titulo}</Link>)}</div></section><section className="mt-12"><h2 className="mb-4 text-label-md text-on-surface-variant">Páginas disponíveis</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{paginasDisponiveis.map(pagina => <li key={`${pagina.caminho}-${pagina.titulo}`}><Link to={pagina.caminho} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 hover:border-primary"><Icon name={pagina.icone} />{pagina.titulo}</Link></li>)}</ul></section></>}
  </div>
}
