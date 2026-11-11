import { enviarComCsrf, objeto, requisitar } from './api'

export type MovimentoFinanceiro = {
  id: number
  pago_em: string
  valor: string
  forma_pagamento: string
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  origem_tipo: string | null
  origem_id: number | null
  estorno_de_id: number | null
  motivo_estorno: string | null
}

export type ContaFinanceira = {
  id: number
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  valor_total: string
  origem_tipo: string | null
  origem_id: number | null
  parcela_id: number
  numero: number
  total_parcelas: number
  valor: string
  vencimento: string
  valor_pago: string
  status: 'pendente' | 'pago' | 'vencido' | 'parcial'
  parcelado: boolean
}

export type DadosFinanceiros = {
  periodo: { inicio: string | null; fim: string | null; regime: 'caixa' }
  resumo: {
    faturamento_bruto: string
    saidas_caixa: string
    compras: string
    estornos: string
    custo_mercadorias_e_materiais: string
    despesas: string
    lucro_bruto: string
    lucro_operacional: string
    lucro_liquido: string | null
    impostos: string | null
  }
  movimentacoes: MovimentoFinanceiro[]
  contas: ContaFinanceira[]
}

export type FechamentoCaixa = {
  data: string
  recebimentos_brutos: string
  saidas: string
  total_liquido: string
  por_forma_pagamento: Record<string, string>
  por_origem: Record<string, string>
  saidas_por_categoria: Record<string, string>
  modo: 'automatico' | 'manual'
  pagamentos_selecionados: PagamentoFechamento[]
  itens_manuais: ItemManualFechamento[]
  fechado: boolean
  fechado_em: string | null
  fechado_por: number | null
  formato_manual: 'resumo' | 'detalhado'
  fonte_manual:'pagamentos'|'valores'
  resumo_manual: Record<string,string> | null
  dinheiro_contado: string | null
  diferenca_dinheiro: string | null
}

export type PagamentoFechamento = {
  id: number
  valor: string
  forma_pagamento: 'pix' | 'credito' | 'debito' | 'dinheiro'
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  origem_tipo: string | null
  origem_id: number | null
  pago_em: string
}

export type ItemManualFechamento = {
  descricao: string
  tipo: 'entrada' | 'saida'
  valor: string
  forma_pagamento: 'pix' | 'credito' | 'debito' | 'dinheiro' | null
  origem: 'ordem_servico' | 'venda' | 'outro'
}

export type DadosFechamentoDia = {
  fechamento: FechamentoCaixa
  pagamentos_disponiveis: PagamentoFechamento[]
}
export type HistoricoFechamentos = { itens: FechamentoCaixa[]; pagina:number; limite:number; total:number; paginas:number }

function decimal(valor: unknown) {
  return typeof valor === 'string' && /^-?\d+(\.\d+)?$/.test(valor)
}
function movimento(valor: unknown): valor is MovimentoFinanceiro {
  return (
    objeto(valor) &&
    Number.isInteger(valor.id) &&
    typeof valor.pago_em === 'string' &&
    decimal(valor.valor) &&
    (valor.tipo === 'entrada' || valor.tipo === 'saida') &&
    typeof valor.forma_pagamento === 'string' &&
    typeof valor.categoria === 'string' &&
    typeof valor.descricao === 'string' &&
    (valor.origem_tipo === null || typeof valor.origem_tipo === 'string') &&
    (valor.origem_id === null || Number.isInteger(valor.origem_id)) &&
    (valor.estorno_de_id === null || Number.isInteger(valor.estorno_de_id)) &&
    (valor.motivo_estorno === null || typeof valor.motivo_estorno === 'string')
  )
}
function conta(valor: unknown): valor is ContaFinanceira {
  return (
    objeto(valor) &&
    Number.isInteger(valor.id) &&
    (valor.tipo === 'entrada' || valor.tipo === 'saida') &&
    typeof valor.categoria === 'string' &&
    typeof valor.descricao === 'string' &&
    decimal(valor.valor_total) &&
    Number.isInteger(valor.parcela_id) &&
    Number.isInteger(valor.numero) &&
    Number.isInteger(valor.total_parcelas) &&
    decimal(valor.valor) &&
    typeof valor.vencimento === 'string' &&
    decimal(valor.valor_pago) &&
    ['pendente', 'pago', 'vencido', 'parcial'].includes(String(valor.status)) &&
    typeof valor.parcelado === 'boolean'
  )
}

