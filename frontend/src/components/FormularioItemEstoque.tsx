import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import InputField from './InputField'
import SelectField from './SelectField'
import SelecaoFornecedores from './SelecaoFornecedores'
import { categoriasSugeridas, unidadesDaCategoria } from '../config/estoque'
import type { DadosItemEstoque, Fornecedor, ItemEstoque, TipoEstoque } from '../services/estoque'

export default function FormularioItemEstoque({ tipo, item, ocupado, bloqueado, onSalvar, onCancelar, categorias, fornecedores, fornecedoresIniciais }: {
  tipo: TipoEstoque; item?: ItemEstoque; ocupado: boolean; bloqueado: boolean
  onSalvar: (dados: DadosItemEstoque) => void; onCancelar: () => void
  categorias: string[]; fornecedores: Fornecedor[]; fornecedoresIniciais: number[]
}) {
  const [dados, setDados] = useState<Record<string, string>>({
    nome: item?.nome ?? '', categoria: item?.categoria ?? '',
    ...(tipo === 'produtos' ? { quantidade_minima: item?.quantidade_minima ?? '', preco_custo: item?.preco_custo ?? '', preco_venda: item?.preco_venda ?? '' }
      : { unidade: item?.unidade ?? '', quantidade_minima: item?.quantidade_minima ?? '', custo: item?.custo ?? '' }),
  })
  const [selecionados, setSelecionados] = useState(fornecedoresIniciais)
  const unidadeBloqueada = !!item && (item.unidade_bloqueada !== false || Number(item.quantidade) > 0)
  const unidades = unidadesDaCategoria(dados.categoria)
  const opcoesUnidade = [...new Set([...unidades, ...(item?.unidade ? [item.unidade] : [])])]
  const campos = tipo === 'produtos'
    ? [['quantidade_minima', 'Quantidade mínima (unidades)'], ['preco_custo', 'Preço de compra (R$)'], ['preco_venda', 'Preço de venda (R$)']]
    : [['quantidade_minima', 'Quantidade mínima'], ['custo', `Custo por ${dados.unidade || 'unidade'} (R$)`]]
  function categoria(valor: string) {
    const opcoes = unidadesDaCategoria(valor)
    setDados({ ...dados, categoria: valor, ...(!item && opcoes.length && !opcoes.includes(dados.unidade) ? { unidade: opcoes[0] } : {}) })
  }
  function enviar(event: FormEvent) { event.preventDefault(); if (!ocupado && !bloqueado) onSalvar({ ...dados, fornecedores_ids: selecionados }) }
  return <form onSubmit={enviar} className="space-y-4">
    <fieldset disabled={ocupado || bloqueado} className="space-y-4">
      <InputField id="item-nome" label="Nome" required value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} />
      <InputField id="item-categoria" label="Categoria" required list="categorias-item" value={dados.categoria} onChange={e => categoria(e.target.value)} />
      <datalist id="categorias-item">{[...new Set([...categoriasSugeridas[tipo], ...categorias])].sort().map(c => <option key={c} value={c} />)}</datalist>
      <p className="text-body-sm text-on-surface-variant">Escolha uma sugestão ou informe outra categoria.</p>
      {tipo === 'materiais' && <>
        {unidades.length ? <SelectField id="item-unidade" label="Unidade de controle" required value={dados.unidade} disabled={unidadeBloqueada} onChange={e => setDados({ ...dados, unidade: e.target.value })}>
          <option value="">Selecione a unidade</option>{opcoesUnidade.map(u => <option key={u} value={u}>{u === 'kg' ? 'Quilograma (kg)' : u === 'g' ? 'Grama (g)' : `${u} (unidade cadastrada)`}</option>)}
        </SelectField> : <>
          <InputField id="item-unidade" label="Unidade de controle" required list="unidades-item" value={dados.unidade} disabled={unidadeBloqueada} onChange={e => setDados({ ...dados, unidade: e.target.value })} />
          <datalist id="unidades-item">{['un', 'kg', 'g', 'L', 'mL', 'm'].map(u => <option key={u} value={u} />)}</datalist>
        </>}
        <p className="text-body-sm text-on-surface-variant">{unidadeBloqueada ? 'A unidade está bloqueada para preservar saldo e histórico.' : 'Quantidade, mínimo, custo e consumo usarão esta unidade. Não há conversão automática entre unidades.'}</p>
      </>}
      {campos.map(([campo, label]) => {
        const numerico = !['nome', 'categoria', 'unidade'].includes(campo)
        return <InputField key={campo} id={`item-${campo}`} label={label} required value={dados[campo]}
          type={numerico ? 'number' : 'text'} min={numerico ? '0' : undefined}
          step={numerico ? (campo === 'quantidade_minima' ? (tipo === 'produtos' ? '1' : 'any') : '0.01') : undefined}
          onChange={event => setDados({ ...dados, [campo]: event.target.value })} />
      })}
      <SelecaoFornecedores fornecedores={fornecedores} selecionados={selecionados} onChange={setSelecionados} disabled={ocupado || bloqueado} />
      <p className="text-body-sm text-on-surface-variant">O cadastro começa com saldo zero. Use Entrada para registrar a reposição. A edição não altera o saldo nem o limite mínimo.</p>
      <Button type="submit" disabled={ocupado || bloqueado}>{ocupado ? 'Salvando…' : 'Salvar'}</Button>
    </fieldset>
    <Button variant="secondary" disabled={ocupado} onClick={onCancelar}>Cancelar</Button>
  </form>
}
