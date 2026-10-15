import type { ItemEstoque, LinhaImportacaoEstoque } from '../services/estoque'

export type LinhaCsvEstoque = { numero: number; dados?: LinhaImportacaoEstoque; erro?: string }
const cabecalho = ['tipo', 'nome', 'categoria', 'unidade', 'quantidade', 'quantidade_minima', 'custo', 'preco_custo', 'preco_venda']

function lerCsv(texto: string): string[][] {
  const linhas: string[][] = []
  let linha: string[] = [], campo = '', aspas = false
  for (let i = 0; i < texto.length; i++) {
    const caractere = texto[i]!
    if (aspas) {
      if (caractere === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (caractere === '"') aspas = false
      else campo += caractere
    } else if (caractere === '"' && campo === '') aspas = true
    else if (caractere === ',') { linha.push(campo); campo = '' }
    else if (caractere === '\n' || caractere === '\r') {
      if (caractere === '\r' && texto[i + 1] === '\n') i++
      linha.push(campo); campo = ''
      if (linha.some(valor => valor.trim())) linhas.push(linha)
      linha = []
    } else campo += caractere
  }
  if (aspas) throw new Error('O arquivo tem aspas sem fechamento.')
  linha.push(campo)
  if (linha.some(valor => valor.trim())) linhas.push(linha)
  return linhas
}

function decimal(valor: string, nome: string, inteiro = false, dinheiro = false) {
  if (!/^\d+(\.\d+)?$/.test(valor) || (inteiro && valor.includes('.')) || (dinheiro && (valor.split('.')[1]?.length ?? 0) > 2)) {
    throw new Error(`${nome} deve usar ponto decimal, sem separador de milhar${inteiro ? ' e sem casas decimais' : ''}.`)
  }
  return valor
}
const normalizar = (valor: string) => valor.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function analisarCsvEstoque(conteudo: string, produtos: ItemEstoque[], materiais: ItemEstoque[]): LinhaCsvEstoque[] {
  const tabela = lerCsv(conteudo.replace(/^\uFEFF/, ''))
  if (tabela.length < 2) throw new Error('O arquivo precisa ter o cabeçalho e ao menos uma linha de item.')
  if (tabela[0]!.length !== cabecalho.length || tabela[0]!.some((valor, indice) => valor.trim().toLocaleLowerCase('pt-BR') !== cabecalho[indice])) {
    throw new Error(`Use exatamente este cabeçalho: ${cabecalho.join(',')}`)
  }
  const vistos = new Set<string>()
  const existentes = { produto: new Set(produtos.map(item => `${normalizar(item.nome)}:${normalizar(item.categoria)}`)), material: new Set(materiais.map(item => `${normalizar(item.nome)}:${normalizar(item.categoria)}`)) }
  return tabela.slice(1).map((colunas, indice) => {
    const numeroLinha = indice + 2
    try {
      if (colunas.length !== cabecalho.length) throw new Error('A quantidade de colunas difere do cabeçalho.')
      const registro = Object.fromEntries(cabecalho.map((nome, i) => [nome, colunas[i]!.trim()]))
      if (!['material', 'produto'].includes(registro.tipo!)) throw new Error('tipo deve ser material ou produto.')
      const tipo = registro.tipo as 'material' | 'produto'
      const nome = registro.nome!, categoria = registro.categoria!
      if (!nome || !categoria) throw new Error('nome e categoria são obrigatórios.')
      const chave = `${tipo}:${normalizar(nome)}:${normalizar(categoria)}`
      if (vistos.has(chave) || existentes[tipo].has(`${normalizar(nome)}:${normalizar(categoria)}`)) throw new Error('Item duplicado no arquivo ou já cadastrado.')
      vistos.add(chave)
      const quantidade = decimal(registro.quantidade!, 'quantidade', tipo === 'produto')
      const quantidade_minima = decimal(registro.quantidade_minima!, 'quantidade_minima', tipo === 'produto')
      if (tipo === 'material') {
        if (!registro.unidade || !registro.custo || registro.preco_custo || registro.preco_venda) throw new Error('Material exige unidade e custo; preços de produto devem ficar vazios.')
        return { numero: numeroLinha, dados: { tipo, nome, categoria, unidade: registro.unidade, quantidade, quantidade_minima, custo: decimal(registro.custo, 'custo', false, true) } }
      }
      if (registro.unidade || registro.custo || !registro.preco_custo || !registro.preco_venda) throw new Error('Produto exige preço de compra e venda; unidade e custo de material devem ficar vazios.')
      return { numero: numeroLinha, dados: { tipo, nome, categoria, quantidade, quantidade_minima, preco_custo: decimal(registro.preco_custo, 'preco_custo', false, true), preco_venda: decimal(registro.preco_venda, 'preco_venda', false, true) } }
    } catch (error) {
      return { numero: numeroLinha, erro: error instanceof Error ? error.message : 'Linha inválida.' }
    }
  })
}
