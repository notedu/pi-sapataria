import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { ErroApi } from '../services/api'
import { buscarOrdem } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'
import NovaOrdemServico from './NovaOrdemServico'

export default function EditarOrdemServico() {
  const { id = '' } = useParams()
  return <CarregarOrdem key={id} id={id} />
}

function CarregarOrdem({ id }: { id: string }) {
  const navigate = useNavigate()
  const [ordem, setOrdem] = useState<OrdemResumo | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    buscarOrdem(id).then(dados => { if (ativo) setOrdem(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Ordem de serviço não encontrada.' : error instanceof Error ? error.message : 'Não foi possível carregar a OS.')
    })
    return () => { ativo = false }
  }, [id, navigate, tentativa])

  if (erro) return <div className="mx-auto max-w-3xl space-y-4"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div>
  if (!ordem) return <p role="status">Carregando ordem de serviço…</p>
  if (!['Aberta', 'Em andamento'].includes(ordem.status)) return <div className="mx-auto max-w-3xl space-y-4"><p>Esta OS não pode mais ser editada no estado {ordem.status}.</p><Link to={`/ordens-servico/${ordem.id}`} className="text-primary underline">Voltar à OS</Link></div>
  return <NovaOrdemServico key={ordem.id} inicial={ordem} />
}
