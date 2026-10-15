// Mesma regra da API; não consulta a Receita Federal.
export function cnpjValido(valor: string): boolean {
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(valor) || /^(\d)\1{13}$/.test(valor)) return false
  for (const tamanho of [12, 13]) {
    let soma = 0
    for (let i = tamanho - 1, peso = 2; i >= 0; i--, peso = peso === 9 ? 2 : peso + 1) soma += (valor.charCodeAt(i) - 48) * peso
    const resto = soma % 11
    if (Number(valor[tamanho]) !== (resto < 2 ? 0 : 11 - resto)) return false
  }
  return true
}
export const limparCnpj = (valor: string) => valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14)
export const formatarCnpj = (valor: string) => limparCnpj(valor).replace(/^(.{2})(.)/, '$1.$2').replace(/^(.{2})\.(.{3})(.)/, '$1.$2.$3').replace(/^(.{2})\.(.{3})\.(.{3})(.)/, '$1.$2.$3/$4').replace(/^(.{2})\.(.{3})\.(.{3})\/(.{4})(.)/, '$1.$2.$3/$4-$5')
export const formatarTelefoneFornecedor = (valor: string) => valor.replace(/^(\d{2})(\d)/, '($1) $2').replace(valor.length === 11 ? /(\d{5})(\d{4})$/ : /(\d{4})(\d{4})$/, '$1-$2')
