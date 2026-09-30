import { useId, useRef, useState } from 'react'
import type { ReactNode, SubmitEvent } from 'react'
import { ResultadoIncerto } from '../services/api'
import Button from './Button'
import Dialog from './Dialog'
import InputField from './InputField'

type Props = {
  titulo: string
  descricao: ReactNode
  acao: string
  onConfirmar: (senha: string) => Promise<void>
  onCancelar: () => void
  onRevisar: () => void
  variante?: 'primary' | 'danger'
  textoRevisar?: string
}

export default function ConfirmarSenhaDialog({ titulo, descricao, acao, onConfirmar, onCancelar, onRevisar, variante = 'danger', textoRevisar = 'Fechar e atualizar lista' }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [incerto, setIncerto] = useState(false)
  const emCurso = useRef(false)
  const id = useId()

  async function confirmar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (emCurso.current || incerto) return
    const form = event.currentTarget
    const senha = String(new FormData(form).get('senha_admin') ?? '')
    if (!senha || [...senha].length > 128) { setErro('Informe sua senha, com até 128 caracteres.'); return }
    emCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      await onConfirmar(senha)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível confirmar a operação.')
      setIncerto(error instanceof ResultadoIncerto)
    } finally {
      form.reset() // A senha não permanece preenchida após nenhuma tentativa.
      emCurso.current = false
      setEnviando(false)
    }
  }

  return (
    <Dialog titulo={titulo} onCancelar={incerto ? onRevisar : onCancelar} ocupado={enviando}>
      <div className="mb-6 break-words text-on-surface-variant">{descricao}</div>
      <form onSubmit={confirmar} aria-describedby={erro ? `${id}-erro` : undefined}>
        <InputField id={id} name="senha_admin" label="Sua senha de Administrador" type="password" autoComplete="current-password" required autoFocus disabled={enviando || incerto} />
        {erro && <p id={`${id}-erro`} role="alert" className="mt-4 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={enviando} onClick={incerto ? onRevisar : onCancelar}>{incerto ? textoRevisar : 'Cancelar'}</Button>
          <Button variant={variante} type="submit" disabled={enviando || incerto}>{enviando ? 'Confirmando…' : acao}</Button>
        </div>
      </form>
    </Dialog>
  )
}
