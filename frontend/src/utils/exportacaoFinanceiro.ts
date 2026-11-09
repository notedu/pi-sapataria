import type {
  ContaFinanceira,
  DadosFinanceiros,
  MovimentoFinanceiro,
} from '../services/financeiro'
import type { Workbook, Worksheet } from 'exceljs'

type Periodo = { inicio: string; fim: string }

const metricas: Array<[string, keyof DadosFinanceiros['resumo']]> = [
  ['Faturamento bruto', 'faturamento_bruto'],
  ['Saídas de caixa', 'saidas_caixa'],
  ['Compras', 'compras'],
  ['Estornos', 'estornos'],
  ['Custo de mercadorias e materiais', 'custo_mercadorias_e_materiais'],
  ['Despesas', 'despesas'],
  ['Lucro bruto', 'lucro_bruto'],
  ['Lucro operacional', 'lucro_operacional'],
]

function valorResumo(dados: DadosFinanceiros, campo: keyof DadosFinanceiros['resumo']) {
  return Number(dados.resumo[campo])
}

function conteudoResumo(dados: DadosFinanceiros) {
  return [
    ['Campo', 'Valor'],
    ['Período inicial', dados.periodo.inicio ?? 'Todo o período'],
    ['Período final', dados.periodo.fim ?? 'Todo o período'],
    ['Regime', 'Caixa'],
    ...metricas.map(([rotulo, campo]) => [rotulo, valorResumo(dados, campo)]),
  ]
}

function conteudoMovimentacoes(movimentacoes: MovimentoFinanceiro[]) {
  return [
    [
      'ID',
      'Data do pagamento',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor (R$)',
      'Forma de pagamento',
      'Origem',
      'ID da origem',
      'Estorno do lançamento',
      'Motivo do estorno',
    ],
    ...movimentacoes.map((item) => [
      item.id,
      item.pago_em,
      item.tipo === 'entrada' ? 'Entrada' : 'Saída',
      item.categoria,
      item.descricao,
      Number(item.valor),
      item.forma_pagamento,
      item.origem_tipo ?? '',
      item.origem_id ?? '',
      item.estorno_de_id ?? '',
      item.motivo_estorno ?? '',
    ]),
  ]
}

function conteudoContas(contas: ContaFinanceira[]) {
  return [
    [
      'ID do lançamento',
      'Tipo',
      'Categoria',
      'Descrição',
      'Origem',
      'ID da origem',
      'Parcela',
      'Total de parcelas',
      'Valor da parcela (R$)',
      'Valor total (R$)',
      'Valor pago (R$)',
      'Vencimento',
      'Situação',
      'Parcelado',
    ],
    ...contas.map((item) => [
      item.id,
      item.tipo === 'entrada' ? 'Entrada' : 'Saída',
      item.categoria,
      item.descricao,
      item.origem_tipo ?? '',
      item.origem_id ?? '',
      item.numero,
      item.total_parcelas,
      Number(item.valor),
      Number(item.valor_total),
      Number(item.valor_pago),
      item.vencimento,
      item.status,
      item.parcelado ? 'Sim' : 'Não',
    ]),
  ]
}

function nomePeriodo(periodo: Periodo) {
  const inicio = periodo.inicio || 'completo'
  const fim = periodo.fim || 'completo'
  return inicio === fim ? inicio : `${inicio}_a_${fim}`
}

function nomeArquivo(periodo: Periodo, sufixo: string, extensao: string) {
  return `financeiro_${nomePeriodo(periodo)}_${sufixo}.${extensao}`
}

const cores = {
  azul: 'FF072D70',
  texto: 'FF243247',
  textoSuave: 'FF5F6B7A',
  azulClaro: 'FFEAF0FA',
  cinzaClaro: 'FFF5F7FA',
  borda: 'FFD5DCE6',
  branco: 'FFFFFFFF',
}

const formatoMoeda = 'R$ #,##0.00;[Red](R$ #,##0.00);R$ 0.00'
const periodoLegivel = (periodo: Periodo) => {
  const data = (valor: string) =>
    valor ? valor.split('-').reverse().join('/') : 'Todo o período'
  if (!periodo.inicio && !periodo.fim) return 'Todo o período'
  if (!periodo.inicio) return `Até ${data(periodo.fim)}`
  if (!periodo.fim) return `A partir de ${data(periodo.inicio)}`
  return `${data(periodo.inicio)} a ${data(periodo.fim)}`
}

