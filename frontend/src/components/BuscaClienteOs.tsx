import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Cliente } from '../services/clientes'

export default function BuscaClienteOs({
  clientes,
  busca,
  clienteId,
  onBusca,
  onSelecionar,
}: {
  clientes: Cliente[]
  busca: string
  clienteId: string
  onBusca: (valor: string) => void
  onSelecionar: (cliente: Cliente) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const sugestoes = clientes
    .filter((cliente) =>
      `${cliente.nome} ${cliente.telefone}`
        .toLocaleLowerCase('pt-BR')
        .includes(termo),
    )
    .slice(0, 8)

  function escolher(cliente: Cliente) {
    onSelecionar(cliente)
    setAberto(false)
  }

  function teclado(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setAberto(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setAberto(true)
      if (sugestoes.length)
        setAtivo(
          (indice) =>
            (indice + (event.key === 'ArrowDown' ? 1 : -1) + sugestoes.length) %
            sugestoes.length,
        )
    }
    if (event.key === 'Enter' && aberto && sugestoes[ativo]) {
      event.preventDefault()
      escolher(sugestoes[ativo])
    }
  }

  return (
    <div className="relative max-w-xl">
      <label
        htmlFor="busca-cliente-os"
        className="mb-2 block text-label-md text-on-surface"
      >
        Buscar cliente por nome ou telefone *
      </label>
      <input
        id="busca-cliente-os"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-required="true"
        aria-autocomplete="list"
        aria-controls="sugestoes-cliente-os"
        aria-expanded={aberto}
        aria-activedescendant={
          aberto && sugestoes[ativo]
            ? `sugestao-cliente-${sugestoes[ativo].id}`
            : undefined
        }
        value={busca}
        onChange={(event) => {
          onBusca(event.target.value)
          setAtivo(0)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={teclado}
        placeholder="Digite e escolha um cliente"
        className="w-full rounded-default border border-primary/20 bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-2 focus:outline-primary"
      />
      {clienteId && (
        <p className="mt-1 text-label-sm text-primary">Cliente selecionado</p>
      )}
      {aberto && (
        <ul
          id="sugestoes-cliente-os"
          role="listbox"
          aria-label="Clientes encontrados"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-default border border-outline-variant bg-surface-container-lowest shadow-lg"
        >
          {sugestoes.length ? (
            sugestoes.map((cliente, indice) => (
              <li
                key={cliente.id}
                id={`sugestao-cliente-${cliente.id}`}
                role="option"
                aria-selected={indice === ativo}
                className={indice === ativo ? 'bg-primary-fixed' : ''}
              >
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-primary-fixed"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => escolher(cliente)}
                >
                  {cliente.nome} · {cliente.telefone}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-on-surface-variant">
              Nenhum cliente encontrado.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
