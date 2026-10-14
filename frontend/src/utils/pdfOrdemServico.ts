import { jsPDF } from 'jspdf'
import type { Cliente } from '../services/clientes'
import type { MaterialDisponivel, OrdemDetalhada, UsoMaterial } from '../services/ordensServico'
import { formatarTelefone } from './clientes'
import { data, dinheiro } from './ordensServico'

const pagamento: Record<string, string> = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' }

// O PDF usa somente os dados já consultados para a OS; gerar o arquivo não altera registros.
export function gerarPdfOrdemServico(ordem: OrdemDetalhada, cliente: Cliente, usos: UsoMaterial[], materiais: MaterialDisponivel[]) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const largura = pdf.internal.pageSize.getWidth()
  const altura = pdf.internal.pageSize.getHeight()
  const esquerda = 18
  const direita = largura - esquerda
  let y = 24

  function novaPaginaSeNecessario(espaco: number) {
    if (y + espaco <= altura - 25) return
    pdf.addPage()
    y = 24
  }

  function titulo(texto: string) {
    novaPaginaSeNecessario(18)
    pdf.setFillColor(234, 239, 250)
    pdf.rect(esquerda, y - 6, direita - esquerda, 11, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(7, 45, 112)
    pdf.text(texto, esquerda + 3, y + 1)
    y += 15
  }

  function campo(rotulo: string, valor: string) {
    pdf.setFontSize(10)
    const linhas = pdf.splitTextToSize(valor || 'Não informado', direita - esquerda - 54) as string[]
    novaPaginaSeNecessario(Math.max(8, linhas.length * 5.5))
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(43, 49, 60)
    pdf.text(rotulo, esquerda + 2, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(linhas, esquerda + 52, y)
    y += Math.max(8, linhas.length * 5.5 + 2)
  }

  function paragrafo(texto: string) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(43, 49, 60)
    const linhas = pdf.splitTextToSize(texto, direita - esquerda - 4) as string[]
    for (const linha of linhas) {
      novaPaginaSeNecessario(7)
      pdf.text(linha, esquerda + 2, y)
      y += 6
    }
    y += 3
  }

  pdf.setFillColor(7, 45, 112)
  pdf.rect(0, 0, largura, 43, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('Seda e Couro', esquerda, 17)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Sapataria Profissional', esquerda, 25)
  pdf.text(`ORDEM DE SERVIÇO Nº ${ordem.id}`, direita, 17, { align: 'right' })
  pdf.text(`Situação: ${ordem.status}`, direita, 25, { align: 'right' })
  y = 56

  titulo('CLIENTE E ATENDIMENTO')
  campo('Cliente', cliente.nome)
  campo('Telefone', /^\d{11}$/.test(cliente.telefone) ? formatarTelefone(cliente.telefone) : cliente.telefone)
  campo('Responsável', ordem.responsavel_nome)

  titulo('SERVIÇO')
  campo('Item', ordem.descricao_calcado)
  campo('Serviço solicitado', ordem.servico)
  campo('Entrada', data(ordem.data_entrada))
  campo('Previsão de entrega', ordem.prazo_entrega ? data(ordem.prazo_entrega) : 'Não informada')
  campo('Valor', dinheiro(ordem.valor))
  campo('Forma de pagamento', pagamento[ordem.forma_pagamento ?? ''] ?? 'Não informada')

  titulo('OBSERVAÇÕES')
  paragrafo(ordem.observacoes || 'Nenhuma observação registrada.')

  titulo('MATERIAIS REGISTRADOS')
  if (usos.length === 0) paragrafo('Nenhum material registrado nesta ordem.')
  else {
    const nomes = new Map(materiais.map(material => [material.id, material]))
    for (const uso of usos) {
      const material = nomes.get(uso.material_id)
      paragrafo(`${material?.nome ?? `Material #${uso.material_id}`} — ${uso.quantidade_usada} ${material?.unidade ?? ''}`.trim())
    }
  }

  novaPaginaSeNecessario(35)
  y += 13
  pdf.setDrawColor(120, 130, 145)
  pdf.line(esquerda + 3, y, esquerda + 76, y)
  pdf.line(direita - 76, y, direita - 3, y)
  pdf.setFontSize(9)
  pdf.setTextColor(80, 85, 96)
  pdf.text('Assinatura do cliente', esquerda + 39, y + 6, { align: 'center' })
  pdf.text('Responsável pelo atendimento', direita - 39, y + 6, { align: 'center' })

  const totalPaginas = pdf.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    pdf.setPage(pagina)
    pdf.setDrawColor(210, 215, 225)
    pdf.line(esquerda, altura - 18, direita, altura - 18)
    pdf.setFontSize(8)
    pdf.setTextColor(100, 105, 115)
    pdf.text('Documento da ordem de serviço', esquerda, altura - 12)
    pdf.text(`Página ${pagina} de ${totalPaginas}`, direita, altura - 12, { align: 'right' })
  }
  pdf.save(`ordem-servico-${ordem.id}.pdf`)
}