function prepararFolha(worksheet: Worksheet, orientation: 'portrait' | 'landscape') {
  worksheet.views = [{ showGridLines: false }]
  worksheet.pageSetup = {
    paperSize: 9,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: orientation === 'portrait' ? 1 : 0,
    horizontalCentered: orientation === 'portrait',
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.55,
      bottom: 0.55,
      header: 0.25,
      footer: 0.25,
    },
  }
  worksheet.headerFooter = {
    oddFooter: '&LFinanceiro&C&P de &N',
  }
  worksheet.getColumn(1).font = { name: 'Arial', size: 10, color: { argb: cores.texto } }
}

function estiloTitulo(worksheet: Worksheet, endereco: string, size: number) {
  const celula = worksheet.getCell(endereco)
  celula.font = { name: 'Arial', size, bold: true, color: { argb: cores.azul } }
  celula.alignment = { vertical: 'middle', horizontal: 'left' }
}

function estiloCabecalho(worksheet: Worksheet, linha: number, colunas: number) {
  const row = worksheet.getRow(linha)
  row.height = 28
  for (let coluna = 1; coluna <= colunas; coluna += 1) {
    const celula = row.getCell(coluna)
    celula.font = { name: 'Arial', size: 10, bold: true, color: { argb: cores.branco } }
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cores.azul } }
    celula.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  }
}

function estiloLinhas(worksheet: Worksheet, inicio: number, fim: number, colunas: number) {
  for (let numero = inicio; numero <= fim; numero += 1) {
    const row = worksheet.getRow(numero)
    row.height = 23
    for (let coluna = 1; coluna <= colunas; coluna += 1) {
      const celula = row.getCell(coluna)
      celula.font = { name: 'Arial', size: 10, color: { argb: cores.texto } }
      celula.alignment = { vertical: 'middle', wrapText: coluna === 3 }
      if (numero % 2 === 0)
        celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cores.cinzaClaro } }
      celula.border = {
        bottom: { style: 'hair', color: { argb: cores.borda } },
      }
    }
  }
}

function formatarPagamento(forma: string) {
  return ({
    pix: 'PIX',
    credito: 'Cartão de crédito',
    debito: 'Cartão de débito',
    dinheiro: 'Dinheiro',
  } as Record<string, string>)[forma] ?? forma
}

function formatarCategoria(categoria: string) {
  return ({
    ordem_servico: 'Serviço',
    venda: 'Venda',
    compra_materiais: 'Compra de materiais',
    compra_produtos: 'Compra de produtos',
    compra_estoque: 'Compra de estoque',
    aluguel: 'Aluguel',
    energia: 'Energia',
    agua: 'Água',
    funcionarios: 'Funcionários',
    estorno: 'Estorno',
  } as Record<string, string>)[categoria] ?? categoria
}

