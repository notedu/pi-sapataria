import { useOutletContext } from 'react-router-dom'
import type { Usuario } from '../services/auth'
import Icon from '../components/Icon'

export default function EmConstrucao({ titulo, inicial = false }: { titulo: string; inicial?: boolean }) {
  const usuario = useOutletContext<Usuario>()
  return (
    <div className="mx-auto max-w-container-max">
      <header className="mb-10">
        <h1 className="break-words text-headline-lg-mobile md:text-headline-lg">{inicial ? `Olá, ${usuario.nome}!` : titulo}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{inicial ? 'Bem-vindo ao sistema Seda e Couro.' : 'Seda e Couro Gestão Interna'}</p>
      </header>
      <section aria-labelledby="titulo-construcao" className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-primary/20 bg-surface-container-low px-6 py-12 text-center">
        <span className="mb-6 rounded-full bg-primary-fixed p-5 text-primary"><Icon name="servicos" className="h-8 w-8" /></span>
        <p className="mb-2 text-label-md text-primary">{titulo}</p>
        <h2 id="titulo-construcao" className="text-headline-md">Em construção</h2>
        <p className="mt-3 max-w-md text-body-md text-on-surface-variant">Esta área está em desenvolvimento. As funcionalidades estarão disponíveis em uma próxima etapa.</p>
      </section>
    </div>
  )
}
