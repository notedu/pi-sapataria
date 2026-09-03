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

// Todas as rotas já existem (mesmo que como placeholder "Em construção").
// Quem for dono do módulo substitui o conteúdo do arquivo correspondente
// em src/pages/ — não precisa mexer aqui de novo.
const ITENS_MENU: ItemMenu[] = [
  { rota: '/dashboard', label: 'Dashboard', icone: LayoutGrid }, // Integrante 2
  { rota: '/busca', label: 'Busca', icone: Search }, // Integrante 2
  { rota: '/clientes', label: 'Clientes', icone: Users }, // Integrante 1
  { rota: '/ordens-servico', label: 'Ordens de Serviço', icone: Wrench }, // Integrante 2
  { rota: '/financeiro', label: 'Financeiro', icone: Wallet }, // seu
  { rota: '/funcionarios', label: 'Funcionários', icone: Briefcase }, // colega
  { rota: '/estoque', label: 'Estoque', icone: Package }, // seu
];

const ITENS_RODAPE: ItemMenu[] = [
  { rota: '/configuracoes', label: 'Configurações', icone: Settings }, // seu
  { rota: null, label: 'Sair', icone: LogOut }, // depende da autenticação (Integrante 1) — continua desabilitado de propósito
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
