import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import InputField from './InputField'
import type { ItemEstoque, TipoEstoque } from '../services/estoque'

export default function FormularioItemEstoque({ tipo, item, ocupado, bloqueado, onSalvar, onCancelar }: {
  tipo: TipoEstoque; item?: ItemEstoque; ocupado: boolean; bloqueado: boolean
  onSalvar: (dados: Record<string, string>) => void; onCancelar: () => void
}) {
  const [dados, setDados] = useState<Record<string, string>>({
    nome: item?.nome ?? '', categoria: item?.categoria ?? '',
    ...(tipo === 'produtos' ? { preco_custo: item?.preco_custo ?? '', preco_venda: item?.preco_venda ?? '' }
      : { unidade: item?.unidade ?? '', quantidade_minima: item?.quantidade_minima ?? '', custo: item?.custo ?? '' }),
  })
  const campos = tipo === 'produtos'
    ? [['preco_custo', 'Preço de compra (R$)'], ['preco_venda', 'Preço de venda (R$)']]
    : [['unidade', 'Unidade (ex.: L, kg, un)'], ['quantidade_minima', 'Quantidade mínima'], ['custo', 'Custo por unidade (R$)']]
  function enviar(event: FormEvent) { event.preventDefault(); onSalvar(dados) }
  return <form onSubmit={enviar} className="space-y-4">
    <fieldset disabled={ocupado || bloqueado} className="space-y-4">
      {[['nome', 'Nome'], ['categoria', 'Categoria'], ...campos].map(([campo, label]) => {
        const numerico = !['nome', 'categoria', 'unidade'].includes(campo)
        return <InputField key={campo} id={`item-${campo}`} label={label} required value={dados[campo]}
          type={numerico ? 'number' : 'text'} min={numerico ? '0' : undefined}
          step={numerico ? (campo === 'quantidade_minima' ? 'any' : '0.01') : undefined}
          onChange={event => setDados({ ...dados, [campo]: event.target.value })} />
      })}
      <p className="text-body-sm text-on-surface-variant">O cadastro começa com saldo zero. Use Entrada para registrar a reposição. A edição não altera o saldo.</p>
      <Button type="submit" disabled={ocupado || bloqueado}>{ocupado ? 'Salvando…' : 'Salvar'}</Button>
    </fieldset>
    <Button variant="secondary" disabled={ocupado} onClick={onCancelar}>Cancelar</Button>
  </form>
}
