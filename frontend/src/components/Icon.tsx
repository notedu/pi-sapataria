const caminhos = {
  editar: 'm15 4 5 5 M4 16 16 4a2 2 0 0 1 4 4L8 20H4z',
  endereco: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  calendario: 'M5 5h14v16H5z M8 3v4 M16 3v4 M5 10h14',
  observacoes: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  busca: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  clientes: 'M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M3 21v-4a6 6 0 0 1 12 0v4 M17 4a3 3 0 0 1 0 6 M18 13a5 5 0 0 1 3 4v4',
  servicos: 'm14 6 4 4 4-4a7 7 0 0 1-9 9l-7 7-4-4 7-7a7 7 0 0 1 9-9z',
  financeiro: 'M2 5h20v14H2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M5 12h1 M18 12h1',
  funcionarios: 'M9 3h6v5H9z M9 5H3v16h18V5h-6 M8 12h2 M7 17h4 M15 12h3 M15 16h3',
  estoque: 'M3 3h18v5H3z M5 8v13h14V8 M10 12h4',
  configuracoes: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  sair: 'M9 3H3v18h6 M9 12h12 M17 8l4 4-4 4',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  fechar: 'm6 6 12 12 M6 18 18 6',
} as const

export type IconName = keyof typeof caminhos

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={`shrink-0 ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={caminhos[name]} /></svg>
}
