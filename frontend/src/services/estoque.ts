import {
  enviarComCsrf,
  ErroApi,
  objeto,
  requisitar,
  ResultadoIncerto,
} from './api'

export type TipoEstoque = 'produtos' | 'materiais'
export type ItemEstoque = {
  id: number
  nome: string
  categoria: string
  quantidade: string
  preco_custo?: string
  preco_venda?: string
  custo?: string
  unidade?: string
  quantidade_minima?: string | null
  unidade_bloqueada?: boolean
}
export type DadosFornecedor = {
  nome: string
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  cep: string | null
  numero: string | null
  email: string | null
  telefone: string | null
  prazo_pagamento: string | null
  meios_pagamento: string | null
  desconto: string | null
  moeda: string | null
}
export type Fornecedor = { id: number; nome: string } & Partial<
  Omit<DadosFornecedor, 'nome'>
>
export type DadosItemEstoque = Record<string, string | number[]>
export type Vinculo = { item_id: number; fornecedor_id: number }
export type MovimentoEstoque = {
  id: number
  tipo: 'entrada' | 'saida'
  material_id: number | null
  produto_id: number | null
  quantidade: string
  data: string
  motivo: string
  item_venda_id: number | null
  material_os_id: number | null
  reversao_de_id: number | null
  item_compra_id: number | null
}
export type HistoricoGeralEstoque = {
  chave: string
  tipo: 'entrada' | 'saida' | 'cadastro'
  item_id: number
  item_tipo: 'material' | 'produto'
  item_nome: string
  quantidade: string | null
  data: string
  motivo: string
  ator_nome: string | null
}
export type CategoriaEstoque = { id: number; tipo: TipoEstoque; nome: string }
export type ItemCompraEstoque = {
  id: number
  material_id: number | null
  produto_id: number | null
  item_nome: string
  quantidade: string
  preco_unitario: string
}
export type CompraEstoque = {
  id: number
  fornecedor_id: number
  fornecedor_nome: string
  registrada_em: string
  itens: ItemCompraEstoque[]
}
export type LinhaImportacaoEstoque =
  | {
      tipo: 'material'
      nome: string
      categoria: string
      unidade: string
      quantidade: string
      quantidade_minima: string
      custo: string
    }
  | {
      tipo: 'produto'
      nome: string
      categoria: string
      quantidade: string
      quantidade_minima: string
      preco_custo: string
      preco_venda: string
    }
function decimal(valor: unknown) {
  return typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor)
}
export async function listarItens(tipo: TipoEstoque): Promise<ItemEstoque[]> {
  const r = await requisitar(`/${tipo}`)
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.id) &&
        typeof v.nome === 'string' &&
        typeof v.categoria === 'string' &&
        decimal(v.quantidade) &&
        (tipo === 'produtos'
          ? decimal(v.preco_custo) && decimal(v.preco_venda)
          : decimal(v.custo) &&
            decimal(v.quantidade_minima) &&
            typeof v.unidade === 'string' &&
            (v.unidade_bloqueada === undefined ||
              typeof v.unidade_bloqueada === 'boolean')) &&
        (tipo !== 'produtos' ||
          v.quantidade_minima === null ||
          decimal(v.quantidade_minima)),
    )
  ) {
    throw new Error('Não foi possível interpretar o estoque.')
  }
  return r.dados as ItemEstoque[]
}
export async function listarFornecedores(): Promise<Fornecedor[]> {
  const r = await requisitar('/fornecedores')
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.id) &&
        typeof v.nome === 'string' &&
        [
          'cnpj',
          'razao_social',
          'nome_fantasia',
          'cep',
          'numero',
          'email',
          'telefone',
          'prazo_pagamento',
          'meios_pagamento',
          'desconto',
          'moeda',
        ].every(
          (c) =>
            v[c] === undefined || v[c] === null || typeof v[c] === 'string',
        ),
    )
  )
    throw new Error('Não foi possível interpretar os fornecedores.')
  return r.dados as Fornecedor[]
}
export async function listarVinculos(tipo: TipoEstoque): Promise<Vinculo[]> {
  const r = await requisitar(`/fornecedores/vinculos/${tipo}`)
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.item_id) &&
        Number.isInteger(v.fornecedor_id),
    )
  )
    throw new Error('Não foi possível interpretar os vínculos.')
  return r.dados as Vinculo[]
}
export async function listarHistoricoEstoque(
  tipo: TipoEstoque,
  id: number,
): Promise<MovimentoEstoque[]> {
  const campo = tipo === 'materiais' ? 'material_id' : 'produto_id'
  const r = await requisitar(`/movimentacoes-estoque?${campo}=${id}`)
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.id) &&
        (v.tipo === 'entrada' || v.tipo === 'saida') &&
        decimal(v.quantidade) &&
        typeof v.data === 'string' &&
        Number.isFinite(Date.parse(v.data)) &&
        typeof v.motivo === 'string' &&
        v[campo] === id &&
        [
          'material_id',
          'produto_id',
          'item_venda_id',
          'material_os_id',
          'reversao_de_id',
          'item_compra_id',
        ].every((c) => v[c] === null || Number.isInteger(v[c])),
    )
  )
    throw new Error('Não foi possível interpretar o histórico deste item.')
  return r.dados as MovimentoEstoque[]
}
export async function listarHistoricoGeralEstoque(): Promise<
  HistoricoGeralEstoque[]
