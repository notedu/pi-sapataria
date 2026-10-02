import { enviarComCsrf, ErroApi, objeto, requisitar, ResultadoIncerto } from './api'

export type TipoEstoque = 'produtos' | 'materiais'
export type ItemEstoque = {
  id: number; nome: string; categoria: string; quantidade: string
  preco_custo?: string; preco_venda?: string; custo?: string; unidade?: string; quantidade_minima?: string
}
export type Fornecedor = { id: number; nome: string }
export type Vinculo = { item_id: number; fornecedor_id: number }
function decimal(valor: unknown) { return typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor) }
export async function listarItens(tipo: TipoEstoque): Promise<ItemEstoque[]> {
  const r = await requisitar(`/${tipo}`)
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.id)
    && typeof v.nome === 'string' && typeof v.categoria === 'string' && decimal(v.quantidade)
    && (tipo === 'produtos' ? decimal(v.preco_custo) && decimal(v.preco_venda)
      : decimal(v.custo) && decimal(v.quantidade_minima) && typeof v.unidade === 'string'))) {
    throw new Error('Não foi possível interpretar o estoque.')
  }
  return r.dados as ItemEstoque[]
}
export async function listarFornecedores(): Promise<Fornecedor[]> {
  const r = await requisitar('/fornecedores')
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.id) && typeof v.nome === 'string')) throw new Error('Não foi possível interpretar os fornecedores.')
  return r.dados as Fornecedor[]
}
export async function listarVinculos(tipo: TipoEstoque): Promise<Vinculo[]> {
  const r = await requisitar(`/fornecedores/vinculos/${tipo}`)
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.item_id) && Number.isInteger(v.fornecedor_id))) throw new Error('Não foi possível interpretar os vínculos.')
  return r.dados as Vinculo[]
}
// Traduz apenas os erros deste módulo, sem alterar as mensagens dos demais cadastros.
export async function alterarEstoque(caminho: string, dados?: unknown, metodo: 'POST' | 'PUT' | 'DELETE' = 'POST') {
  try {
    const r = await enviarComCsrf(caminho, dados, metodo)
    if (metodo === 'DELETE' || caminho.includes('/vinculos/')) {
      if (r !== null) throw new ResultadoIncerto('Confira a lista antes de repetir a operação.')
    } else if (!objeto(r) || !objeto(r.dados) || !Number.isInteger(r.dados.id)) {
      throw new ResultadoIncerto('Não foi possível confirmar o resultado. Atualize a lista antes de tentar novamente.')
    }
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 409) {
      const mensagem = erro.codigo === 'ESTOQUE_INSUFICIENTE' ? 'Saldo insuficiente para esta saída.'
        : erro.codigo === 'ESTOQUE_NAO_VAZIO' ? 'A exclusão exige saldo zero.'
          : 'Este cadastro possui vínculos. Preserve o histórico ou remova as associações de fornecedores antes de excluí-lo.'
      throw new ErroApi(409, mensagem, erro.codigo)
    }
    if (erro instanceof ErroApi && erro.status === 404) throw new ErroApi(404, 'Cadastro não encontrado. Atualize a lista.', erro.codigo)
    throw erro
  }
}
