import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import Icon from '../components/Icon'
import SelectField from '../components/SelectField'
import { ErroApi } from '../services/api'
import { listarClientes } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import { listarOrdens } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'
import { data, dinheiro } from '../utils/ordensServico'

export default function OrdensServico() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [ordens, setOrdens] = useState<OrdemResumo[] | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [termo, setTermo] = useState('')
  const [status, setStatus] = useState('')
  useEffect(() => {
    let ativo = true
    Promise.all([listarOrdens(), listarClientes()]).then(([lista, pessoas]) => {
      if (ativo) { setOrdens(lista); setClientes(pessoas) }
    }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar as ordens.')
    })
    return () => { ativo = false }
  }, [navigate, tentativa])
  const nomes = new Map(clientes.map(cliente => [cliente.id, cliente.nome]))
  const filtradas = ordens?.filter(os => (!status || os.status === status) && (!termo.trim() || `os ${os.id} ${os.servico} ${os.descricao_calcado} ${nomes.get(os.cliente_id) ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo.trim().toLocaleLowerCase('pt-BR')))) ?? []
  return <div className="mx-auto max-w-container-max space-y-7">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-headline-lg-mobile md:text-headline-lg">Ordens de Serviço</h1><p className="mt-2 text-on-surface-variant">Consulte e acompanhe os serviços cadastrados.</p></div><Link to="/ordens-servico/nova" className="rounded-default bg-primary px-5 py-3 text-label-md text-on-primary hover:bg-primary-container">Nova OS</Link></header>
    {state?.ordemCadastrada && <Alerta mensagem="Ordem de serviço cadastrada com sucesso." onFechar={() => navigate('/ordens-servico', { replace: true, state: {} })} />}
    <section className="rounded-xl border border-primary/20 bg-surface-container-lowest p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]"><div><label htmlFor="filtro-os" className="mb-2 block text-label-md">Buscar OS ou cliente</label><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-primary"><Icon name="busca" /></span><input id="filtro-os" type="search" value={termo} onChange={event => setTermo(event.target.value)} placeholder="Número, serviço, item ou cliente" className="w-full rounded-default border border-primary/20 bg-surface-container-low py-3 pl-12 pr-4 focus:outline-2 focus:outline-primary" /></div></div><SelectField id="status-os" label="Status" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{['Aberta', 'Em andamento', 'Pronta', 'Entregue', 'Cancelada'].map(opcao => <option key={opcao}>{opcao}</option>)}</SelectField></div>
      {erro ? <div className="mt-6 space-y-3"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div> : !ordens ? <p role="status" className="mt-6">Carregando ordens…</p> : filtradas.length === 0 ? <p className="mt-6 rounded-lg border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">{ordens.length ? 'Nenhuma ordem corresponde aos filtros.' : 'Nenhuma ordem de serviço cadastrada.'}</p> : <div className="mt-6 overflow-x-auto" role="region" aria-label="Lista de ordens de serviço" tabIndex={0}><table className="w-full min-w-[700px] text-left"><thead className="bg-surface-container-low text-label-md text-on-surface-variant"><tr><th scope="col" className="p-4">OS</th><th scope="col" className="p-4">Cliente / serviço</th><th scope="col" className="p-4">Entrada</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4">Valor</th><th scope="col" className="p-4">Detalhes</th></tr></thead><tbody>{filtradas.map(os => <tr key={os.id} className="border-t border-outline-variant/60"><td className="p-4 font-semibold text-primary">#{os.id}</td><td className="p-4"><strong>{nomes.get(os.cliente_id) ?? `Cliente #${os.cliente_id}`}</strong><span className="block text-label-sm text-on-surface-variant">{os.servico}</span></td><td className="p-4">{data(os.data_entrada)}</td><td className="p-4"><span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">{os.status}</span></td><td className="p-4">{dinheiro(os.valor)}</td><td className="p-4"><Link to={`/ordens-servico/${os.id}`} className="text-label-md text-primary hover:underline">Ver OS</Link></td></tr>)}</tbody></table></div>}
    </section>
  </div>
}
