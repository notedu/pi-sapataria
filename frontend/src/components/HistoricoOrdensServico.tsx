import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Icon from './Icon'
import { ErroApi } from '../services/api'
import { listarOrdens } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'

const data = (valor: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${valor}T12:00:00`))
const dinheiro = (valor: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))

export default function HistoricoOrdensServico({ caminho }: { caminho: string }) {
  return <Historico key={caminho} caminho={caminho} />
}

function Historico({ caminho }: { caminho: string }) {
  const navigate = useNavigate()
  const [ordens, setOrdens] = useState<OrdemResumo[] | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    listarOrdens(caminho).then(dados => { if (ativo) setOrdens(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar as ordens de serviço.')
    })
    return () => { ativo = false }
  }, [caminho, tentativa, navigate])
  return <section aria-label="Ordens de serviço" className="overflow-hidden rounded-default border border-outline-variant">
    <header className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4 md:px-6">
      <h2 className="flex items-center gap-3 text-body-lg font-semibold text-primary"><Icon name="servicos" />Ordens de serviço</h2>
      {ordens && <span className="text-label-sm text-on-surface-variant">{ordens.length} {ordens.length === 1 ? 'registro' : 'registros'}</span>}
    </header>
    {erro ? <div className="space-y-4 p-6"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div>
      : ordens === null ? <p role="status" className="p-6">Carregando ordens de serviço…</p>
        : ordens.length === 0 ? <p className="p-6 text-on-surface-variant">Nenhuma ordem de serviço vinculada.</p>
          : <ul className="divide-y divide-outline-variant">{ordens.map(os => <li key={os.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6">
            <div className="min-w-0 flex-1"><h3 className="break-words text-label-md">OS #{os.id} — {os.servico}</h3><p className="mt-2 text-label-sm text-on-surface-variant">Entrada: {data(os.data_entrada)}</p><p className="mt-1 text-label-sm text-on-surface-variant">Entrega: {os.prazo_entrega ? data(os.prazo_entrega) : 'Prazo não informado'}</p></div>
            <div className="space-y-2 text-right"><p className="text-label-md">{dinheiro(os.valor)}</p><span className="inline-block rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">{os.status}</span></div>
          </li>)}</ul>}
  </section>
}
