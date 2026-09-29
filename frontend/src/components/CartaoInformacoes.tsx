import type { ReactNode } from 'react'
import Icon from './Icon'
import type { IconName } from './Icon'

export default function CartaoInformacoes({ titulo, icone, children, destaque = false }: {
  titulo: string; icone: IconName; children: ReactNode; destaque?: boolean
}) {
  return <section aria-label={titulo} className={`min-w-0 rounded-default border border-outline-variant p-5 md:p-6 ${destaque ? 'bg-secondary-container' : 'bg-surface'}`}>
    <h2 className="mb-6 flex items-center gap-3 text-body-lg font-semibold text-primary"><Icon name={icone} />{titulo}</h2>
    {children}
  </section>
}