> {
  const r = await requisitar('/movimentacoes-estoque/historico-geral')
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        typeof v.chave === 'string' &&
        ['entrada', 'saida', 'cadastro'].includes(String(v.tipo)) &&
        Number.isInteger(v.item_id) &&
        ['material', 'produto'].includes(String(v.item_tipo)) &&
        typeof v.item_nome === 'string' &&
        (v.quantidade === null || decimal(v.quantidade)) &&
        typeof v.data === 'string' &&
        Number.isFinite(Date.parse(v.data)) &&
        typeof v.motivo === 'string' &&
        (v.ator_nome === null || typeof v.ator_nome === 'string'),
    )
  )
    throw new Error('Não foi possível interpretar o histórico geral.')
  return r.dados as HistoricoGeralEstoque[]
}
export async function listarCategoriasEstoque(
  tipo?: TipoEstoque,
): Promise<CategoriaEstoque[]> {
  const r = await requisitar(
    `/categorias-estoque${tipo ? `?tipo=${tipo}` : ''}`,
  )
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.id) &&
        ['produtos', 'materiais'].includes(String(v.tipo)) &&
        typeof v.nome === 'string',
    )
  )
    throw new Error('Não foi possível interpretar as categorias.')
  return r.dados as CategoriaEstoque[]
}
export async function criarCategoriaEstoque(tipo: TipoEstoque, nome: string) {
  const r = await enviarComCsrf('/categorias-estoque', { tipo, nome })
  if (!objeto(r) || !objeto(r.dados) || !Number.isInteger(r.dados.id))
    throw new ResultadoIncerto(
      'Atualize as categorias antes de repetir o cadastro.',
    )
  return r.dados as CategoriaEstoque
}
export async function listarComprasEstoque(): Promise<CompraEstoque[]> {
  const r = await requisitar('/compras-estoque')
  if (
    !objeto(r) ||
    !Array.isArray(r.dados) ||
    !r.dados.every(
      (v) =>
        objeto(v) &&
        Number.isInteger(v.id) &&
        Number.isInteger(v.fornecedor_id) &&
        typeof v.fornecedor_nome === 'string' &&
        typeof v.registrada_em === 'string' &&
        Array.isArray(v.itens) &&
        v.itens.every(
          (item) =>
            objeto(item) &&
            Number.isInteger(item.id) &&
            typeof item.item_nome === 'string' &&
            decimal(item.quantidade) &&
            decimal(item.preco_unitario) &&
            (item.material_id === null || Number.isInteger(item.material_id)) &&
            (item.produto_id === null || Number.isInteger(item.produto_id)),
        ),
    )
  )
    throw new Error('Não foi possível interpretar as compras.')
  return r.dados as CompraEstoque[]
}
export async function registrarCompraEstoque(
  fornecedorId: number,
  itens: Omit<ItemCompraEstoque, 'id' | 'item_nome'>[],
) {
  const r = await enviarComCsrf('/compras-estoque', {
    fornecedor_id: fornecedorId,
    itens,
  })
  if (!objeto(r) || !objeto(r.dados) || !Number.isInteger(r.dados.id))
    throw new ResultadoIncerto(
      'Atualize o histórico antes de repetir a compra.',
    )
  return r
}
// Traduz apenas os erros deste módulo, sem alterar as mensagens dos demais cadastros.
export async function alterarEstoque(
  caminho: string,
  dados?: unknown,
  metodo: 'POST' | 'PUT' | 'DELETE' = 'POST',
) {
  try {
    const r = await enviarComCsrf(caminho, dados, metodo)
    if (metodo === 'DELETE' || caminho.includes('/vinculos/')) {
      if (r !== null)
        throw new ResultadoIncerto(
          'Confira a lista antes de repetir a operação.',
        )
    } else if (
      !objeto(r) ||
      !objeto(r.dados) ||
      !Number.isInteger(r.dados.id)
    ) {
      throw new ResultadoIncerto(
        'Não foi possível confirmar o resultado. Atualize a lista antes de tentar novamente.',
      )
    }
  } catch (erro) {
    const mensagens: Record<string, string> = {
      MATERIAL_UNIDADE_BLOQUEADA:
        'Não é permitido trocar a unidade de material com saldo ou movimentações.',
      FORNECEDOR_INVALIDO: 'Selecione fornecedores existentes, sem repetições.',
      CNPJ_INVALIDO:
        'Informe um CNPJ com formato e dígitos verificadores válidos.',
      CEP_INVALIDO: 'Informe um CEP com 8 números.',
      EMAIL_INVALIDO: 'Informe um e-mail em formato válido.',
      TELEFONE_INVALIDO: 'Informe telefone com DDD e 10 ou 11 números.',
    }
    if (erro instanceof ErroApi && erro.codigo && mensagens[erro.codigo])
      throw new ErroApi(erro.status, mensagens[erro.codigo], erro.codigo)
    if (erro instanceof ErroApi && erro.status === 409) {
      const mensagem =
        erro.codigo === 'ESTOQUE_INSUFICIENTE'
          ? 'Saldo insuficiente para esta saída.'
          : erro.codigo === 'ESTOQUE_NAO_VAZIO'
            ? 'A exclusão exige saldo zero.'
            : 'Este cadastro possui vínculos. Preserve o histórico ou remova as associações de fornecedores antes de excluí-lo.'
      throw new ErroApi(409, mensagem, erro.codigo)
    }
    if (erro instanceof ErroApi && erro.status === 404)
      throw new ErroApi(
        404,
        'Cadastro não encontrado. Atualize a lista.',
        erro.codigo,
      )
    throw erro
  }
}
