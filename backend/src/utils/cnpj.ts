// Manual Receita Federal: ASCII − 48 e módulo 11; aceita CNPJ numérico e alfanumérico.
// Validação dos dígitos não comprova inscrição ou situação cadastral.
export function cnpjValido(valor: string): boolean {
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(valor) || /^(\d)\1{13}$/.test(valor))
    return false;
  for (const tamanho of [12, 13]) {
    let soma = 0;
    for (
      let i = tamanho - 1, peso = 2;
      i >= 0;
      i--, peso = peso === 9 ? 2 : peso + 1
    )
      soma += (valor.charCodeAt(i) - 48) * peso;
    const resto = soma % 11;
    if (Number(valor[tamanho]) !== (resto < 2 ? 0 : 11 - resto)) return false;
  }
  return true;
}
