import { useNavigate } from 'react-router-dom'
import FormularioCliente from '../components/FormularioCliente'
import { cadastrarCliente } from '../services/clientes'

export default function NovoCliente() {
  const navigate = useNavigate()
  return <div className="mx-auto max-w-3xl">
    <header className="mb-8"><h1 className="text-headline-lg-mobile md:text-headline-lg">Novo cliente</h1><p className="mt-2 text-on-surface-variant">Informe os dados e contatos do cliente.</p></header>
    <FormularioCliente onSalvar={cadastrarCliente} destino="/clientes" aoSalvar={() => navigate('/clientes', { replace: true, state: { clienteCadastrado: true } })} />
  </div>
}
