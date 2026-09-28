import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type DialogProps = { titulo: string; children: ReactNode; onCancelar: () => void; ocupado?: boolean }

// O dialog nativo mantém o foco no modal e torna o restante da página inativo.
export default function Dialog({ titulo, children, onCancelar, ocupado = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const tituloId = useId()
  useEffect(() => {
    const dialog = ref.current
    const focoAnterior = document.activeElement
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus()
    }
  }, [])

  return (
    <dialog ref={ref} aria-labelledby={tituloId} aria-busy={ocupado}
      onCancel={event => { event.preventDefault(); if (!ocupado) onCancelar() }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-outline-variant bg-surface p-6 text-on-surface shadow-xl backdrop:bg-black/40 md:p-8">
      <h2 id={tituloId} className="mb-4 text-headline-md">{titulo}</h2>
      {children}
    </dialog>
  )
}