export async function consultarFinanceiro(
  inicio?: string,
  fim?: string,
): Promise<DadosFinanceiros> {
  const parametros = new URLSearchParams()
  if (inicio) parametros.set('inicio', inicio)
  if (fim) parametros.set('fim', fim)
  const resposta = await requisitar(
    `/financeiro${parametros.size ? `?${parametros}` : ''}`,
  )
  if (
    !objeto(resposta) ||
    !objeto(resposta.dados) ||
    !objeto(resposta.dados.periodo) ||
    resposta.dados.periodo.regime !== 'caixa' ||
    !objeto(resposta.dados.resumo) ||
    !Array.isArray(resposta.dados.movimentacoes) ||
    !resposta.dados.movimentacoes.every(movimento) ||
    !Array.isArray(resposta.dados.contas) ||
    !resposta.dados.contas.every(conta)
  )
    throw new Error('Não foi possível interpretar os dados financeiros.')
  return resposta.dados as DadosFinanceiros
}

function fechamento(valor: unknown): valor is FechamentoCaixa {
  const mapaDecimal = (item: unknown) =>
    objeto(item) && Object.values(item).every(decimal)
  return (
    objeto(valor) &&
    typeof valor.data === 'string' &&
    decimal(valor.recebimentos_brutos) &&
    decimal(valor.saidas) &&
    decimal(valor.total_liquido) &&
    mapaDecimal(valor.por_forma_pagamento) &&
    mapaDecimal(valor.por_origem) &&
    mapaDecimal(valor.saidas_por_categoria) &&
    (valor.modo === 'automatico' || valor.modo === 'manual') &&
    Array.isArray(valor.pagamentos_selecionados) &&
    valor.pagamentos_selecionados.every(pagamentoFechamento) &&
    Array.isArray(valor.itens_manuais) &&
    valor.itens_manuais.every(itemManualFechamento) &&
    typeof valor.fechado === 'boolean' &&
    (valor.fechado_em === null || typeof valor.fechado_em === 'string') &&
    (valor.fechado_por === null || Number.isInteger(valor.fechado_por))
    && ['resumo','detalhado'].includes(String(valor.formato_manual))
    && ['pagamentos','valores'].includes(String(valor.fonte_manual))
    && (valor.resumo_manual===null || objeto(valor.resumo_manual))
    && (valor.dinheiro_contado===null || decimal(valor.dinheiro_contado))
    && (valor.diferenca_dinheiro===null || decimal(valor.diferenca_dinheiro))
  )
}

function pagamentoFechamento(valor: unknown): valor is PagamentoFechamento {
  return (
    objeto(valor) &&
    Number.isInteger(valor.id) &&
    decimal(valor.valor) &&
    ['pix', 'credito', 'debito', 'dinheiro'].includes(String(valor.forma_pagamento)) &&
    (valor.tipo === 'entrada' || valor.tipo === 'saida') &&
    typeof valor.categoria === 'string' &&
    typeof valor.descricao === 'string' &&
    (valor.origem_tipo === null || typeof valor.origem_tipo === 'string') &&
    (valor.origem_id === null || Number.isInteger(valor.origem_id)) &&
    typeof valor.pago_em === 'string'
  )
}

function itemManualFechamento(valor: unknown): valor is ItemManualFechamento {
  return (
    objeto(valor) &&
    typeof valor.descricao === 'string' &&
    (valor.tipo === 'entrada' || valor.tipo === 'saida') &&
    decimal(valor.valor) &&
    (valor.forma_pagamento === null ||
      ['pix', 'credito', 'debito', 'dinheiro'].includes(String(valor.forma_pagamento))) &&
    ['ordem_servico', 'venda', 'outro'].includes(String(valor.origem))
  )
}

