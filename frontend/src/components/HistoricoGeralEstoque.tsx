import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { ErroApi } from '../services/api'
import { listarHistoricoGeralEstoque } from '../services/estoque'
import type { HistoricoGeralEstoque } from '../services/estoque'

const tipoLabel: Record<HistoricoGeralEstoque['tipo'], string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  cadastro: 'Cadastro',
}
const tipoClasse: Record<HistoricoGeralEstoque['tipo'], string> = {
  entrada: 'border-success/30 bg-success-container text-on-success-container',
  saida: 'border-error/30 bg-error-container text-on-error-container',
  cadastro: 'border-warning/40 bg-warning-container text-on-warning-container',
}

export default function HistoricoGeralEstoque({
  onFechar,
}: {
  onFechar: () => void
}) {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState<HistoricoGeralEstoque[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    listarHistoricoGeralEstoque()
      .then((dados) => {
        if (ativo) setRegistros(dados)
      })
      .catch((error) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível consultar o histórico geral.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [navigate])
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-on-surface-variant">
        Os registros são mantidos mesmo quando o saldo volta a zero.
      </p>
      {erro && (
        <p
          role="alert"
          className="rounded-default bg-error-container p-4 text-on-error-container"
        >
          {erro}
        </p>
      )}
      {carregando && <p role="status">Carregando histórico…</p>}
      {!carregando && !erro && !registros.length && (
        <p>Nenhuma movimentação registrada.</p>
      )}
      <ul className="max-h-[60dvh] space-y-3 overflow-y-auto">
        {registros.map((registro) => (
          <li
            key={registro.chave}
            className={`rounded-default border p-4 ${tipoClasse[registro.tipo]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-bold">
                {tipoLabel[registro.tipo]} · {registro.item_nome}
              </p>
              <time dateTime={registro.data}>
                {new Date(registro.data).toLocaleString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                })}
              </time>
            </div>
            <p className="mt-1 text-body-sm">
              {registro.motivo}
              {registro.quantidade !== null &&
                ` · Quantidade: ${registro.quantidade}`}
            </p>
            {registro.ator_nome && (
              <p className="mt-1 text-label-sm">
                Responsável: {registro.ator_nome}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={onFechar}>
        Fechar
      </Button>
    </div>
  )
}
