import Button from '../Button'
import Dialog from '../Dialog'
import { formatarData, formatarDinheiro, resumirMovimentos } from '../../data/financeiroDemonstracao'
import type { MovimentoDemonstracao } from '../../data/financeiroDemonstracao'

export type CategoriaFinanceira = 'recebimentos' | 'pagamentos' | 'caixa' | 'faturamento' | 'materiais' | 'lucro' | 'impostos'

const categorias = {
  recebimentos: { titulo: 'Recebimentos', descricao: 'Entradas fictícias de OS e vendas no período selecionado.' },
  pagamentos: { titulo: 'Pagamentos', descricao: 'Saídas fictícias com compras e despesas no período selecionado.' },
  caixa: { titulo: 'Resultado de caixa', descricao: 'Diferença entre as entradas e saídas demonstrativas do período. Não representa lucro ou saldo disponível.' },
  faturamento: { titulo: 'Faturamento', descricao: 'Apuração indisponível. O critério de reconhecimento e as datas ainda precisam ser definidos (RN-014).' },
  materiais: { titulo: 'Materiais', descricao: 'Apuração indisponível. O método de custeio e o período de reconhecimento ainda precisam ser definidos (RN-015).' },
  lucro: { titulo: 'Lucro e prejuízo', descricao: 'Apuração indisponível. As receitas e os custos incluídos no cálculo ainda precisam ser definidos (RN-017).' },
  impostos: { titulo: 'Impostos', descricao: 'Apuração indisponível. Não há regra ou parâmetro de imposto definido, nem registros de impostos integrados à tela (RN-016).' },
}

export default function DetalhesCategoriaFinanceira({ categoria, movimentos, periodo, onFechar }: {
  categoria: CategoriaFinanceira
  movimentos: MovimentoDemonstracao[]
  periodo: { inicio: string; fim: string }
  onFechar: () => void
}) {
  const { titulo, descricao } = categorias[categoria]
  const temValores = ['recebimentos', 'pagamentos', 'caixa'].includes(categoria)
  const registros = movimentos.filter(item => categoria === 'caixa' || (categoria === 'recebimentos' ? item.tipo === 'entrada' : item.tipo === 'saida'))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
  const resumo = resumirMovimentos(registros)
  const total = categoria === 'recebimentos' ? resumo.entradas : categoria === 'pagamentos' ? resumo.saidas : resumo.resultado

  return <Dialog titulo={`Detalhes de ${titulo}`} onCancelar={onFechar}>
    <p className="text-label-sm text-on-surface-variant">{formatarData(periodo.inicio)} a {formatarData(periodo.fim)}</p>
    <p className="mt-4 text-body-md">{descricao}</p>
    {temValores && <>
      <p className="mt-5 text-headline-md tabular-nums">{formatarDinheiro(total)}</p>
      <p className="mt-1 text-label-sm text-on-surface-variant">Total demonstrativo · {registros.length} registros fictícios</p>
      {categoria === 'caixa' && <dl className="mt-4 grid grid-cols-2 gap-3 text-body-md"><div><dt>Entradas</dt><dd className="font-semibold tabular-nums">{formatarDinheiro(resumo.entradas)}</dd></div><div><dt>Saídas</dt><dd className="font-semibold tabular-nums">{formatarDinheiro(resumo.saidas)}</dd></div></dl>}
      {registros.length === 0 ? <p className="mt-5">Nenhum registro demonstrativo nesta categoria para o período selecionado.</p> : <ul className="mt-5 divide-y divide-outline-variant">
        {registros.map(item => <li key={item.id} className="py-4"><p className="font-semibold">{item.descricao}</p><p className="mt-1 text-label-sm text-on-surface-variant">{item.referencia} · {formatarData(item.data)}</p><p className="mt-2 text-body-md tabular-nums">{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}: {formatarDinheiro(item.valorCentavos)}</p></li>)}
      </ul>}
    </>}
    {!temValores && <p className="mt-5 rounded-default bg-secondary-container p-4 text-body-md">Nenhum valor é apresentado enquanto esta apuração não estiver disponível.</p>}
    <Button className="mt-6" onClick={onFechar}>Fechar</Button>
  </Dialog>
}
