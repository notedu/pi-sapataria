import { jsPDF } from 'jspdf'
import type { Cliente } from '../services/clientes'
import type { OrdemDetalhada } from '../services/ordensServico'
import { formatarTelefone } from './clientes'
import { data } from './ordensServico'

// O documento impresso reaproveita os dados cadastrados e deixa campos
// financeiros sem regra definida em branco para preenchimento manual.
export function gerarPdfOrdemServico(ordem: OrdemDetalhada, cliente: Cliente) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const largura = pdf.internal.pageSize.getWidth()
  const esquerda = 10
  const direita = largura - esquerda
  const larguraUtil = direita - esquerda

  function caixa(
    x: number,
    y: number,
    w: number,
    h: number,
    rotulo: string,
    valor = '',
  ) {
    pdf.setDrawColor(90, 100, 118)
    pdf.rect(x, y, w, h)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(65, 72, 84)
    pdf.text(rotulo.toUpperCase(), x + 2, y + 3.5)
    if (valor) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(25, 31, 43)
      const linhas = pdf.splitTextToSize(valor, w - 4) as string[]
      pdf.text(linhas.slice(0, 2), x + 2, y + 8)
    }
  }

  pdf.setFillColor(7, 45, 112)
  pdf.rect(0, 0, largura, 28, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('SEDA E COURO', esquerda, 12)
  pdf.setFontSize(8)
  pdf.text('ORDEM DE SERVIÇO', esquerda, 19)
  pdf.text(`Nº ${ordem.id}`, direita, 14, { align: 'right' })

  caixa(esquerda, 33, larguraUtil, 13, 'Cliente', cliente.nome)
  const telefone = /^\d{11}$/.test(cliente.telefone)
    ? formatarTelefone(cliente.telefone)
    : cliente.telefone
  caixa(esquerda, 49, larguraUtil / 2 - 1, 13, 'Celular', telefone)
  caixa(esquerda + larguraUtil / 2 + 1, 49, larguraUtil / 2 - 1, 13, 'Telefone')
  caixa(esquerda, 65, larguraUtil / 2 - 1, 13, 'Entrada em', data(ordem.data_entrada))
  caixa(
    esquerda + larguraUtil / 2 + 1,
    65,
    larguraUtil / 2 - 1,
    13,
    'Retirada em',
    ordem.prazo_entrega ? data(ordem.prazo_entrega) : '',
  )

  const colunas = [
    { titulo: 'F/M', largura: 12 },
    { titulo: 'Descrição', largura: 39 },
    { titulo: 'Cor', largura: 20 },
    { titulo: 'Serviço', largura: 42 },
    { titulo: 'Observação', largura: 49 },
    { titulo: 'Valor', largura: 28 },
  ]
  const topoTabela = 84
  const alturaCabecalho = 9
  const baseLinhas = 8
  const quantidadeLinhas = Math.max(baseLinhas, ordem.itens.length)
  const alturaLinha = Math.min(12, 120 / quantidadeLinhas)
  let x = esquerda
  pdf.setFillColor(234, 239, 250)
  pdf.setDrawColor(70, 80, 98)
  colunas.forEach((coluna) => {
    pdf.rect(x, topoTabela, coluna.largura, alturaCabecalho, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(20, 35, 60)
    pdf.text(coluna.titulo, x + coluna.largura / 2, topoTabela + 5.7, {
      align: 'center',
    })
    x += coluna.largura
  })

  const limiteTexto = (texto: string, larguraMaxima: number) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    let resultado = texto
    while (resultado && pdf.getTextWidth(resultado) > larguraMaxima)
      resultado = `${resultado.slice(0, -2)}…`
    return resultado
  }

  for (let linha = 0; linha < quantidadeLinhas; linha++) {
    const item = ordem.itens[linha]
    const valores = ['', item?.descricao_item ?? '', '', item?.servico ?? '', '', '']
    x = esquerda
    valores.forEach((valor, indice) => {
      pdf.rect(x, topoTabela + alturaCabecalho + linha * alturaLinha, colunas[indice]!.largura, alturaLinha)
      if (valor) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.setTextColor(30, 35, 45)
        pdf.text(
          limiteTexto(valor, colunas[indice]!.largura - 3),
          x + 1.5,
          topoTabela + alturaCabecalho + linha * alturaLinha + alturaLinha / 2 + 1,
        )
      }
      x += colunas[indice]!.largura
    })
  }

  const yFinanceiro = topoTabela + alturaCabecalho + quantidadeLinhas * alturaLinha + 7
  const larguraFinanceiro = larguraUtil / 3
  caixa(esquerda, yFinanceiro, larguraFinanceiro - 1, 15, 'Adiantado')
  caixa(esquerda + larguraFinanceiro, yFinanceiro, larguraFinanceiro - 1, 15, 'Restante')
  caixa(
    esquerda + larguraFinanceiro * 2,
    yFinanceiro,
    larguraFinanceiro,
    15,
    'Total',
    `R$ ${Number(ordem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  )

  const yAssinatura = yFinanceiro + 28
  pdf.setDrawColor(70, 80, 98)
  pdf.line(esquerda + 35, yAssinatura, direita - 35, yAssinatura)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(45, 50, 60)
  pdf.text('Assinatura do cliente', largura / 2, yAssinatura + 5, {
    align: 'center',
  })

  const aviso =
    'Os serviços prontos devem ser retirados com a apresentação obrigatória do recibo dentro de um prazo mínimo de 90 dias. A não retirada dentro do prazo fará com que o cliente perca o direito sobre a mercadoria.'
  pdf.setFillColor(245, 246, 249)
  pdf.setDrawColor(180, 186, 196)
  pdf.roundedRect(esquerda, yAssinatura + 12, larguraUtil, 27, 2, 2, 'FD')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(45, 50, 60)
  pdf.text(pdf.splitTextToSize(aviso, larguraUtil - 8), esquerda + 4, yAssinatura + 20)

  pdf.save(`ordem-servico-${ordem.id}.pdf`)
}

// Via compacta para acompanhar o calçado durante a produção.
export function gerarPdfProducaoOrdemServico(
  ordem: OrdemDetalhada,
  cliente: Cliente,
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' })
  const largura = pdf.internal.pageSize.getWidth()
  const margem = 7
  const larguraUtil = largura - margem * 2
  let y = 9

  function texto(rotulo: string, valor: string, tamanho = 9) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(35, 40, 50)
    pdf.text(rotulo, margem, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(tamanho)
    const linhas = pdf.splitTextToSize(valor, larguraUtil - 17) as string[]
    pdf.text(linhas, margem + 17, y)
    y += Math.max(6, linhas.length * 4.5 + 1)
  }

  function caixa(rotulo: string, x: number) {
    const caixaX = x + 2
    const caixaY = y - 3.2
    pdf.setDrawColor(30, 35, 45)
    pdf.rect(caixaX, caixaY, 3.5, 3.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(35, 40, 50)
    pdf.text(rotulo, caixaX + 5, y)
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(7, 45, 112)
  pdf.text(`OS Nº ${ordem.id}`, margem, y + 2)
  pdf.setFontSize(8)
  pdf.setTextColor(35, 40, 50)
  pdf.text(`${ordem.itens.length} item(ns)`, largura - margem, y + 2, {
    align: 'right',
  })
  y += 10
  pdf.setDrawColor(75, 82, 94)
  pdf.line(margem, y - 3, largura - margem, y - 3)

  const telefone = /^\d{11}$/.test(cliente.telefone)
    ? formatarTelefone(cliente.telefone)
    : cliente.telefone
  texto('Telefone:', telefone)
  texto('Entrada:', data(ordem.data_entrada))
  texto('Retirada:', ordem.prazo_entrega ? data(ordem.prazo_entrega) : '____________')
  texto('Serviço:', ordem.itens.map((item) => item.servico).join('; '), 8)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(35, 40, 50)
  pdf.text('C/C', margem, y)
  caixa('Com cadastro', margem + 9)
  const xCP = margem + 48
  pdf.setFont('helvetica', 'bold')
  pdf.text('C/P', xCP, y)
  caixa('Com palmilha', xCP + 9)
  y += 9

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Valor:', margem, y)
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    `R$ ${Number(ordem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    margem + 17,
    y,
  )
  y += 9
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('Pagamento:', margem, y)
  const xPago = margem + 24
  caixa('Pago', xPago)
  caixa('Não pago', xPago + 28)

  pdf.save(`ordem-servico-${ordem.id}-producao.pdf`)
}
