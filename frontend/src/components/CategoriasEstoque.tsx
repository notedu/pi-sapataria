import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import InputField from './InputField'
import SelectField from './SelectField'
import { ErroApi } from '../services/api'
import { criarCategoriaEstoque } from '../services/estoque'
import type { CategoriaEstoque, TipoEstoque } from '../services/estoque'

export default function CategoriasEstoque({
  categorias,
  onConcluida,
  onFechar,
}: {
  categorias: CategoriaEstoque[]
  onConcluida: () => void
  onFechar: () => void
}) {
  const [tipo, setTipo] = useState<TipoEstoque>('produtos')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  async function salvar(event: FormEvent) {
    event.preventDefault()
    if (salvando || !nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      await criarCategoriaEstoque(tipo, nome.trim())
      setNome('')
      onConcluida()
    } catch (error) {
      setErro(
        error instanceof ErroApi && error.codigo === 'CATEGORIA_JA_CADASTRADA'
          ? 'Esta categoria já existe para o tipo selecionado.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível cadastrar a categoria.',
      )
    } finally {
      setSalvando(false)
    }
  }
  const visiveis = categorias.filter((categoria) => categoria.tipo === tipo)
  return (
    <div className="space-y-5">
      {erro && (
        <p
          role="alert"
          className="rounded-default bg-error-container p-4 text-on-error-container"
        >
          {erro}
        </p>
      )}
      <form
        onSubmit={salvar}
        className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
      >
        <SelectField
          id="categoria-tipo"
          label="Aplicar a"
          value={tipo}
          onChange={(event) => setTipo(event.target.value as TipoEstoque)}
          disabled={salvando}
        >
          <option value="produtos">Produtos</option>
          <option value="materiais">Materiais</option>
        </SelectField>
        <InputField
          id="categoria-nome"
          label="Nome da categoria"
          required
          maxLength={100}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          disabled={salvando}
        />
        <Button type="submit" disabled={salvando || !nome.trim()}>
          {salvando ? 'Salvando…' : 'Cadastrar'}
        </Button>
      </form>
      <div>
        <h3 className="mb-2 text-title-md">
          Categorias de {tipo === 'produtos' ? 'produtos' : 'materiais'}
        </h3>
        {visiveis.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {visiveis.map((categoria) => (
              <li
                key={categoria.id}
                className="rounded-default bg-surface-container p-3"
              >
                {categoria.nome}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-on-surface-variant">
            Nenhuma categoria cadastrada.
          </p>
        )}
      </div>
      <Button variant="secondary" onClick={onFechar}>
        Fechar
      </Button>
    </div>
  )
}
