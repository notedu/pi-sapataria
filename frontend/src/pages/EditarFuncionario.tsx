import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import FormularioFuncionario from '../components/FormularioFuncionario'
import { ErroApi } from '../services/api'
import { buscarFuncionario } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'

export default function EditarFuncionario() {
  const { id = '' } = useParams()
  return <Edicao key={id} id={id} />
}

function Edicao({ id }: { id: string }) {
  const navigate = useNavigate()
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    buscarFuncionario(id).then(dados => { if (ativo) setFuncionario(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.status === 403) navigate('/dashboard', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Funcionário não encontrado.' : error instanceof Error ? error.message : 'Não foi possível carregar o funcionário.')
    })
    return () => { ativo = false }
  }, [id, tentativa, navigate])
  const destino = `/funcionarios/${id}`
  return <div className="mx-auto max-w-3xl space-y-6">
    <Link to={destino} className="text-label-md text-primary hover:underline">Voltar ao perfil</Link>
    <header><h1 className="text-headline-lg-mobile md:text-headline-lg">Editar funcionário</h1><p className="mt-2 text-on-surface-variant">Atualize os dados pessoais e confirme com sua senha de Administrador.</p></header>
    {erro ? <div className="space-y-4"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div>
      : !funcionario ? <p role="status">Carregando funcionário…</p>
        : <FormularioFuncionario inicial={funcionario} destino={destino} onSalvo={() => navigate(destino, { replace: true, state: { funcionarioEditado: true } })} />}
  </div>
}
