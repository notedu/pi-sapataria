import type { IconName } from '../components/Icon'

type Area = { titulo: string; caminho?: string; icone: IconName; administrador?: boolean }

// Menu e rotas usam a mesma lista. Áreas sem caminho ainda não têm acesso definido.
export const areas: Area[] = [
  { titulo: 'Dashboard', caminho: '/dashboard', icone: 'dashboard' },
  { titulo: 'Busca', caminho: '/busca', icone: 'busca' },
  { titulo: 'Clientes', caminho: '/clientes', icone: 'clientes' },
  { titulo: 'Ordens de Serviço', caminho: '/ordens-servico', icone: 'servicos' },
  { titulo: 'Financeiro', caminho: '/financeiro', icone: 'financeiro', administrador: true },
  { titulo: 'Funcionários', caminho: '/funcionarios', icone: 'funcionarios', administrador: true },
  { titulo: 'Estoque', caminho: '/estoque', icone: 'estoque' },
]
