import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import FormularioCliente from '../components/FormularioCliente'
import { ErroApi } from '../services/api'
import { atualizarCliente, buscarCliente } from '../services/clientes'
import type { Cliente } from '../services/clientes'

export default function EditarCliente() {
  const { id = '' } = useParams()
  return <Edicao key={id} id={id} />
}

function Edicao({ id }: { id: string }) {
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    buscarCliente(id).then(dados => { if (ativo) setCliente(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Cliente não encontrado.' : error instanceof Error ? error.message : 'Não foi possível carregar o cliente.')
    })
    return () => { ativo = false }
  }, [id, tentativa, navigate])
  const destino = `/clientes/${id}`
  return <div className="mx-auto max-w-3xl space-y-6">
    <Link to={destino} className="text-label-md text-primary hover:underline">Voltar ao perfil</Link>
    <header><h1 className="text-headline-lg-mobile md:text-headline-lg">Editar cliente</h1><p className="mt-2 text-on-surface-variant">Atualize os dados pessoais, contatos e endereço.</p></header>
    {erro ? <div className="space-y-4"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div>
      : !cliente ? <p role="status">Carregando cliente…</p>
        : <FormularioCliente inicial={cliente} destino={destino} onSalvar={dados => atualizarCliente(cliente.id, dados)} aoSalvar={() => navigate(destino, { replace: true, state: { clienteEditado: true } })} />}
  </div>
}