function criarPlanilhaResumo(workbook: Workbook, dados: DadosFinanceiros, periodo: Periodo, movimentoCount: number) {
  const worksheet = workbook.addWorksheet('Resumo')
  prepararFolha(worksheet, 'portrait')
  worksheet.columns = [{ width: 42 }, { width: 23 }]
  worksheet.getRow(1).height = 10
  worksheet.mergeCells('A2:B2')
  worksheet.getCell('A2').value = 'SEDA E COURO'
  estiloTitulo(worksheet, 'A2', 16)
  worksheet.getRow(2).height = 25
  worksheet.mergeCells('A3:B3')
  worksheet.getCell('A3').value = 'Relatório financeiro'
  worksheet.getCell('A3').font = { name: 'Arial', size: 12, color: { argb: cores.textoSuave } }
  worksheet.getRow(3).height = 22
  worksheet.getCell('A4').value = 'Período'
  worksheet.getCell('B4').value = periodoLegivel(periodo)
  worksheet.getCell('A5').value = 'Regime'
  worksheet.getCell('B5').value = 'Caixa'
  worksheet.getCell('A6').value = 'Gerado em'
  worksheet.getCell('B6').value = new Date().toLocaleString('pt-BR')
  for (const linha of [4, 5, 6]) {
    worksheet.getRow(linha).height = 21
    worksheet.getCell(`A${linha}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: cores.texto } }
    worksheet.getCell(`B${linha}`).font = { name: 'Arial', size: 10, color: { argb: cores.texto } }
  }
  worksheet.mergeCells('A8:B8')
  worksheet.getCell('A8').value = 'Indicadores do período'
  worksheet.getCell('A8').font = { name: 'Arial', size: 11, bold: true, color: { argb: cores.azul } }
  worksheet.getCell('A8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cores.azulClaro } }
  worksheet.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cores.azulClaro } }
  worksheet.getRow(8).height = 24
  worksheet.getRow(9).values = ['Indicador', 'Valor (R$)']
  estiloCabecalho(worksheet, 9, 2)
  metricas.forEach(([rotulo, campo], indice) => {
    const linha = 10 + indice
    worksheet.getRow(linha).values = [rotulo, valorResumo(dados, campo)]
    worksheet.getCell(`B${linha}`).numFmt = formatoMoeda
    worksheet.getCell(`B${linha}`).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  estiloLinhas(worksheet, 10, 9 + metricas.length, 2)
  worksheet.getCell('A18').value = movimentoCount
  worksheet.getCell('A18').numFmt = '0'
  worksheet.getCell('A18').font = { name: 'Arial', size: 9, italic: true, color: { argb: cores.textoSuave } }
  worksheet.getCell('B18').value = 'movimentações pagas no período'
  worksheet.getCell('B18').font = { name: 'Arial', size: 9, italic: true, color: { argb: cores.textoSuave } }
  worksheet.mergeCells('A20:B20')
  worksheet.getCell('A20').value = movimentoCount
    ? 'Os valores refletem os registros do sistema. Impostos e lucro líquido não são exibidos porque suas regras ainda não foram definidas.'
    : 'Nenhuma movimentação paga foi encontrada no período. Impostos e lucro líquido não são exibidos porque suas regras ainda não foram definidas.'
  worksheet.getCell('A20').font = { name: 'Arial', size: 9, italic: true, color: { argb: cores.textoSuave } }
  worksheet.getCell('A20').alignment = { vertical: 'middle', wrapText: true }
  worksheet.getRow(20).height = 34
  worksheet.pageSetup.printArea = 'A1:B20'
  return worksheet
}

function criarPlanilhaDetalhada(
  workbook: Workbook,
  nome: string,
  titulo: string,
  periodo: Periodo,
  cabecalhos: string[],
  linhas: (string | number)[][],
  larguras: number[],
  colunasMoeda: number[],
) {
  const worksheet = workbook.addWorksheet(nome)
  prepararFolha(worksheet, 'landscape')
  worksheet.columns = larguras.map((width) => ({ width }))
  const ultimaColuna = cabecalhos.length
  worksheet.getRow(1).height = 9
  worksheet.mergeCells(2, 1, 2, ultimaColuna)
  worksheet.getCell(2, 1).value = 'SEDA E COURO'
  estiloTitulo(worksheet, 'A2', 14)
  worksheet.getRow(2).height = 23
  worksheet.mergeCells(3, 1, 3, ultimaColuna)
  worksheet.getCell(3, 1).value = titulo
  worksheet.getCell(3, 1).font = { name: 'Arial', size: 11, bold: true, color: { argb: cores.texto } }
  worksheet.getRow(3).height = 20
  worksheet.mergeCells(4, 1, 4, ultimaColuna)
  worksheet.getCell(4, 1).value = `Período: ${periodoLegivel(periodo)}`
  worksheet.getCell(4, 1).font = { name: 'Arial', size: 9, italic: true, color: { argb: cores.textoSuave } }
  worksheet.getRow(4).height = 18
  worksheet.getRow(5).height = 7
  worksheet.getRow(6).values = cabecalhos
  estiloCabecalho(worksheet, 6, ultimaColuna)
  if (linhas.length) worksheet.addRows(linhas)
  const ultimaLinha = 6 + linhas.length
  estiloLinhas(worksheet, 7, ultimaLinha, ultimaColuna)
  for (const coluna of colunasMoeda) {
    for (let linha = 7; linha <= ultimaLinha; linha += 1) {
      worksheet.getCell(linha, coluna).numFmt = formatoMoeda
      worksheet.getCell(linha, coluna).alignment = { horizontal: 'right', vertical: 'middle' }
    }
  }
  worksheet.autoFilter = { from: `A6`, to: `${String.fromCharCode(64 + ultimaColuna)}${Math.max(6, ultimaLinha)}` }
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }]
  worksheet.pageSetup.printArea = `A1:${String.fromCharCode(64 + ultimaColuna)}${Math.max(6, ultimaLinha)}`
  worksheet.pageSetup.printTitlesRow = '2:6'
  return worksheet
}

export async function exportarFinanceiroExcel(
  dados: DadosFinanceiros,
  movimentacoes: MovimentoFinanceiro[],
  contas: ContaFinanceira[],
  periodo: Periodo,
) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Seda e Couro'
  workbook.created = new Date()
  criarPlanilhaResumo(workbook, dados, periodo, movimentacoes.length)
  criarPlanilhaDetalhada(
    workbook,
    'Movimentações',
    'Movimentações financeiras',
    periodo,
    ['Data', 'Tipo', 'Descrição', 'Categoria', 'Origem', 'Forma de pagamento', 'Valor (R$)'],
    movimentacoes.map((item) => [
      new Date(item.pago_em).toLocaleString('pt-BR'),
      item.tipo === 'entrada' ? 'Entrada' : 'Saída',
      item.descricao,
      formatarCategoria(item.categoria),
      item.origem_tipo === 'ordem_servico' ? 'Serviço' : item.origem_tipo === 'venda' ? 'Venda' : item.origem_tipo ?? '—',
      formatarPagamento(item.forma_pagamento),
      Number(item.valor),
    ]),
    [20, 13, 34, 23, 17, 23, 18],
    [7],
  )
  criarPlanilhaDetalhada(
    workbook,
    'Contas',
    'Contas e parcelas',
    periodo,
    ['Vencimento', 'Tipo', 'Descrição', 'Categoria', 'Parcela', 'Valor (R$)', 'Valor pago (R$)', 'Situação'],
    contas.map((item) => [
      item.vencimento.split('-').reverse().join('/'),
      item.tipo === 'entrada' ? 'Entrada' : 'Saída',
      item.descricao,
      formatarCategoria(item.categoria),
      `${item.numero} de ${item.total_parcelas}`,
      Number(item.valor),
      Number(item.valor_pago),
      ({ pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido', parcial: 'Parcial' } as Record<string, string>)[item.status] ?? item.status,
    ]),
    [17, 13, 32, 22, 16, 18, 19, 16],
    [6, 7],
  )
  const arquivo = await workbook.xlsx.writeBuffer()
  const blob = new Blob([arquivo], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo(periodo, 'dados', 'xlsx')
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function protegerTextoCsv(valor: unknown) {
  if (typeof valor === 'number') return String(valor)
  const texto = String(valor ?? '')
  return /^[\s]*[=+@-]/.test(texto) ? `'${texto}` : texto
}

function celulaCsv(valor: unknown) {
  const texto = protegerTextoCsv(valor).replaceAll('"', '""')
  return `"${texto}"`
}

function baixarCsv(nome: string, linhas: unknown[][]) {
  const texto = linhas
    .map((linha) => linha.map(celulaCsv).join(';'))
    .join('\r\n')
  const arquivo = new Blob([`\uFEFF${texto}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportarFinanceiroCsv(
  dados: DadosFinanceiros,
  movimentacoes: MovimentoFinanceiro[],
  contas: ContaFinanceira[],
  periodo: Periodo,
) {
  baixarCsv(
    nomeArquivo(periodo, 'resumo', 'csv'),
    conteudoResumo(dados).map((linha) =>
      linha.map((valor, indice) =>
        indice === 1 && typeof valor === 'number'
          ? valor.toFixed(2).replace('.', ',')
          : valor,
      ),
    ),
  )
  baixarCsv(
    nomeArquivo(periodo, 'movimentacoes', 'csv'),
    conteudoMovimentacoes(movimentacoes).map((linha) =>
      linha.map((valor, indice) =>
        indice === 5 && typeof valor === 'number'
          ? valor.toFixed(2).replace('.', ',')
          : valor,
      ),
    ),
  )
  baixarCsv(
    nomeArquivo(periodo, 'contas', 'csv'),
    conteudoContas(contas).map((linha) =>
      linha.map((valor, indice) =>
        [8, 9, 10].includes(indice) && typeof valor === 'number'
          ? valor.toFixed(2).replace('.', ',')
          : valor,
      ),
    ),
  )
}
