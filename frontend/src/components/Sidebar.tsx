import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/auth';

const logoUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7Wy3sV0UQh665T1_ljr905SsCYQO4fs5iWzRlZZS72FOzWSx5Wi83v1e-FKRhfldAG1GX7D8tWeyg1VQ5IP2GehRAtO8hGpQMnztujkvUIrPVji4G3EZwZa3WSBgo_8pzT88nScsw2jiShewcdDobH7RgyQmcm3J0MHjN4x1ksmO1f1rJHHrWYRGxhdyoA_Q0eUHKwSq0zxFTbDBcGpqtRD5HBVQ7OVZSu6asaM0O5gXIDjJYlbNpGcpwpu1Jwll7s-M';

export interface ItemMenu {
  rota: string | null;
  label: string;
  icone: LucideIcon;
}

interface SidebarProps {
  itens: ItemMenu[];
  itensRodape: ItemMenu[];
  aberto: boolean;
  aoFechar: () => void;
}

function ItemNav({ item, aoNavegar }: { item: ItemMenu; aoNavegar: () => void }) {
  const Icone = item.icone;
  const { sair } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState('');
  if (item.label === 'Sair') return <div>
    <button disabled={saindo} type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#444652] hover:bg-[#d7dae4]/70" onClick={async () => {
      setSaindo(true); setErro('');
      try { await sair(); aoNavegar(); }
      catch { setErro('Não foi possível sair. Tente novamente.'); }
      finally { setSaindo(false); }
    }}><Icone aria-hidden="true" className="size-5" />{saindo ? 'Saindo...' : 'Sair'}</button>
    {erro && <p role="alert" className="px-3 text-xs text-red-700">{erro}</p>}
  </div>;

  if (!item.rota) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#747683] opacity-60">
        <Icone aria-hidden="true" className="size-5" />
        {item.label}
      </span>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-[#002c7c] text-white'
            : 'text-[#444652] hover:bg-[#d7dae4]/70'
        }`
      }
      onClick={aoNavegar}
      to={item.rota}
    >
      <Icone aria-hidden="true" className="size-5" />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar({ itens, itensRodape, aberto, aoFechar }: SidebarProps) {
  const { usuario } = useAuth();
  return (
    <>
      {aberto && (
        <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-[#181c23]/35 md:hidden" onClick={aoFechar} type="button" />
      )}
      <aside aria-label="Menu principal" className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-[#c4c6d4]/40 bg-[#e6e2db] px-2 py-4 transition-transform duration-200 md:translate-x-0 ${aberto ? 'translate-x-0 shadow-xl' : ''}`}>
        <div className="mb-8 flex items-center gap-3 px-2">
          <img alt="Logotipo Seda e Couro" className="size-9 rounded-full object-cover" src={logoUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-[#002c7c]">Seda e Couro</h1>
            <p className="text-xs font-medium text-[#444652]">Sapataria Profissional</p>
          </div>
          <button aria-label="Fechar menu" className="rounded-md p-1.5 text-[#444652] hover:bg-[#d7dae4] md:hidden" onClick={aoFechar} type="button"><X aria-hidden="true" className="size-5" /></button>
        </div>
        <nav aria-label="Páginas do sistema" className="space-y-1">
          {itens.map(item => <ItemNav aoNavegar={aoFechar} item={item} key={item.label} />)}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-3 border-b border-[#c4c6d4]/45 px-2 pb-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#1d439c] text-xs font-bold text-white">{usuario?.nome.slice(0, 2).toUpperCase()}</div>
            <div><p className="text-sm font-semibold text-[#181c23]">{usuario?.nome}</p><p className="text-xs text-[#444652]">{usuario?.perfil === 'admin' ? 'Administrador' : 'Funcionário'}</p></div>
          </div>
          <nav aria-label="Opções da conta" className="space-y-1">
            {itensRodape.map(item => <ItemNav aoNavegar={aoFechar} item={item} key={item.label} />)}
          </nav>
        </div>
      </aside>
    </>
  );
}
