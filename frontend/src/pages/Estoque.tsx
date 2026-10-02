import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import Dialog from '../components/Dialog'
import InputField from '../components/InputField'
import FormularioItemEstoque from '../components/FormularioItemEstoque'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { alterarEstoque, listarFornecedores, listarItens, listarVinculos } from '../services/estoque'
import type { Fornecedor, ItemEstoque, TipoEstoque, Vinculo } from '../services/estoque'
import { lucroProduto } from '../utils/estoque'

type Modal = { acao: 'cadastro' | 'editar' | 'excluir' | 'entrada' | 'saida' | 'associar'; item?: ItemEstoque }
const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = (valor: string | number) => Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 10 })

export default function Estoque() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<TipoEstoque>('produtos')
  const [produtos, setProdutos] = useState<ItemEstoque[]>([])
  const [materiais, setMateriais] = useState<ItemEstoque[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [vinculos, setVinculos] = useState<Record<TipoEstoque, Vinculo[]>>({ produtos: [], materiais: [] })
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [atualizacao, setAtualizacao] = useState(0)
  const [erro, setErro] = useState('')
  const [erroModal, setErroModal] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const envioEmCurso = useRef(false)
  const [incerto, setIncerto] = useState(false)
  const [modal, setModal] = useState<Modal | null>(null)
  const [gerenciar, setGerenciar] = useState(false)
  const [fornecedorEditado, setFornecedorEditado] = useState<Fornecedor | null>(null)
  const [fornecedorExcluir, setFornecedorExcluir] = useState<Fornecedor | null>(null)
  const [nomeFornecedor, setNomeFornecedor] = useState('')
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.allSettled([listarItens('produtos'), listarItens('materiais'), listarFornecedores(), listarVinculos('produtos'), listarVinculos('materiais')]).then(resultados => {
      if (!ativo) return
      const [p, m, f, vp, vm] = resultados
      if (p.status === 'fulfilled') setProdutos(p.value as ItemEstoque[])
      if (m.status === 'fulfilled') setMateriais(m.value as ItemEstoque[])
      if (f.status === 'fulfilled') setFornecedores(f.value as Fornecedor[])
      if (vp.status === 'fulfilled' && vm.status === 'fulfilled') setVinculos({ produtos: vp.value as Vinculo[], materiais: vm.value as Vinculo[] })
      const falha = resultados.find(r => r.status === 'rejected')
      if (falha?.status === 'rejected') {
        if (falha.reason instanceof ErroApi && falha.reason.status === 401) navigate('/login', { replace: true })
        setErro('Não foi possível atualizar todos os dados do estoque. Tente novamente antes de realizar operações.')
      } else { setErro(''); setIncerto(false) }
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [atualizacao, navigate])

  function atualizar() { setCarregando(true); setAtualizacao(valor => valor + 1) }
  function abrir(acao: Modal['acao'], item?: ItemEstoque) {
    setModal({ acao, item }); setErroModal(''); setQuantidade(''); setMotivo('')
    setSelecionados(item ? vinculos[tipo].filter(v => v.item_id === item.id).map(v => v.fornecedor_id) : [])
  }
  function fechar() { setModal(null); setGerenciar(false); setErroModal(''); setFornecedorExcluir(null) }
  async function executar(caminho: string, dados?: unknown, metodo: 'POST' | 'PUT' | 'DELETE' = 'POST', manter = false) {
    if (envioEmCurso.current || incerto || carregando || erro) return
    envioEmCurso.current = true
    setOcupado(true); setErroModal(''); setAviso('')
    try {
      await alterarEstoque(caminho, dados, metodo)
      setAviso('Operação concluída.'); setFornecedorEditado(null); setFornecedorExcluir(null); setNomeFornecedor('')
      if (!manter) fechar()
      atualizar()
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      if (error instanceof ResultadoIncerto) setIncerto(true)
      setErroModal(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally { envioEmCurso.current = false; setOcupado(false) }
  }
  const bloqueado = ocupado || incerto || carregando || !!erro
  const itens = tipo === 'produtos' ? produtos : materiais
  const filtrados = itens.filter(item => (!categoria || item.categoria === categoria)
    && `${item.nome} ${item.categoria}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')))
  const baixos = materiais.filter(item => Number(item.quantidade) < Number(item.quantidade_minima)).length
  const totalCusto = produtos.reduce((total, item) => total + Number(item.quantidade) * Number(item.preco_custo), 0)
    + materiais.reduce((total, item) => total + Number(item.quantidade) * Number(item.custo), 0)
  const nomesFornecedores = (id: number) => fornecedores.filter(f => vinculos[tipo].some(v => v.item_id === id && v.fornecedor_id === f.id)).map(f => f.nome).join(', ')

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">Controle de Estoque</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Produtos para venda e materiais utilizados nos serviços.</p></div>
      <Button variant="secondary" disabled={bloqueado} onClick={() => { setGerenciar(true); setErroModal(''); setFornecedorEditado(null); setNomeFornecedor('') }}>Fornecedores</Button>
    </div>
    {erro && <p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
    {aviso && <Alerta mensagem={aviso} />}
    <Button variant="secondary" disabled={carregando || ocupado} onClick={atualizar}>{carregando ? 'Carregando…' : 'Atualizar dados'}</Button>
    {incerto && <p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">Resultado incerto. Feche o formulário e atualize os dados antes de tentar novamente.</p>}
    <div className="grid gap-4 md:grid-cols-3">
      {[['Itens cadastrados', numero(produtos.length + materiais.length)], ['Materiais abaixo do mínimo', numero(baixos)], ['Valor em estoque a custo', moeda(totalCusto)]].map(([titulo, valor]) =>
        <div key={titulo} className="rounded-lg bg-surface-container p-6"><p className="text-label-md text-on-surface-variant">{titulo}</p><p className="mt-3 text-headline-md">{carregando || erro ? '—' : valor}</p></div>)}
    </div>
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
      <div className="mb-6 flex flex-wrap gap-3" aria-label="Tipo de estoque">
        {(['produtos', 'materiais'] as const).map(t => <Button key={t} aria-pressed={tipo === t} variant={tipo === t ? 'primary' : 'secondary'} onClick={() => { setTipo(t); setCategoria(''); setBusca('') }}>{t === 'produtos' ? 'Produtos para venda' : 'Materiais'}</Button>)}
      </div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-48 flex-1"><InputField id="busca-estoque" label="Buscar item" placeholder="Nome ou categoria" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <div><label htmlFor="categoria-estoque" className="mb-2 block text-label-md">Categoria</label><select id="categoria-estoque" value={categoria} onChange={e => setCategoria(e.target.value)} className="min-h-12 rounded-default border border-outline-variant bg-surface-container-low px-4"><option value="">Todas</option>{[...new Set(itens.map(i => i.categoria))].sort().map(c => <option key={c}>{c}</option>)}</select></div>
        <Button disabled={bloqueado} onClick={() => abrir('cadastro')}>Adicionar {tipo === 'produtos' ? 'produto' : 'material'}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm"><caption className="sr-only">Estoque de {tipo === 'produtos' ? 'produtos para venda' : 'materiais'}</caption>
          <thead className="text-label-sm text-on-surface-variant"><tr>{['Item / Fornecedores', 'Categoria', 'Quantidade', ...(tipo === 'produtos' ? ['Compra', 'Venda', 'Lucro unitário', 'Lucro sobre custo'] : ['Mínimo', 'Custo unitário', 'Situação']), 'Ações'].map(c => <th key={c} scope="col" className="whitespace-nowrap px-3 py-4">{c}</th>)}</tr></thead>
          <tbody>{filtrados.map(item => {
            const lucro = tipo === 'produtos' ? lucroProduto(item.preco_custo!, item.preco_venda!) : null
            const baixo = tipo === 'materiais' && Number(item.quantidade) < Number(item.quantidade_minima)
            return <tr key={item.id} className="border-t border-outline-variant/40">
              <td className="min-w-44 p-3"><p className="font-semibold text-primary">{item.nome}</p><p className="mt-1 text-on-surface-variant">{nomesFornecedores(item.id) || 'Sem fornecedor associado'}</p></td>
              <td className="p-3">{item.categoria}</td><td className="whitespace-nowrap p-3">{numero(item.quantidade)} {item.unidade ?? 'un'}</td>
              {lucro ? <><td className="whitespace-nowrap p-3">{moeda(Number(item.preco_custo))}</td><td className="whitespace-nowrap p-3">{moeda(Number(item.preco_venda))}</td><td className="whitespace-nowrap p-3">{moeda(lucro.valor)}</td><td className="p-3">{lucro.percentual === null ? 'Não calculável (custo zero)' : `${numero(lucro.percentual)}%`}</td></>
                : <><td className="whitespace-nowrap p-3">{numero(item.quantidade_minima!)} {item.unidade}</td><td className="whitespace-nowrap p-3">{moeda(Number(item.custo))}</td><td className="p-3"><span className={`whitespace-nowrap rounded-full px-3 py-1 ${baixo ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface'}`}>{baixo ? 'Abaixo do mínimo' : 'Em dia'}</span></td></>}
              <td className="min-w-64 p-3"><div className="flex flex-wrap gap-2">{(['editar', 'entrada', 'saida', 'associar', 'excluir'] as const).map(acao => <Button key={acao} size="compact" variant={acao === 'excluir' ? 'dangerOutline' : 'secondary'} disabled={bloqueado} aria-label={`${{ editar: 'Editar', entrada: 'Entrada', saida: 'Saída', associar: 'Fornecedores', excluir: 'Excluir' }[acao]}: ${item.nome}`} onClick={() => abrir(acao, item)}>{{ editar: 'Editar', entrada: 'Entrada', saida: 'Saída', associar: 'Fornecedores', excluir: 'Excluir' }[acao]}</Button>)}</div></td>
            </tr>
          })}</tbody>
        </table>
      </div>
      {!carregando && !erro && !filtrados.length && <p role="status" className="py-8 text-center text-on-surface-variant">Nenhum item encontrado.</p>}
      <p className="mt-4 text-body-sm text-on-surface-variant">{tipo === 'produtos' ? 'Lucro previsto por unidade = venda − compra. Percentual = lucro ÷ compra × 100. Produtos não possuem mínimo cadastrado.' : 'Materiais permitem quantidades fracionadas na unidade cadastrada.'}</p>
    </div>
    {modal && <Dialog titulo={modal.acao === 'cadastro' ? 'Cadastrar item' : `${{ editar: 'Editar', excluir: 'Excluir', entrada: 'Entrada', saida: 'Saída', associar: 'Fornecedores' }[modal.acao]}: ${modal.item?.nome}`} ocupado={ocupado} onCancelar={fechar}>
      {erroModal && <p role="alert" className="mb-4 rounded-default bg-error-container p-4 text-on-error-container">{erroModal}</p>}
      {(modal.acao === 'cadastro' || modal.acao === 'editar') && <FormularioItemEstoque tipo={tipo} item={modal.item} ocupado={ocupado} bloqueado={bloqueado} onCancelar={fechar}
        onSalvar={dados => void executar(`/${tipo}${modal.item ? `/${modal.item.id}` : ''}`, dados, modal.item ? 'PUT' : 'POST')} />}
      {modal.acao === 'excluir' && <div className="space-y-4"><p>Confirmar exclusão de {modal.item?.nome}? Só é permitido excluir itens com saldo zero e sem vínculos com movimentações, vendas ou OS.</p><Button variant="danger" disabled={bloqueado} onClick={() => void executar(`/${tipo}/${modal.item!.id}`, undefined, 'DELETE')}>Confirmar exclusão</Button> <Button variant="secondary" disabled={ocupado} onClick={fechar}>Cancelar</Button></div>}
      {(modal.acao === 'entrada' || modal.acao === 'saida') && <form className="space-y-4" onSubmit={e => { e.preventDefault(); void executar('/movimentacoes-estoque', { tipo: modal.acao, [tipo === 'produtos' ? 'produto_id' : 'material_id']: modal.item!.id, quantidade, motivo }) }}>
        <p>Saldo atual: {numero(modal.item!.quantidade)} {modal.item!.unidade ?? 'un'}. {modal.acao === 'saida' && 'Saída manual para perda ou avaria. Consumo em OS e vendas usam seus próprios fluxos.'}</p>
        <InputField id="movimento-quantidade" label="Quantidade" type="number" min={tipo === 'produtos' ? '1' : '0'} step={tipo === 'produtos' ? '1' : 'any'} required value={quantidade} disabled={bloqueado} onChange={e => setQuantidade(e.target.value)} />
        <InputField id="movimento-motivo" label="Motivo" required value={motivo} disabled={bloqueado} onChange={e => setMotivo(e.target.value)} />
        <Button type="submit" disabled={bloqueado || Number(quantidade) <= 0}>Registrar {modal.acao === 'entrada' ? 'entrada' : 'saída'}</Button> <Button variant="secondary" disabled={ocupado} onClick={fechar}>Cancelar</Button>
      </form>}
      {modal.acao === 'associar' && <form className="space-y-4" onSubmit={e => { e.preventDefault(); void executar(`/fornecedores/vinculos/${tipo}/${modal.item!.id}`, { fornecedores_ids: selecionados }, 'PUT') }}>
        <p>Selecione os fornecedores deste item. A associação é opcional.</p>
        {!fornecedores.length && <p>Cadastre um fornecedor no botão Fornecedores da página.</p>}
        <fieldset disabled={bloqueado} className="space-y-3"><legend className="sr-only">Fornecedores disponíveis</legend>{fornecedores.map(f => <label key={f.id} className="flex items-center gap-3"><input type="checkbox" checked={selecionados.includes(f.id)} onChange={e => setSelecionados(e.target.checked ? [...selecionados, f.id] : selecionados.filter(id => id !== f.id))} />{f.nome}</label>)}</fieldset>
        <Button type="submit" disabled={bloqueado}>Salvar associações</Button> <Button variant="secondary" disabled={ocupado} onClick={fechar}>Cancelar</Button>
      </form>}
    </Dialog>}
    {gerenciar && <Dialog titulo="Fornecedores" ocupado={ocupado} onCancelar={fechar}>
      {erroModal && <p role="alert" className="mb-4 rounded-default bg-error-container p-4 text-on-error-container">{erroModal}</p>}
      <form className="mb-6 space-y-4" onSubmit={e => { e.preventDefault(); void executar(`/fornecedores${fornecedorEditado ? `/${fornecedorEditado.id}` : ''}`, { nome: nomeFornecedor }, fornecedorEditado ? 'PUT' : 'POST', true) }}>
        <InputField id="fornecedor-nome" label={fornecedorEditado ? 'Editar nome do fornecedor' : 'Nome do novo fornecedor'} required value={nomeFornecedor} disabled={bloqueado} onChange={e => setNomeFornecedor(e.target.value)} />
        <Button type="submit" disabled={bloqueado}>{fornecedorEditado ? 'Salvar edição' : 'Cadastrar fornecedor'}</Button>
        {fornecedorEditado && <Button variant="secondary" disabled={ocupado} onClick={() => { setFornecedorEditado(null); setNomeFornecedor('') }}>Cancelar edição</Button>}
      </form>
      <ul className="space-y-3">{fornecedores.map(f => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant py-3"><span>{f.nome}</span><div className="flex gap-2"><Button size="compact" variant="secondary" disabled={bloqueado} onClick={() => { setFornecedorEditado(f); setNomeFornecedor(f.nome); setFornecedorExcluir(null) }}>Editar</Button><Button size="compact" variant="dangerOutline" disabled={bloqueado} onClick={() => setFornecedorExcluir(f)}>Excluir</Button></div></li>)}</ul>
      {!fornecedores.length && <p>Nenhum fornecedor cadastrado.</p>}
      {fornecedorExcluir && <div className="my-4 space-y-3 rounded-default bg-error-container p-4"><p>Excluir {fornecedorExcluir.nome}? Fornecedores associados a itens não podem ser excluídos.</p><Button variant="danger" disabled={bloqueado} onClick={() => void executar(`/fornecedores/${fornecedorExcluir.id}`, undefined, 'DELETE', true)}>Confirmar exclusão</Button> <Button variant="secondary" disabled={ocupado} onClick={() => setFornecedorExcluir(null)}>Cancelar</Button></div>}
      <Button className="mt-4" variant="secondary" disabled={ocupado} onClick={fechar}>Fechar</Button>
    </Dialog>}
  </section>
}
