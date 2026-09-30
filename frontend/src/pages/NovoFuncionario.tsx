import { useNavigate } from 'react-router-dom'
import FormularioFuncionario from '../components/FormularioFuncionario'

export default function NovoFuncionario() {
  const navigate = useNavigate()
  return <div className="mx-auto max-w-3xl">
    <header className="mb-8"><h1 className="text-headline-lg-mobile md:text-headline-lg">Novo funcionário</h1><p className="mt-2 text-on-surface-variant">Cadastre a pessoa e suas credenciais de acesso ao sistema.</p></header>
    <FormularioFuncionario destino="/funcionarios" onSalvo={() => navigate('/funcionarios', { replace: true, state: { cadastroConcluido: true } })} />
  </div>
}
