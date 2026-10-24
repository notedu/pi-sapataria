import type { Fornecedor } from '../services/estoque'

export default function SelecaoFornecedores({
  fornecedores,
  selecionados,
  onChange,
  disabled,
}: {
  fornecedores: Fornecedor[]
  selecionados: number[]
  onChange: (ids: number[]) => void
  disabled: boolean
}) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-default border border-outline-variant p-4"
    >
      <legend className="px-2 text-label-md">Fornecedores (opcional)</legend>
      {!fornecedores.length && (
        <p className="text-body-sm">
          Nenhum fornecedor cadastrado. Você pode associá-los depois.
        </p>
      )}
      <div className="max-h-48 space-y-3 overflow-y-auto">
        {fornecedores.map((f) => (
          <label key={f.id} className="flex items-start gap-3 text-body-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={selecionados.includes(f.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selecionados, f.id]
                    : selecionados.filter((id) => id !== f.id),
                )
              }
            />
            <span>
              {f.nome}
              {f.cnpj && (
                <span className="block text-on-surface-variant">
                  CNPJ {f.cnpj}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
