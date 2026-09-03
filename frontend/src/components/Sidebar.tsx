// Sidebar.tsx
// Versão alinhada ao visual do mockup: fundo bege, ícone por item,
// bloco de perfil do usuário e Configurações/Sair fixos embaixo.

import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface ItemMenu {
  rota: string | null; // null = ainda não tem página, item fica desabilitado
  label: string;
  icone: LucideIcon;
}

interface SidebarProps {
  itens: ItemMenu[];
  // Itens fixos do rodapé (Configurações, Sair) seguem a mesma regra de "rota: null"
  itensRodape: ItemMenu[];
}

function ItemNav({ item }: { item: ItemMenu }) {
  const Icone = item.icone;

  if (!item.rota) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-400">
        <Icone size={18} />
        {item.label}
        <span className="ml-auto text-[10px] uppercase text-stone-300">
          em breve
        </span>
      </span>
    );
  }

  return (
    <NavLink
      to={item.rota}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-950 text-white'
            : 'text-stone-700 hover:bg-stone-200'
        }`
      }
    >
      <Icone size={18} />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar({ itens, itensRodape }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-[#e9e4d8] px-3 py-6">
      <div>
        <div className="px-3 pb-6">
          <h1 className="text-lg font-semibold text-stone-900">Seda e Couro</h1>
          <p className="text-[11px] uppercase tracking-wide text-stone-500">
            Sapataria Profissional
          </p>
        </div>

        <nav className="space-y-1">
          {itens.map(item => (
            <ItemNav key={item.label} item={item} />
          ))}
        </nav>
      </div>

      <div>
        {/* Placeholder até existir autenticação de verdade (módulo do Integrante 1) */}
        <div className="mb-3 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-950 text-xs font-semibold text-white">
            RS
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900">Ricardo Silva</p>
            <p className="text-xs text-stone-500">Gerente</p>
          </div>
        </div>

        <nav className="space-y-1 border-t border-stone-300 pt-3">
          {itensRodape.map(item => (
            <ItemNav key={item.label} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
