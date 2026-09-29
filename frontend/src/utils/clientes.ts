// Os dois últimos dígitos conferem os anteriores; isso não consulta a Receita Federal.
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const digito = (soma * 10 % 11) % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export const digitos = (valor: string, limite: number) => valor.replace(/\D/g, '').slice(0, limite)
export const formatarCpf = (valor: string) => digitos(valor, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
export const formatarCep = (valor: string) => digitos(valor, 8).replace(/^(\d{5})(\d)/, '$1-$2')
export const formatarTelefone = (valor: string) => digitos(valor, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
