// Layout.tsx
// Estrutura visível em toda página logada: sidebar fixa + o conteúdo da rota atual.

import { Outlet } from 'react-router-dom';
import {
  LayoutGrid,
  Search,
  Users,
  Wrench,
  Wallet,
  Briefcase,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';
import Sidebar, { type ItemMenu } from './Sidebar';

// Mesma ordem do mockup. rota: null = ainda não existe (de outro integrante,
// ou sua mas não construída ainda). Cada um troca o "null" da própria linha
// pela rota real conforme for terminando a página.
const ITENS_MENU: ItemMenu[] = [
  { rota: null, label: 'Dashboard', icone: LayoutGrid }, // Integrante 2
  { rota: null, label: 'Busca', icone: Search }, // Integrante 2
  { rota: null, label: 'Clientes', icone: Users }, // Integrante 1
  { rota: null, label: 'Ordens de Serviço', icone: Wrench }, // Integrante 2
  { rota: null, label: 'Financeiro', icone: Wallet }, // seu, ainda não construído
  { rota: '/funcionarios', label: 'Funcionários', icone: Briefcase }, // seu
  { rota: null, label: 'Estoque', icone: Package }, // seu, ainda não construído
];

const ITENS_RODAPE: ItemMenu[] = [
  { rota: null, label: 'Configurações', icone: Settings }, // seu, ainda não construído
  { rota: null, label: 'Sair', icone: LogOut }, // depende da autenticação (Integrante 1)
];

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar itens={ITENS_MENU} itensRodape={ITENS_RODAPE} />
      <main className="flex-1 overflow-auto bg-stone-50">
        <Outlet />
      </main>
    </div>
  );
}
