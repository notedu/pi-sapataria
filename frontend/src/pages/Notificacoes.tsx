import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { ErroApi } from '../services/api'
import {
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from '../services/atividades'
import type { Notificacao } from '../services/atividades'

function dataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

export default function Notificacoes() {
  const navigate = useNavigate()
  const [lista, setLista] = useState<Notificacao[] | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    let ativo = true
    listarNotificacoes()
      .then((dados) => {
        if (ativo) {
          setLista(dados)
          setErro('')
        }
      })
      .catch((error: unknown) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as notificações.',
          )
      })
    return () => {
      ativo = false
    }
  }, [navigate, tentativa])

  async function marcarTodas() {
    if (!lista || ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await marcarTodasNotificacoesLidas()
      setLista(
        lista.map((item) => ({
          ...item,
          lida_em: item.lida_em ?? new Date().toISOString(),
        })),
      )
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar as notificações.',
      )
    } finally {
      setOcupado(false)
    }
  }

  async function abrir(notificacao: Notificacao) {
    if (!notificacao.lida_em) {
      setOcupado(true)
      setErro('')
      try {
        await marcarNotificacaoLida(notificacao.id)
        setLista(
          lista?.map((item) =>
            item.id === notificacao.id
              ? { ...item, lida_em: new Date().toISOString() }
              : item,
          ) ?? null,
        )
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a notificação.',
        )
        setOcupado(false)
        return
      }
      setOcupado(false)
    }
    if (
      notificacao.entidade_tipo === 'ordem_servico' &&
      notificacao.entidade_id
    )
      navigate(`/ordens-servico/${notificacao.entidade_id}`)
  }

  const naoLidas = lista?.filter((item) => !item.lida_em).length ?? 0
  return (
    <div className="mx-auto max-w-container-max space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg">
            Notificações
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Avisos sobre ações que precisam da sua atenção.
          </p>
        </div>
        {naoLidas > 0 && (
          <Button
            variant="secondary"
            className="mobile-action"
            onClick={() => void marcarTodas()}
            disabled={ocupado}
          >
            Marcar todas como lidas
          </Button>
        )}
      </header>
      {erro && (
        <div className="space-y-3 rounded-xl bg-error-container p-5 text-on-error-container">
          <p role="alert">{erro}</p>
          {!lista && (
            <Button onClick={() => setTentativa((valor) => valor + 1)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}
      {!lista ? (
        <p role="status">Carregando notificações…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
          Você não tem notificações.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-5 ${item.lida_em ? 'border-outline-variant bg-surface-container-lowest' : 'border-primary/40 bg-primary-fixed/30'}`}
            >
              <button
                type="button"
                onClick={() => void abrir(item)}
                disabled={ocupado}
                className="w-full text-left focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{item.mensagem}</strong>
                  <time
                    className="text-label-sm text-on-surface-variant"
                    dateTime={item.criada_em}
                  >
                    {dataHora(item.criada_em)}
                  </time>
                </span>
                <span className="mt-2 block text-label-sm text-on-surface-variant">
                  {item.ator_nome}
                  {item.lida_em ? ' · Lida' : ' · Não lida'}
                  {item.entidade_tipo === 'ordem_servico' && item.entidade_id
                    ? ` · Abrir OS #${item.entidade_id}`
                    : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
