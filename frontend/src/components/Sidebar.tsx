import { NavLink } from 'react-router-dom'
import type { Usuario } from '../services/auth'
import { areas } from '../config/navegacao'
import Icon from './Icon'
import logo from '../assets/logo-sapataria.png'

export default function Sidebar({ usuario, onSair, saindo }: { usuario: Usuario; onSair: () => void; saindo: boolean }) {
  const iniciais = usuario.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()
  return (
    <aside className="flex h-full flex-col bg-secondary-container p-4">
      <div className="mb-10 flex items-center gap-2 pt-2">
        <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover mix-blend-multiply" />
        <div className="min-w-0">
          <p className="whitespace-nowrap text-body-lg font-bold text-primary">Seda e Couro</p>
          <p className="text-label-sm text-on-secondary-fixed-variant">Sapataria Profissional</p>
        </div>
      </div>
      <nav aria-label="Navegação principal" className="flex-1">
        <ul className="space-y-2">
          {areas.filter(area => !area.administrador || usuario.perfil === 'administrador').map(area => (
            <li key={area.titulo}>
              {area.caminho ? (
                <NavLink to={area.caminho} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-label-md focus-visible:outline-2 focus-visible:outline-primary ${isActive ? 'bg-primary text-on-primary' : 'text-on-secondary-fixed hover:bg-primary/5'}`}>
                  <Icon name={area.icone} />{area.titulo}
                </NavLink>
              ) : <div aria-disabled="true" className="flex items-center gap-3 px-4 py-3 text-on-secondary-fixed-variant"><Icon name={area.icone} /><span className="text-label-md">{area.titulo}<span className="block text-label-sm">Em construção</span></span></div>}
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-10">
        <NavLink to="/meu-perfil" aria-label={`Meu perfil: ${usuario.nome}`} title="Meu perfil" className={({ isActive }) => `mb-6 flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary ${isActive ? 'bg-primary/5' : ''}`}>
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-label-md text-on-primary">{iniciais}</span>
          <div className="min-w-0"><p className="break-words text-label-md text-primary">{usuario.nome}</p><p className="text-label-sm text-on-secondary-fixed-variant">{usuario.perfil === 'administrador' ? 'Administrador' : 'Funcionário'}</p></div>
        </NavLink>
        <div aria-disabled="true" className="flex items-center gap-3 px-4 py-3 text-on-secondary-fixed-variant"><Icon name="configuracoes" /><span className="text-label-md">Configurações<span className="block text-label-sm">Em construção</span></span></div>
        <button type="button" onClick={onSair} disabled={saindo} className="text-error flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-label-md hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"><Icon name="sair" />{saindo ? 'Saindo…' : 'Sair'}</button>
      </div>
    </aside>
  )
}
