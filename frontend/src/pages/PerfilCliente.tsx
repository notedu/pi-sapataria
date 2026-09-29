import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import CartaoInformacoes from '../components/CartaoInformacoes'
import Icon from '../components/Icon'
import Alerta from '../components/Alerta'
import Dialog from '../components/Dialog'
import Button from '../components/Button'
import EnderecoPorCep from '../components/EnderecoPorCep'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { buscarCliente, excluirCliente, listarOrdensCliente } from '../services/clientes'
import type { Cliente, OrdemCliente } from '../services/clientes'
import { formatarCpf, formatarTelefone } from '../utils/clientes'

const data = (valor: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(valor.includes('T') ? valor : `${valor}T12:00:00`))
const dinheiro = (valor: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))

export default function PerfilCliente() {
  const { id = '' } = useParams()
  // Reinicia os estados quando a navegação troca o cliente sem desmontar a rota.
  return <ConteudoPerfil key={id} id={id} />
}

function ConteudoPerfil({ id }: { id: string }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
  const [exclusaoIncerta, setExclusaoIncerta] = useState(false)
  const exclusaoEmCurso = useRef(false)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ordens, setOrdens] = useState<OrdemCliente[] | null>(null)
  const [erro, setErro] = useState('')
  const [erroOrdens, setErroOrdens] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [tentativaOrdens, setTentativaOrdens] = useState(0)

  useEffect(() => {
    let ativo = true
    buscarCliente(id).then(dados => { if (ativo) setCliente(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Cliente não encontrado.' : error instanceof Error ? error.message : 'Não foi possível carregar o cliente.')
    })
    return () => { ativo = false }
  }, [id, tentativa, navigate])

  useEffect(() => {
    if (!cliente) return
    let ativo = true
    listarOrdensCliente(id).then(dados => { if (ativo) setOrdens(dados) }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErroOrdens(error instanceof Error ? error.message : 'Não foi possível carregar as ordens de serviço.')
    })
    return () => { ativo = false }
  }, [id, cliente, tentativaOrdens, navigate])

  async function confirmarExclusao() {
    if (!cliente || exclusaoEmCurso.current || exclusaoIncerta) return
    exclusaoEmCurso.current = true
    setExcluindo(true)
    setErroExclusao('')
    try {
      await excluirCliente(cliente.id)
      navigate('/clientes', { replace: true, state: { clienteExcluido: true } })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ErroApi && error.status === 404) navigate('/clientes', { replace: true, state: { clienteAusente: true } })
      else {
        setErroExclusao(error instanceof Error ? error.message : 'Não foi possível excluir o cliente.')
        if (error instanceof ResultadoIncerto) setExclusaoIncerta(true)
      }
    } finally {
      exclusaoEmCurso.current = false
      setExcluindo(false)
    }
  }

  return <div className="mx-auto max-w-container-max space-y-6">
    <Link to="/clientes" className="text-label-md text-primary hover:underline underline-offset-4">Voltar para clientes</Link>
    {erro ? <div className="space-y-4"><p role="alert">{erro}</p><Button onClick={() => { setErro(''); setTentativa(valor => valor + 1) }}>Tentar novamente</Button></div>
      : !cliente ? <p role="status">Carregando cliente…</p> : <>
        {state?.clienteEditado && <Alerta mensagem="Cliente atualizado com sucesso." onFechar={() => navigate(`/clientes/${id}`, { replace: true, state: { ...state, clienteEditado: undefined } })} />}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0"><h1 className="break-words text-headline-lg-mobile md:text-headline-lg">{cliente.nome}</h1><p className="mt-2 text-label-md font-normal text-on-surface-variant">{cliente.criado_em ? `Cliente desde ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(cliente.criado_em))}` : 'Data de cadastro não informada'}</p></div>
          <Button variant="secondary" size="compact" className="flex items-center gap-2" onClick={() => navigate(`/clientes/${cliente.id}/editar`)}><Icon name="editar" />Editar</Button>
        </header>
        {confirmando && <Dialog titulo="Excluir cliente" ocupado={excluindo} onCancelar={() => setConfirmando(false)}>
          <p>Deseja excluir o cadastro de <strong>{cliente.nome}</strong>? Esta ação não pode ser desfeita.</p>
          <p className="mt-3 text-on-surface-variant">Clientes com ordens de serviço vinculadas não podem ser excluídos.</p>
          {erroExclusao && <p role="alert" className="mt-4 rounded-default bg-error-container p-4 text-on-error-container">{erroExclusao}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" autoFocus disabled={excluindo} onClick={() => setConfirmando(false)}>Cancelar</Button>
            {exclusaoIncerta ? <Link to="/clientes" className="rounded-default px-4 py-3 text-primary underline">Consultar lista</Link>
              : <Button variant="danger" disabled={excluindo} onClick={confirmarExclusao}>{excluindo ? 'Excluindo…' : 'Confirmar exclusão'}</Button>}
          </div>
        </Dialog>}
        <div className="grid gap-6 lg:grid-cols-3">
          <CartaoInformacoes titulo="Informações pessoais" icone="funcionarios" destaque>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ['CPF', cliente.cpf ? formatarCpf(cliente.cpf) : 'Não informado'],
                ['Telefone', /^\d{11}$/.test(cliente.telefone) ? formatarTelefone(cliente.telefone) : cliente.telefone],
                ['E-mail', cliente.email || 'Não informado'],
              ].map(([rotulo, valor]) => <div key={rotulo}><dt className="text-label-sm uppercase text-on-surface-variant">{rotulo}</dt><dd className="mt-1 break-words text-label-md font-normal">{valor}</dd></div>)}
            </dl>
          </CartaoInformacoes>
          <div className="grid lg:col-span-2">
            <CartaoInformacoes titulo="Detalhes de endereço" icone="endereco">
              {cliente.cep ? <>
                <EnderecoPorCep cep={cliente.cep} numero={cliente.numero} perfil />
              </> : <p className="break-words text-label-md font-normal">{cliente.endereco ? `Endereço do cadastro anterior: ${cliente.endereco}` : 'Endereço não informado.'}</p>}
            </CartaoInformacoes>
          </div>
        </div>
        <section aria-labelledby="ordens-cliente" className="overflow-hidden rounded-default border border-outline-variant">
          <header className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4 md:px-6">
            <h2 id="ordens-cliente" className="flex items-center gap-3 text-body-lg font-semibold text-primary"><Icon name="servicos" />Ordens de serviço</h2>
            {ordens && <span className="text-label-sm text-on-surface-variant">{ordens.length} {ordens.length === 1 ? 'registro' : 'registros'}</span>}
          </header>
          {erroOrdens ? <div className="space-y-4 p-6"><p role="alert">{erroOrdens}</p><Button onClick={() => { setErroOrdens(''); setTentativaOrdens(valor => valor + 1) }}>Tentar novamente</Button></div>
            : ordens === null ? <p role="status" className="p-6">Carregando ordens de serviço…</p>
              : ordens.length === 0 ? <p className="p-6 text-on-surface-variant">Este cliente ainda não possui ordens de serviço.</p>
                : <ul className="divide-y divide-outline-variant">{ordens.map(os => <li key={os.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6">
                  <div className="min-w-0 flex-1"><h3 className="break-words text-label-md">OS #{os.id} — {os.servico}</h3><p className="mt-2 flex items-center gap-2 text-label-sm text-on-surface-variant"><Icon name="calendario" className="h-4 w-4" />Entrada: {data(os.data_entrada)}</p><p className="mt-1 text-label-sm text-on-surface-variant">Entrega: {os.prazo_entrega ? data(os.prazo_entrega) : 'Prazo não informado'}</p></div>
                  <div className="space-y-2 text-right"><p className="text-label-md">{dinheiro(os.valor)}</p><span className="inline-block rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">{os.status}</span></div>
                </li>)}</ul>}
        </section>
        <CartaoInformacoes titulo="Observações" icone="observacoes">
          <p className="whitespace-pre-wrap break-words text-label-md font-normal text-on-surface-variant">{cliente.observacoes || 'Nenhuma observação registrada.'}</p>
        </CartaoInformacoes>
        <footer className="flex justify-end border-t border-outline-variant/50 pt-5">
          <Button variant="dangerOutline" size="compact" onClick={() => { if (!exclusaoIncerta) setErroExclusao(''); setConfirmando(true) }}>Excluir cliente</Button>
        </footer>
      </>}
  </div>
}
