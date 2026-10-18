import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Dialog from './Dialog'
import InputField from './InputField'
import SelectField from './SelectField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { listarComprasEstoque, registrarCompraEstoque } from '../services/estoque'
import type { CompraEstoque, Fornecedor, ItemEstoque, TipoEstoque } from '../services/estoque'

type Linha = { selecao: string; quantidade: string; preco_unitario: string }
export default function ComprasEstoque({ produtos, materiais, fornecedores, onFechar, onConcluida }: {
  produtos: ItemEstoque[]; materiais: ItemEstoque[]; fornecedores: Fornecedor[]; onFechar: () => void; onConcluida: () => void
}) {
  const navigate = useNavigate()
  const [aba, setAba] = useState<'nova' | 'historico'>('nova')
  const [fornecedorId, setFornecedorId] = useState('')
  const [linhas, setLinhas] = useState<Linha[]>([{ selecao: '', quantidade: '', preco_unitario: '' }])
  const [compras, setCompras] = useState<CompraEstoque[]>([])
  const [historicoCarregado, setHistoricoCarregado] = useState(false)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  useEffect(() => {
    if (aba !== 'historico') return
    let ativo = true
    listarComprasEstoque().then(lista => { if (ativo) { setCompras(lista); setErro(''); setHistoricoCarregado(true) } })
      .catch(error => { if (ativo) {
        if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
        setErro(error instanceof Error ? error.message : 'Não foi possível consultar as compras.'); setHistoricoCarregado(true)
      } })
    return () => { ativo = false }
  }, [aba, navigate])
  function campo(indice: number, nome: keyof Linha, valor: string) {
    setLinhas(atuais => atuais.map((linha, i) => i === indice ? { ...linha, [nome]: valor } : linha))
  }
  async function salvar(event: FormEvent) {
    event.preventDefault()
    if (ocupado || incerto || !fornecedorId || linhas.some(l => !l.selecao || Number(l.quantidade) <= 0 || !l.preco_unitario)) return
    const itens = linhas.map(linha => {
      const [tipo, id] = linha.selecao.split(':') as [TipoEstoque, string]
      return { material_id: tipo === 'materiais' ? Number(id) : null, produto_id: tipo === 'produtos' ? Number(id) : null, quantidade: linha.quantidade, preco_unitario: linha.preco_unitario }
    })
    setOcupado(true); setErro('')
    try { await registrarCompraEstoque(Number(fornecedorId), itens); onConcluida() }
    catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      if (error instanceof ResultadoIncerto) setIncerto(true)
      setErro(error instanceof ErroApi ? error.message : error instanceof Error ? error.message : 'Não foi possível registrar a compra.')
    }
    finally { setOcupado(false) }
  }
  const rotuloItem = (tipo: TipoEstoque, item: ItemEstoque) => `${item.nome} · ${item.quantidade} ${tipo === 'materiais' ? item.unidade : 'un'}`
  return <Dialog titulo="Compras de estoque" largura="ampla" ocupado={ocupado} onCancelar={onFechar}>
    <div className="mb-5 flex gap-3">
      <Button variant={aba === 'nova' ? 'primary' : 'secondary'} onClick={() => { setAba('nova'); setErro('') }}>Registrar compra</Button>
      <Button variant={aba === 'historico' ? 'primary' : 'secondary'} onClick={() => setAba('historico')}>Histórico de compras</Button>
    </div>
    {erro && <p role="alert" className="mb-4 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
    {aba === 'nova' ? <form className="space-y-4" onSubmit={salvar}>
      <p className="text-body-sm text-on-surface-variant">Cada linha registra o preço histórico da compra e cria uma entrada de estoque. O preço de compra/custo cadastrado do item não é atualizado automaticamente.</p>
      <SelectField id="compra-fornecedor" label="Fornecedor" required value={fornecedorId} onChange={event => setFornecedorId(event.target.value)} disabled={ocupado || incerto}>
        <option value="">Selecione um fornecedor</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
      </SelectField>
      {!fornecedores.length && <p>Cadastre um fornecedor antes de registrar uma compra.</p>}
      <div className="space-y-4">{linhas.map((linha, indice) => <fieldset key={indice} className="grid gap-3 rounded-default border border-outline-variant p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <SelectField id={`compra-item-${indice}`} label="Produto ou Material" required value={linha.selecao} onChange={event => campo(indice, 'selecao', event.target.value)} disabled={ocupado || incerto}>
          <option value="">Selecione um item</option>
          <optgroup label="Produtos para venda">{produtos.map(item => <option key={item.id} value={`produtos:${item.id}`}>{rotuloItem('produtos', item)}</option>)}</optgroup>
          <optgroup label="Materiais">{materiais.map(item => <option key={item.id} value={`materiais:${item.id}`}>{rotuloItem('materiais', item)}</option>)}</optgroup>
        </SelectField>
        <InputField id={`compra-quantidade-${indice}`} label="Quantidade" type="number" min={linha.selecao.startsWith('produtos:') ? '1' : '0.01'} step={linha.selecao.startsWith('produtos:') ? '1' : 'any'} required value={linha.quantidade} disabled={ocupado || incerto} onChange={event => campo(indice, 'quantidade', event.target.value)} />
        <InputField id={`compra-preco-${indice}`} label="Preço unitário na compra (R$)" type="number" min="0" step="0.01" required value={linha.preco_unitario} disabled={ocupado || incerto} onChange={event => campo(indice, 'preco_unitario', event.target.value)} />
        <div className="flex items-end">{linhas.length > 1 && <Button variant="dangerOutline" size="compact" disabled={ocupado} aria-label={`Remover linha ${indice + 1}`} onClick={() => setLinhas(atuais => atuais.filter((_, i) => i !== indice))}>Remover</Button>}</div>
      </fieldset>)}</div>
      <Button variant="secondary" disabled={ocupado || incerto || linhas.length >= 100} onClick={() => setLinhas(atuais => [...atuais, { selecao: '', quantidade: '', preco_unitario: '' }])}>Adicionar item</Button>
      {incerto && <p role="alert">O resultado da requisição é incerto. Atualize os dados antes de tentar novamente.</p>}
      <div className="flex gap-3"><Button type="submit" disabled={ocupado || incerto || !fornecedorId || !linhas.length || linhas.some(l => !l.selecao || Number(l.quantidade) <= 0 || !l.preco_unitario)}>{ocupado ? 'Salvando…' : 'Registrar compra e entradas'}</Button><Button variant="secondary" disabled={ocupado} onClick={onFechar}>Fechar</Button></div>
    </form> : <div className="space-y-4">
      {!historicoCarregado && <p role="status">Carregando compras…</p>}
      {historicoCarregado && !compras.length && !erro && <p>Nenhuma compra registrada.</p>}
      <ul className="max-h-[55dvh] space-y-4 overflow-y-auto">{compras.map(compra => <li key={compra.id} className="rounded-default border border-outline-variant p-4">
        <p className="font-semibold">Compra #{compra.id} · {compra.fornecedor_nome}</p><p className="text-body-sm text-on-surface-variant">{new Date(compra.registrada_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <ul className="mt-3 space-y-2">{compra.itens.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 text-body-sm"><span>{item.item_nome} · {item.quantidade} ×</span><span>{Number(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></li>)}</ul>
      </li>)}</ul>
      <Button variant="secondary" disabled={ocupado} onClick={onFechar}>Fechar</Button>
    </div>}
  </Dialog>
}
