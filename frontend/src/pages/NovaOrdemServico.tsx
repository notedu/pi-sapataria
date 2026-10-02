import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/Button'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import TextareaField from '../components/TextareaField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import type { Usuario } from '../services/auth'
import { listarClientes } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import { listarFuncionarios } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import { atualizarOrdem, cadastrarOrdem } from '../services/ordensServico'
import type { OrdemResumo } from '../services/ordensServico'
import { formatarValorOs, valorOsParaApi } from '../utils/ordensServico'

export default function NovaOrdemServico({ inicial }: { inicial?: OrdemResumo }) {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const rascunho = state?.rascunhoOs
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [responsaveis, setResponsaveis] = useState<Funcionario[]>([])
  const [erroCarga, setErroCarga] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteId, setClienteId] = useState(inicial ? String(inicial.cliente_id) : '')
  const [responsavelId, setResponsavelId] = useState(inicial ? String(inicial.responsavel_id) : typeof rascunho?.responsavelId === 'string' ? rascunho.responsavelId : String(usuario.id))
  const [item, setItem] = useState(inicial?.descricao_calcado ?? (typeof rascunho?.item === 'string' ? rascunho.item : ''))
  const [servico, setServico] = useState(inicial?.servico ?? (typeof rascunho?.servico === 'string' ? rascunho.servico : ''))
  const [prazo, setPrazo] = useState(inicial?.prazo_entrega ?? (typeof rascunho?.prazo === 'string' ? rascunho.prazo : ''))
  const [valor, setValor] = useState(() => formatarValorOs(inicial?.valor ?? (typeof rascunho?.valor === 'string' ? rascunho.valor : '')))
  const [pagamento, setPagamento] = useState(inicial?.forma_pagamento ?? (typeof rascunho?.pagamento === 'string' ? rascunho.pagamento : ''))
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? (typeof rascunho?.observacoes === 'string' ? rascunho.observacoes : ''))
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const envioEmCurso = useRef(false)
  useEffect(() => {
    let ativo = true
    Promise.all([listarClientes(), usuario.perfil === 'administrador' ? listarFuncionarios() : Promise.resolve([])]).then(([pessoas, equipe]) => {
      if (ativo) {
        setClientes(pessoas); setResponsaveis(equipe.filter(pessoa => pessoa.ativo))
        if (Number.isInteger(state?.clienteRecemCadastrado) && pessoas.some(pessoa => pessoa.id === state.clienteRecemCadastrado)) setClienteId(String(state.clienteRecemCadastrado))
      }
    }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErroCarga(error instanceof Error ? error.message : 'Não foi possível carregar o formulário.')
    })
    return () => { ativo = false }
  }, [navigate, tentativa, usuario.perfil, state])

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEmCurso.current || incerto) return
    if (!clienteId || !responsavelId || !item.trim() || !servico.trim() || !valor) {
      setErro('Selecione cliente e responsável, descreva o item e o serviço e informe o valor da OS.')
      return
    }
    if (prazo && Number.isNaN(Date.parse(prazo))) { setErro('Informe um prazo de entrega válido.'); return }
    envioEmCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      const dados = { cliente_id: Number(clienteId), responsavel_id: Number(responsavelId), descricao_calcado: item.trim(), servico: servico.trim(), valor: valorOsParaApi(valor), prazo_entrega: prazo || null, forma_pagamento: pagamento || null, observacoes: observacoes.trim() || null }
      const ordem = inicial ? await atualizarOrdem(inicial.id, dados) : await cadastrarOrdem(dados)
      navigate(`/ordens-servico/${ordem.id}`, { replace: true, state: { [inicial ? 'ordemEditada' : 'ordemCadastrada']: true } })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else { setErro(error instanceof Error ? error.message : 'Não foi possível salvar a ordem.'); if (error instanceof ResultadoIncerto) setIncerto(true) }
    } finally { envioEmCurso.current = false; setEnviando(false) }
  }

  const filtrados = clientes?.filter(cliente => `${cliente.nome} ${cliente.telefone}`.toLocaleLowerCase('pt-BR').includes(buscaCliente.toLocaleLowerCase('pt-BR'))) ?? []
  const novoClienteState = { origemNovaOs: true, rascunhoOs: { responsavelId, item, servico, prazo, valor, pagamento, observacoes } }
  return <div className="mx-auto max-w-4xl space-y-7">
    <header><Link to="/ordens-servico" className="text-label-md text-primary hover:underline">Ordens de Serviço</Link><span className="mx-2 text-outline">›</span><span className="text-label-md text-on-surface-variant">{inicial ? `Editar OS #${inicial.id}` : 'Nova ordem'}</span><h1 className="mt-3 text-headline-lg-mobile text-primary md:text-headline-lg">{inicial ? `Editar Ordem de Serviço #${inicial.id}` : 'Novo cadastro de Ordem de Serviço'}</h1><p className="mt-2 text-on-surface-variant">{inicial ? 'Atualize os dados da ordem de serviço.' : 'Preencha os dados para registrar um novo serviço.'}</p></header>
    {erroCarga ? <div className="space-y-3"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erroCarga}</p><Button onClick={() => { setErroCarga(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div> : !clientes ? <p role="status">Carregando formulário…</p> : <form onSubmit={salvar} className="space-y-5">
      <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8"><h2 className="mb-6 text-headline-md text-primary">Informações do cliente</h2><div className="grid gap-4 md:grid-cols-2"><InputField id="busca-cliente-os" label="Buscar cliente por nome ou telefone" value={buscaCliente} onChange={event => setBuscaCliente(event.target.value)} placeholder="Digite para filtrar" /><SelectField id="cliente-os" label="Selecionar cliente *" required value={clienteId} onChange={event => setClienteId(event.target.value)}><option value="">Selecione</option>{filtrados.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome} · {cliente.telefone}</option>)}</SelectField></div>{!inicial && <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-label-md text-on-surface-variant">Cliente ainda não cadastrado?</span><Link to="/clientes/novo" state={novoClienteState} className="inline-flex min-h-11 items-center rounded-default border border-primary/30 bg-surface px-4 py-2 text-label-md text-primary hover:bg-primary/5">Cadastrar cliente</Link></div>}{usuario.perfil === 'administrador' ? <div className="mt-5 max-w-md"><SelectField id="responsavel-os" label="Responsável *" required value={responsavelId} onChange={event => setResponsavelId(event.target.value)}><option value="">Selecione</option>{responsaveis.map(pessoa => <option key={pessoa.id} value={pessoa.id}>{pessoa.nome}</option>)}</SelectField></div> : <p className="mt-5 text-label-md text-on-surface-variant">Responsável: {inicial && inicial.responsavel_id !== usuario.id ? `Funcionário #${inicial.responsavel_id}` : usuario.nome}</p>}</section>
      <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8"><h2 className="mb-6 text-headline-md text-primary">Detalhes do serviço</h2><div className="space-y-5"><InputField id="item-os" label="Descrição do item *" required value={item} onChange={event => setItem(event.target.value)} placeholder="Ex.: Botas de couro marrom" /><TextareaField id="servico-os" label="Serviço solicitado *" required value={servico} onChange={event => setServico(event.target.value)} placeholder="Descreva o reparo solicitado" /><TextareaField id="observacoes-os" label="Observações (opcional)" value={observacoes} onChange={event => setObservacoes(event.target.value)} placeholder="Informações adicionais da OS" /></div></section>
      <div className="grid gap-5 md:grid-cols-2"><section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8"><h2 className="mb-6 text-headline-md text-primary">Datas</h2><p className="mb-5 text-label-md text-on-surface-variant">A entrada é registrada automaticamente.</p><InputField id="prazo-os" label="Previsão de entrega (opcional)" type="date" value={prazo} onChange={event => setPrazo(event.target.value)} /></section><section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8"><h2 className="mb-6 text-headline-md text-primary">Valor e pagamento</h2><div className="space-y-5"><InputField id="valor-os" label="Valor da OS (R$) *" required inputMode="numeric" value={valor} onChange={event => setValor(formatarValorOs(event.target.value))} placeholder="R$ 0,00" /><SelectField id="pagamento-os" label="Forma de pagamento (opcional)" value={pagamento} onChange={event => setPagamento(event.target.value)}><option value="">Não informada</option><option value="pix">PIX</option><option value="credito">Crédito</option><option value="debito">Débito</option><option value="dinheiro">Dinheiro</option></SelectField><p className="text-label-sm text-on-surface-variant">Digite os números do valor, incluindo os centavos. Ex.: 123456 → R$ 1.234,56. O valor é manual, sem imposto automático.</p></div></section></div>
      {erro && <p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant pt-6"><Link to={inicial ? `/ordens-servico/${inicial.id}` : '/ordens-servico'} className="rounded-default border border-primary/30 bg-surface px-5 py-3 text-label-md text-primary">Cancelar</Link>{incerto ? <Link to={inicial ? `/ordens-servico/${inicial.id}` : '/ordens-servico'} className="rounded-default bg-primary px-5 py-3 text-label-md text-on-primary">Consultar {inicial ? 'OS' : 'lista'}</Link> : <Button type="submit" disabled={enviando || clientes.length === 0}>{enviando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Cadastrar Ordem de Serviço'}</Button>}</div>
    </form>}
  </div>
}
