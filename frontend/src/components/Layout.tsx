import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Briefcase, CircleUserRound, LayoutGrid, LogOut, Menu, Package, Search, Settings, Users, Wallet, Wrench } from 'lucide-react';
import Sidebar, { type ItemMenu } from './Sidebar';

const ITENS_MENU: ItemMenu[] = [
  { rota: '/dashboard', label: 'Dashboard', icone: LayoutGrid },
  { rota: '/busca', label: 'Busca', icone: Search },
  { rota: '/clientes', label: 'Clientes', icone: Users },
  { rota: '/ordens-servico', label: 'Ordens de Serviço', icone: Wrench },
  { rota: '/financeiro', label: 'Financeiro', icone: Wallet },
  { rota: '/funcionarios', label: 'Funcionários', icone: Briefcase },
  { rota: '/estoque', label: 'Estoque', icone: Package },
];

const ITENS_RODAPE: ItemMenu[] = [
  { rota: '/configuracoes', label: 'Configurações', icone: Settings },
  { rota: null, label: 'Sair', icone: LogOut },
];

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <Sidebar aberto={menuAberto} aoFechar={() => setMenuAberto(false)} itens={ITENS_MENU} itensRodape={ITENS_RODAPE} />
      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#c4c6d4]/40 bg-[#f9f9ff]/95 px-5 backdrop-blur md:px-16">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menu" className="rounded-md p-2 text-[#444652] hover:bg-[#e5e8f3] md:hidden" onClick={() => setMenuAberto(true)} type="button"><Menu aria-hidden="true" className="size-5" /></button>
            <span className="text-xl font-bold text-[#002c7c] md:text-2xl">Seda e Couro</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="relative hidden sm:block">
              <span className="sr-only">Buscar clientes</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
              <input className="w-56 rounded-full border border-[#747683] bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20 lg:w-64" placeholder="Buscar clientes..." type="search" />
            </label>
            <button aria-label="Notificações" className="rounded-full p-2 text-[#444652] hover:bg-[#e5e8f3]" type="button"><Bell aria-hidden="true" className="size-5" /></button>
            <button aria-label="Conta" className="rounded-full p-2 text-[#444652] hover:bg-[#e5e8f3]" type="button"><CircleUserRound aria-hidden="true" className="size-6" /></button>
            <div aria-hidden="true" className="hidden size-8 items-center justify-center rounded-full bg-[#d7e2ff] text-xs font-bold text-[#002c7c] sm:flex">RS</div>
          </div>
        </header>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
