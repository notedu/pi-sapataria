import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { ErroApi } from '../services/api'
import { listarHistoricoEstoque } from '../services/estoque'
import type {
  ItemEstoque,
  MovimentoEstoque,
  TipoEstoque,
} from '../services/estoque'

export default function HistoricoEstoque({
  tipo,
  item,
  onFechar,
}: {
  tipo: TipoEstoque
  item: ItemEstoque
  onFechar: () => void
}) {
  const navigate = useNavigate()
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    listarHistoricoEstoque(tipo, item.id)
      .then((lista) => {
        if (ativo) {
          setMovimentos(lista)
          setErro('')
        }
      })
      .catch((error) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível consultar as movimentações.',
          )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [tipo, item.id, tentativa, navigate])
  const unidade = item.unidade ?? 'un'
  return (
    <div className="space-y-4" aria-busy={carregando}>
      <p className="text-body-sm">
        Saldo atual:{' '}
        {Number(item.quantidade).toLocaleString('pt-BR', {
          maximumFractionDigits: 10,
        })}{' '}
        {unidade}. O cadastro e as movimentações permanecem mesmo quando o saldo
        chega a zero.
      </p>
      {carregando && <p role="status">Carregando histórico…</p>}
      {erro && (
        <div className="space-y-3">
          <p
            role="alert"
            className="rounded-default bg-error-container p-4 text-on-error-container"
          >
            {erro}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setCarregando(true)
              setTentativa((v) => v + 1)
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {!carregando &&
        !erro &&
        (movimentos.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label={`Movimentações de ${item.nome}; deslize horizontalmente para ver todas as colunas`}
            tabIndex={0}
          >
            <table className="w-full min-w-[620px] text-left text-body-sm">
              <caption className="sr-only">
                Movimentações de {item.nome}
              </caption>
              <thead>
                <tr>
                  {[
                    'Data (Brasília)',
                    'Tipo',
                    'Quantidade',
                    'Origem',
                    'Motivo',
                  ].map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="whitespace-nowrap p-3 text-label-sm text-on-surface-variant"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimentos.map((m) => (
                  <tr key={m.id} className="border-t border-outline-variant/50">
                    <td className="whitespace-nowrap p-3">
                      {new Date(m.data).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                      })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 ${m.tipo === 'entrada' ? 'bg-success-container text-on-success-container' : 'bg-secondary-container text-on-surface'}`}
                      >
                        {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {Number(m.quantidade).toLocaleString('pt-BR', {
                        maximumFractionDigits: 10,
                      })}{' '}
                      {unidade}
                    </td>
                    <td className="p-3">
                      {m.material_os_id !== null
                        ? `Uso em OS (registro #${m.material_os_id})`
                        : m.item_venda_id !== null
                          ? `Item de venda #${m.item_venda_id}`
                          : m.item_compra_id !== null
                            ? `Compra (item #${m.item_compra_id})`
                            : m.reversao_de_id !== null
                              ? `Reversão de #${m.reversao_de_id}`
                              : 'Manual'}
                    </td>
                    <td className="min-w-40 p-3">{m.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p role="status">Este item ainda não possui movimentações.</p>
        ))}
      <Button variant="secondary" onClick={onFechar}>
        Fechar
      </Button>
    </div>
  )
}
