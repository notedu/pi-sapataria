import { useEffect, useEffectEvent, useState } from 'react'

type AlertaProps = {
  mensagem: string
  onFechar?: () => void
  className?: string
}

export default function Alerta(props: AlertaProps) {
  // Uma mensagem nova ganha seu próprio prazo e reinicia a animação.
  return <AlertaTemporario key={props.mensagem} {...props} />
}

function AlertaTemporario({ mensagem, onFechar, className = '' }: AlertaProps) {
  const [visivel, setVisivel] = useState(true)
  const fechar = useEffectEvent(() => {
    setVisivel(false)
    onFechar?.()
  })

  useEffect(() => {
    const temporizador = window.setTimeout(fechar, 5000)
    return () => window.clearTimeout(temporizador)
  }, [])

  if (!visivel) return null
  return <div role="status" aria-atomic="true" className={`overflow-hidden rounded-default border border-success/25 bg-success-container text-on-success-container ${className}`}>
    <p className="px-4 py-4">{mensagem}</p>
    <div aria-hidden="true" className="h-1 bg-success/15">
      <div className="alerta-progresso h-full bg-success" />
    </div>
  </div>
}
