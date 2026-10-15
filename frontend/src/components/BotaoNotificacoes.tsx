import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function BotaoNotificacoes({ naoLidas }: { naoLidas: number }) {
  const rotulo = naoLidas > 0
    ? `Notificações, ${naoLidas} não lidas`
    : 'Notificações'

  return (
    <Link
      to="/notificacoes"
      aria-label={rotulo}
      title={rotulo}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Icon name="notificacoes" />
      {naoLidas > 0 && (
        <span aria-hidden="true" className="absolute right-0 top-0 min-w-5 rounded-full bg-error-container px-1 text-center text-label-sm leading-5 text-on-error-container">
          {naoLidas > 99 ? '99+' : naoLidas}
        </span>
      )}
    </Link>
  )
}
