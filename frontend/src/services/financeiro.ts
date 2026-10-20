import { objeto, requisitar } from './api'

export type MovimentoFinanceiro = {
  id: number; pago_em: string; valor: string; forma_pagamento: string; tipo: 'entrada' | 'saida'
  categoria: string; descricao: string; origem_tipo: string | null; origem_id: number | null
  estorno_de_id: number | null; motivo_estorno: string | null
}

export type ContaFinanceira = {
  id: number; tipo: 'entrada' | 'saida'; categoria: string; descricao: string; valor_total: string
  origem_tipo: string | null; origem_id: number | null; parcela_id: number; numero: number
  total_parcelas: number; valor: string; vencimento: string; valor_pago: string
  status: 'pendente' | 'pago' | 'vencido' | 'parcial'; parcelado: boolean
}

export type DadosFinanceiros = {
  periodo: { inicio: string | null; fim: string | null; regime: 'caixa' }
  resumo: { faturamento_bruto: string; saidas_caixa: string; compras: string; estornos: string; custo_mercadorias_e_materiais: string; despesas: string; lucro_bruto: string; lucro_operacional: string; lucro_liquido: string | null; impostos: string | null }
  movimentacoes: MovimentoFinanceiro[]; contas: ContaFinanceira[]
}

function decimal(valor: unknown) { return typeof valor === 'string' && /^-?\d+(\.\d+)?$/.test(valor) }
function movimento(valor: unknown): valor is MovimentoFinanceiro {
  return objeto(valor) && Number.isInteger(valor.id) && typeof valor.pago_em === 'string' && decimal(valor.valor)
    && (valor.tipo === 'entrada' || valor.tipo === 'saida') && typeof valor.forma_pagamento === 'string'
    && typeof valor.categoria === 'string' && typeof valor.descricao === 'string'
    && (valor.origem_tipo === null || typeof valor.origem_tipo === 'string')
    && (valor.origem_id === null || Number.isInteger(valor.origem_id))
    && (valor.estorno_de_id === null || Number.isInteger(valor.estorno_de_id))
    && (valor.motivo_estorno === null || typeof valor.motivo_estorno === 'string')
}
function conta(valor: unknown): valor is ContaFinanceira {
  return objeto(valor) && Number.isInteger(valor.id) && (valor.tipo === 'entrada' || valor.tipo === 'saida')
    && typeof valor.categoria === 'string' && typeof valor.descricao === 'string' && decimal(valor.valor_total)
    && Number.isInteger(valor.parcela_id) && Number.isInteger(valor.numero) && Number.isInteger(valor.total_parcelas)
    && decimal(valor.valor) && typeof valor.vencimento === 'string' && decimal(valor.valor_pago)
    && ['pendente', 'pago', 'vencido', 'parcial'].includes(String(valor.status)) && typeof valor.parcelado === 'boolean'
}

export async function consultarFinanceiro(inicio?: string, fim?: string): Promise<DadosFinanceiros> {
  const parametros = new URLSearchParams()
  if (inicio) parametros.set('inicio', inicio)
  if (fim) parametros.set('fim', fim)
  const resposta = await requisitar(`/financeiro${parametros.size ? `?${parametros}` : ''}`)
  if (!objeto(resposta) || !objeto(resposta.dados) || !objeto(resposta.dados.periodo) || resposta.dados.periodo.regime !== 'caixa'
    || !objeto(resposta.dados.resumo) || !Array.isArray(resposta.dados.movimentacoes) || !resposta.dados.movimentacoes.every(movimento)
    || !Array.isArray(resposta.dados.contas) || !resposta.dados.contas.every(conta)) throw new Error('Não foi possível interpretar os dados financeiros.')
  return resposta.dados as DadosFinanceiros
}
