import { enviarComCsrf, ErroApi, objeto, requisitar, ResultadoIncerto } from './api'

export type TipoEstoque = 'produtos' | 'materiais'
export type ItemEstoque = {
  id: number; nome: string; categoria: string; quantidade: string
  preco_custo?: string; preco_venda?: string; custo?: string; unidade?: string; quantidade_minima?: string
  unidade_bloqueada?: boolean
}
export type DadosFornecedor = { nome: string; cnpj: string | null; razao_social: string | null; nome_fantasia: string | null; cep: string | null; numero: string | null; email: string | null; telefone: string | null; prazo_pagamento: string | null; meios_pagamento: string | null; desconto: string | null; moeda: string | null }
export type Fornecedor = { id: number; nome: string } & Partial<Omit<DadosFornecedor, 'nome'>>
export type DadosItemEstoque = Record<string, string | number[]>
export type Vinculo = { item_id: number; fornecedor_id: number }
export type MovimentoEstoque = {
  id: number; tipo: 'entrada' | 'saida'; material_id: number | null; produto_id: number | null
  quantidade: string; data: string; motivo: string; item_venda_id: number | null; material_os_id: number | null; reversao_de_id: number | null
}
function decimal(valor: unknown) { return typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor) }
export async function listarItens(tipo: TipoEstoque): Promise<ItemEstoque[]> {
  const r = await requisitar(`/${tipo}`)
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.id)
    && typeof v.nome === 'string' && typeof v.categoria === 'string' && decimal(v.quantidade)
    && (tipo === 'produtos' ? decimal(v.preco_custo) && decimal(v.preco_venda)
      : decimal(v.custo) && decimal(v.quantidade_minima) && typeof v.unidade === 'string' && (v.unidade_bloqueada === undefined || typeof v.unidade_bloqueada === 'boolean')))) {
    throw new Error('Não foi possível interpretar o estoque.')
  }
  return r.dados as ItemEstoque[]
}
export async function listarFornecedores(): Promise<Fornecedor[]> {
  const r = await requisitar('/fornecedores')
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.id) && typeof v.nome === 'string'
    && ['cnpj', 'razao_social', 'nome_fantasia', 'cep', 'numero', 'email', 'telefone', 'prazo_pagamento', 'meios_pagamento', 'desconto', 'moeda'].every(c => v[c] === undefined || v[c] === null || typeof v[c] === 'string'))) throw new Error('Não foi possível interpretar os fornecedores.')
  return r.dados as Fornecedor[]
}
export async function listarVinculos(tipo: TipoEstoque): Promise<Vinculo[]> {
  const r = await requisitar(`/fornecedores/vinculos/${tipo}`)
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.item_id) && Number.isInteger(v.fornecedor_id))) throw new Error('Não foi possível interpretar os vínculos.')
  return r.dados as Vinculo[]
}
export async function listarHistoricoEstoque(tipo: TipoEstoque, id: number): Promise<MovimentoEstoque[]> {
  const campo = tipo === 'materiais' ? 'material_id' : 'produto_id'
  const r = await requisitar(`/movimentacoes-estoque?${campo}=${id}`)
  if (!objeto(r) || !Array.isArray(r.dados) || !r.dados.every(v => objeto(v) && Number.isInteger(v.id)
    && (v.tipo === 'entrada' || v.tipo === 'saida') && decimal(v.quantidade)
    && typeof v.data === 'string' && Number.isFinite(Date.parse(v.data)) && typeof v.motivo === 'string'
    && v[campo] === id
    && ['material_id', 'produto_id', 'item_venda_id', 'material_os_id', 'reversao_de_id'].every(c => v[c] === null || Number.isInteger(v[c])))) throw new Error('Não foi possível interpretar o histórico deste item.')
  return r.dados as MovimentoEstoque[]
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
    const mensagens: Record<string, string> = {
      MATERIAL_UNIDADE_BLOQUEADA: 'Não é permitido trocar a unidade de material com saldo ou movimentações.',
      FORNECEDOR_INVALIDO: 'Selecione fornecedores existentes, sem repetições.',
      CNPJ_INVALIDO: 'Informe um CNPJ com formato e dígitos verificadores válidos.',
      CEP_INVALIDO: 'Informe um CEP com 8 números.',
      EMAIL_INVALIDO: 'Informe um e-mail em formato válido.',
      TELEFONE_INVALIDO: 'Informe telefone com DDD e 10 ou 11 números.',
    }
    if (erro instanceof ErroApi && erro.codigo && mensagens[erro.codigo]) throw new ErroApi(erro.status, mensagens[erro.codigo], erro.codigo)
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
