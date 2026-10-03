import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { buscarCliente } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import { buscarOrdem, listarMateriaisDisponiveis, listarUsosOrdem, mudarStatusOrdem, registrarUsoMaterial } from '../services/ordensServico'
import type { MaterialDisponivel, OrdemResumo, UsoMaterial } from '../services/ordensServico'
import { formatarTelefone } from '../utils/clientes'
import { data, dinheiro, proximoStatus } from '../utils/ordensServico'

export default function DetalhesOrdemServico() {
  const { id = '' } = useParams()
  return <Conteudo key={id} id={id} />
}

function Conteudo({ id }: { id: string }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [ordem, setOrdem] = useState<OrdemResumo | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [usos, setUsos] = useState<UsoMaterial[]>([])
  const [materiais, setMateriais] = useState<MaterialDisponivel[]>([])
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [materialId, setMaterialId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const emCurso = useRef(false)
  useEffect(() => {
    let ativo = true
    buscarOrdem(id).then(async os => {
      const [pessoa, lista, catalogo] = await Promise.all([buscarCliente(String(os.cliente_id)), listarUsosOrdem(os.id), listarMateriaisDisponiveis()])
      if (ativo) { setOrdem(os); setCliente(pessoa); setUsos(lista); setMateriais(catalogo) }
    }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof ErroApi && error.status === 404 ? 'Ordem de serviço não encontrada.' : error instanceof Error ? error.message : 'Não foi possível carregar a ordem.')
    })
    return () => { ativo = false }
  }, [id, navigate, tentativa])

  async function avancar(status: string) {
    if (!ordem || emCurso.current || incerto) return
    emCurso.current = true; setOcupado(true); setErroAcao('')
    try { setOrdem(await mudarStatusOrdem(ordem.id, status)) }
    catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else { setErroAcao(error instanceof Error ? error.message : 'Não foi possível atualizar a OS.'); if (error instanceof ResultadoIncerto) setIncerto(true) }
    } finally { emCurso.current = false; setOcupado(false) }
  }

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || emCurso.current || incerto) return
    if (!materialId || !/^\d+(?:[.,]\d+)?$/.test(quantidade.trim()) || Number(quantidade.replace(',', '.')) <= 0) { setErroAcao('Selecione um material e informe uma quantidade positiva.'); return }
    emCurso.current = true; setOcupado(true); setErroAcao('')
    let registrado = false
    try {
      await registrarUsoMaterial(ordem.id, Number(materialId), quantidade.trim().replace(',', '.'))
      registrado = true
      const [lista, catalogo] = await Promise.all([listarUsosOrdem(ordem.id), listarMateriaisDisponiveis()])
      setUsos(lista); setMateriais(catalogo); setMaterialId(''); setQuantidade('')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else {
        setErroAcao(registrado ? 'O uso foi registrado, mas não foi possível atualizar a tela. Consulte a OS antes de repetir.' : error instanceof Error ? error.message : 'Não foi possível registrar o uso.')
        if (registrado || error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally { emCurso.current = false; setOcupado(false) }
  }

  const proximo = ordem ? proximoStatus(ordem.status) : null
  const nomes = new Map(materiais.map(material => [material.id, material]))
  return <div className="mx-auto max-w-container-max space-y-7"><Link to="/ordens-servico" className="text-label-md text-primary hover:underline">← Voltar para Ordens de Serviço</Link>
    {erro ? <div className="space-y-3"><p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p><Button onClick={() => { setErro(''); setTentativa(v => v + 1) }}>Tentar novamente</Button></div> : !ordem || !cliente ? <p role="status">Carregando ordem de serviço…</p> : <>
      {state?.ordemCadastrada && <Alerta mensagem="Ordem de serviço cadastrada com sucesso." onFechar={() => navigate(`/ordens-servico/${id}`, { replace: true, state: {} })} />}
      {state?.ordemEditada && <Alerta mensagem="Ordem de serviço atualizada com sucesso." onFechar={() => navigate(`/ordens-servico/${id}`, { replace: true, state: {} })} />}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-6"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-headline-lg-mobile md:text-headline-lg">Ordem #{ordem.id}</h1><span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">{ordem.status}</span></div><p className="mt-2 text-on-surface-variant">Entrada em {data(ordem.data_entrada)}</p></div><div className="flex flex-wrap gap-3"><Button variant="secondary" size="compact" onClick={() => window.print()}>Imprimir detalhes</Button>{['Aberta', 'Em andamento'].includes(ordem.status) && <Link to={`/ordens-servico/${ordem.id}/editar`} className="rounded-default bg-primary px-4 py-3 text-label-md text-on-primary hover:bg-primary-container">Editar OS</Link>}</div></header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><div className="space-y-6">
        <section className="rounded-xl bg-surface-container-low p-6"><h2 className="mb-6 text-label-md uppercase text-on-surface-variant">Informações do cliente</h2><Link to={`/clientes/${cliente.id}`} className="text-headline-md text-primary hover:underline">{cliente.nome}</Link><p className="mt-2 text-on-surface-variant">{/^\d{11}$/.test(cliente.telefone) ? formatarTelefone(cliente.telefone) : cliente.telefone}</p></section>
        <section className="rounded-xl bg-surface-container-low p-6"><h2 className="mb-6 text-label-md uppercase text-on-surface-variant">Detalhes do serviço</h2><dl className="grid gap-6 sm:grid-cols-2"><div><dt className="text-label-md text-on-surface-variant">Descrição do item</dt><dd className="mt-2 break-words">{ordem.descricao_calcado}</dd></div><div><dt className="text-label-md text-on-surface-variant">Serviço solicitado</dt><dd className="mt-2 break-words">{ordem.servico}</dd></div><div><dt className="text-label-md text-on-surface-variant">Data de entrada</dt><dd className="mt-2">{data(ordem.data_entrada)}</dd></div><div><dt className="text-label-md text-on-surface-variant">Previsão de entrega</dt><dd className="mt-2">{ordem.prazo_entrega ? data(ordem.prazo_entrega) : 'Não informada'}</dd></div></dl></section>
        <section className="rounded-xl bg-surface-container-low p-6"><h2 className="mb-5 text-label-md uppercase text-on-surface-variant">Notas técnicas e materiais</h2><p className="mb-5 whitespace-pre-wrap">{ordem.observacoes || 'Nenhuma observação registrada.'}</p><h3 className="mb-2 text-label-md">Materiais utilizados</h3>{usos.length === 0 ? <p className="text-on-surface-variant">Nenhum uso registrado.</p> : <ul className="space-y-2">{usos.map(uso => <li key={uso.id} className="rounded-default border border-outline-variant bg-surface-container-lowest px-4 py-3">{nomes.get(uso.material_id)?.nome ?? `Material #${uso.material_id}`} · {uso.quantidade_usada} {nomes.get(uso.material_id)?.unidade ?? ''}</li>)}</ul>}
          {['Aberta', 'Em andamento'].includes(ordem.status) && <form onSubmit={registrar} className="mt-6 grid gap-3 border-t border-outline-variant pt-5 sm:grid-cols-[1fr_140px_auto]"><SelectField id="material-uso" label="Material" value={materialId} onChange={event => setMaterialId(event.target.value)} required><option value="">Selecione</option>{materiais.map(material => <option key={material.id} value={material.id}>{material.nome} ({material.quantidade} {material.unidade})</option>)}</SelectField><InputField id="quantidade-uso" label="Quantidade" inputMode="decimal" value={quantidade} onChange={event => setQuantidade(event.target.value)} required /><div className="flex items-end"><Button type="submit" size="compact" disabled={ocupado || incerto}>Registrar uso</Button></div></form>}
        </section>
      </div><aside className="space-y-6"><section className="rounded-xl bg-surface-container-low p-6"><h2 className="mb-5 text-label-md uppercase text-on-surface-variant">Valor da OS</h2><p className="text-headline-md text-primary">{dinheiro(ordem.valor)}</p><p className="mt-3 text-label-md text-on-surface-variant">Forma de pagamento: {({ pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' } as Record<string, string>)[ordem.forma_pagamento ?? ''] ?? 'Não informada'}</p></section><section className="rounded-xl bg-surface-container-low p-6"><h2 className="mb-5 text-label-md uppercase text-on-surface-variant">Fluxo de trabalho</h2>{proximo ? <Button className="w-full" disabled={ocupado || incerto} onClick={() => avancar(proximo)}>Avançar para {proximo}</Button> : <p className="text-on-surface-variant">Esta OS está em estado final.</p>}{['Aberta', 'Em andamento', 'Pronta'].includes(ordem.status) && <Button variant="dangerOutline" className="mt-3 w-full" disabled={ocupado || incerto} onClick={() => { if (window.confirm('Cancelar esta OS? Materiais utilizados não serão devolvidos automaticamente.')) void avancar('Cancelada') }}>Cancelar OS</Button>}{incerto && <Button variant="secondary" className="mt-3 w-full" onClick={() => window.location.reload()}>Consultar situação atual</Button>}{erroAcao && <p role="alert" className="mt-4 rounded-default bg-error-container p-3 text-on-error-container">{erroAcao}</p>}</section></aside></div>
    </>}
  </div>
}
