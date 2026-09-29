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
