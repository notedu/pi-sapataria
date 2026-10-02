// Dados locais de demonstração. Não representam contratos da API ou lançamentos reais.
export type MovimentoDemonstracao = {
  id: string
  data: string
  descricao: string
  origem: 'OS' | 'Venda' | 'Despesa'
  referencia: string
  tipo: 'entrada' | 'saida'
  valorCentavos: number
}

export const dataReferencia = '2026-09-30'
export const movimentosDemonstracao: MovimentoDemonstracao[] = [
  { id: 'demo-01', data: '2026-09-02', descricao: 'Reparo de botas', origem: 'OS', referencia: 'OS demonstrativa 101', tipo: 'entrada', valorCentavos: 18000 },
  { id: 'demo-02', data: '2026-09-04', descricao: 'Compra de materiais', origem: 'Despesa', referencia: 'Compra demonstrativa 201', tipo: 'saida', valorCentavos: 25000 },
  { id: 'demo-03', data: '2026-09-07', descricao: 'Venda de palmilhas', origem: 'Venda', referencia: 'Venda demonstrativa 301', tipo: 'entrada', valorCentavos: 9000 },
  { id: 'demo-04', data: '2026-09-10', descricao: 'Restauração de calçados', origem: 'OS', referencia: 'OS demonstrativa 102', tipo: 'entrada', valorCentavos: 32000 },
  { id: 'demo-05', data: '2026-09-14', descricao: 'Energia da oficina', origem: 'Despesa', referencia: 'Despesa demonstrativa 202', tipo: 'saida', valorCentavos: 16000 },
  { id: 'demo-06', data: '2026-09-17', descricao: 'Venda de produtos para venda', origem: 'Venda', referencia: 'Venda demonstrativa 302', tipo: 'entrada', valorCentavos: 14000 },
  { id: 'demo-07', data: '2026-09-21', descricao: 'Troca de solas', origem: 'OS', referencia: 'OS demonstrativa 103', tipo: 'entrada', valorCentavos: 26000 },
  { id: 'demo-08', data: '2026-09-24', descricao: 'Compra de produtos para venda', origem: 'Despesa', referencia: 'Compra demonstrativa 203', tipo: 'saida', valorCentavos: 30000 },
  { id: 'demo-09', data: '2026-09-28', descricao: 'Reparo de bolsas', origem: 'OS', referencia: 'OS demonstrativa 104', tipo: 'entrada', valorCentavos: 24000 },
  { id: 'demo-10', data: '2026-09-29', descricao: 'Venda de cadarços e palmilhas', origem: 'Venda', referencia: 'Venda demonstrativa 303', tipo: 'entrada', valorCentavos: 12000 },
  { id: 'demo-11', data: '2026-09-30', descricao: 'Manutenção de equipamento', origem: 'Despesa', referencia: 'Despesa demonstrativa 204', tipo: 'saida', valorCentavos: 11000 },
  { id: 'demo-12', data: '2026-09-30', descricao: 'Conserto de salto', origem: 'OS', referencia: 'OS demonstrativa 105', tipo: 'entrada', valorCentavos: 8000 },
]

export const formatarDinheiro = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
export const formatarData = (data: string) => data.split('-').reverse().join('/')

export function resumirMovimentos(movimentos: MovimentoDemonstracao[]) {
  const entradas = movimentos.filter(item => item.tipo === 'entrada').reduce((total, item) => total + item.valorCentavos, 0)
  const saidas = movimentos.filter(item => item.tipo === 'saida').reduce((total, item) => total + item.valorCentavos, 0)
  return { entradas, saidas, resultado: entradas - saidas }
}

export function periodoDemonstracao(opcao: string) {
  // UTC é usado apenas para aritmética de datas civis, sem conversões de fuso.
  const referencia = new Date(`${dataReferencia}T00:00:00Z`)
  if (opcao === 'semana') referencia.setUTCDate(referencia.getUTCDate() - ((referencia.getUTCDay() + 6) % 7))
  if (opcao === 'mes') referencia.setUTCDate(1)
  return { inicio: referencia.toISOString().slice(0, 10), fim: dataReferencia }
}

export function agruparEvolucao(movimentos: MovimentoDemonstracao[], inicio: string, fim: string) {
  const primeiroDia = Date.parse(`${inicio}T00:00:00Z`)
  const totalDias = (Date.parse(`${fim}T00:00:00Z`) - primeiroDia) / 86400000 + 1
  // Até sete grupos mantêm o gráfico legível inclusive em telas pequenas.
  const tamanho = Math.ceil(totalDias / 7)
  return Array.from({ length: Math.ceil(totalDias / tamanho) }, (_, indice) => {
    const de = new Date(primeiroDia + indice * tamanho * 86400000).toISOString().slice(0, 10)
    const ate = new Date(primeiroDia + (Math.min((indice + 1) * tamanho, totalDias) - 1) * 86400000).toISOString().slice(0, 10)
    return { de, ate, ...resumirMovimentos(movimentos.filter(item => item.data >= de && item.data <= ate)) }
  })
}
