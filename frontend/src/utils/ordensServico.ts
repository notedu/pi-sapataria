export const dinheiro = (valor: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
export const data = (valor: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${valor}T12:00:00`))

// Os dois últimos dígitos representam centavos, sem converter o valor para Number.
export function formatarValorOs(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '')
  if (!digitos) return ''
  const partes = digitos.padStart(3, '0')
  const reais = partes.slice(0, -2).replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${reais},${partes.slice(-2)}`
}

export function valorOsParaApi(valorFormatado: string): string {
  const digitos = valorFormatado.replace(/\D/g, '').padStart(3, '0')
  return `${digitos.slice(0, -2).replace(/^0+(?=\d)/, '')}.${digitos.slice(-2)}`
}

export function proximoStatus(status: string): string | null {
  return { Aberta: 'Em andamento', 'Em andamento': 'Pronta', Pronta: 'Entregue' }[status] ?? null
}
