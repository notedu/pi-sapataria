// Cálculo em centavos evita resíduos de ponto flutuante na diferença dos preços.
export function lucroProduto(custo: string, venda: string) {
  const centavos = (valor: string) => {
    const [inteiro, fracao = ''] = valor.split('.')
    return BigInt(inteiro) * 100n + BigInt(fracao.padEnd(2, '0').slice(0, 2))
  }
  const compra = centavos(custo)
  const lucro = centavos(venda) - compra
  const percentual = compra === 0n ? null : Number((lucro * 10000n + (lucro < 0n ? -compra / 2n : compra / 2n)) / compra) / 100
  return { valor: Number(lucro) / 100, percentual }
}