export async function consultarFechamento(data: string): Promise<DadosFechamentoDia> {
  const resposta = await requisitar(`/financeiro/fechamentos/${data}`)
  if (
    !objeto(resposta) ||
    !objeto(resposta.dados) ||
    !fechamento(resposta.dados.fechamento) ||
    !Array.isArray(resposta.dados.pagamentos_disponiveis) ||
    !resposta.dados.pagamentos_disponiveis.every(pagamentoFechamento)
  )
    throw new Error('Não foi possível interpretar o fechamento de caixa.')
  return resposta.dados as DadosFechamentoDia
}

export async function listarFechamentos(inicio?:string,fim?:string,pagina=1) {
  const parametros=new URLSearchParams({pagina:String(pagina),limite:'20'}); if(inicio)parametros.set('inicio',inicio); if(fim)parametros.set('fim',fim)
  const resposta = await requisitar(`/financeiro/fechamentos?${parametros}`)
  if (
    !objeto(resposta) ||
    !objeto(resposta.dados) || !Array.isArray(resposta.dados.itens) || !resposta.dados.itens.every(fechamento)
  )
    throw new Error('Não foi possível interpretar o histórico do caixa.')
  return resposta.dados as unknown as HistoricoFechamentos
}

export async function fecharCaixa(
  data: string,
  modo: 'automatico' | 'manual',
  pagamentosIds: number[] = [],
  itensManuais: ItemManualFechamento[] = [],
  formatoManual:'resumo'|'detalhado'='detalhado',
  resumoManual:Record<string,string>|null=null,
  dinheiroContado:string|null=null,
  fonteManual:'pagamentos'|'valores'='valores',
) {
  const resposta = await enviarComCsrf('/financeiro/fechamentos', {
      data,
      modo,
      pagamentos_ids: pagamentosIds,
      itens_manuais: itensManuais,
      formato_manual:formatoManual,resumo_manual:resumoManual,dinheiro_contado:dinheiroContado,fonte_manual:fonteManual,
    })
  if (!objeto(resposta) || !fechamento(resposta.dados))
    throw new Error('Não foi possível interpretar o fechamento de caixa.')
  return resposta.dados
}

export async function consultarCategoriasDespesas():Promise<Array<{id:number;nome:string}>> { const r=await requisitar('/financeiro/categorias-despesas'); if(!objeto(r)||!Array.isArray(r.dados)) throw new Error('Não foi possível consultar as categorias.'); return r.dados as Array<{id:number;nome:string}> }
export async function criarCategoriaDespesa(nome:string) { return enviarComCsrf('/financeiro/categorias-despesas',{nome}) }
export async function criarDespesa(dados:{categoria:string;descricao:string;valor:string;vencimento:string;total_parcelas:number}) { return enviarComCsrf('/financeiro/despesas',dados) }
export async function registrarPagamento(dados:{parcela_id:number;valor:string;forma_pagamento:string}) { return enviarComCsrf('/financeiro/pagamentos',dados) }
export async function corrigirFechamento(data:string,dados:Record<string,unknown>):Promise<FechamentoCaixa> { const r=await enviarComCsrf(`/financeiro/fechamentos/${data}`,dados,'PUT'); if(!objeto(r)||!fechamento(r.dados)) throw new Error('Não foi possível interpretar a correção do fechamento.'); return r.dados }
export async function consultarCorrecoesFechamento(data:string):Promise<Array<{id:number;corrigido_em:string;motivo:string;corrigido_por:string|null;fechamento_anterior:Pick<FechamentoCaixa,'recebimentos_brutos'|'saidas'|'total_liquido'>}>> { const r=await requisitar(`/financeiro/fechamentos/${data}/correcoes`); if(!objeto(r)||!Array.isArray(r.dados)) throw new Error('Não foi possível consultar as correções.'); return r.dados as Array<{id:number;corrigido_em:string;motivo:string;corrigido_por:string|null;fechamento_anterior:Pick<FechamentoCaixa,'recebimentos_brutos'|'saidas'|'total_liquido'>}> }
