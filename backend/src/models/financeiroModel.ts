import type { PoolClient } from 'pg';
import { pool } from '../config/db';
import { ErroHttp } from '../utils/validacao';
import { emTransacao } from '../config/transacao';

export type TipoFinanceiro = 'entrada' | 'saida';
export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro';

export type FechamentoCaixa = {
  data: string;
  recebimentos_brutos: string;
  saidas: string;
  total_liquido: string;
  por_forma_pagamento: Record<string, string>;
  por_origem: Record<string, string>;
  saidas_por_categoria: Record<string, string>;
  modo: 'automatico' | 'manual';
  pagamentos_selecionados: PagamentoFechamento[];
  itens_manuais: ItemManualFechamento[];
  fechado: boolean;
  fechado_em: string | null;
  fechado_por: number | null;
  formato_manual: 'resumo' | 'detalhado';
  fonte_manual: 'pagamentos'|'valores';
  resumo_manual: Record<string, string> | null;
  dinheiro_contado: string | null;
  diferenca_dinheiro: string | null;
};

export type PagamentoFechamento = {
  id: number;
  valor: string;
  forma_pagamento: FormaPagamento;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  origem_tipo: string | null;
  origem_id: number | null;
  pago_em: string;
};

export type ItemManualFechamento = {
  descricao: string;
  tipo: TipoFinanceiro;
  valor: string;
  forma_pagamento: FormaPagamento | null;
  origem: 'ordem_servico' | 'venda' | 'outro';
};

async function bloquearDiaCaixa(conexao:Pick<PoolClient,'query'>,data:string) {
  // Fecha uma janela de corrida entre o último pagamento do dia e a fotografia do caixa.
  await conexao.query(`SELECT pg_advisory_xact_lock(hashtext('sapataria.financeiro'), ($1::date - DATE '2000-01-01')::integer)`,[data]);
}

type NovoLancamento = {
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  valor: string;
  origemTipo?: string;
  origemId?: number;
  criadoPor?: number | null;
  estornoDeId?: number;
  motivoEstorno?: string;
  vencimento?: string;
  totalParcelas?: number;
};

const resumoPagamentos = `
  SELECT COALESCE(SUM(CASE WHEN l.tipo='entrada' AND l.categoria <> 'estorno' THEN p.valor ELSE 0 END), 0)::text AS entradas,
         COALESCE(SUM(CASE WHEN l.tipo='saida' AND l.categoria <> 'estorno' THEN p.valor ELSE 0 END), 0)::text AS saidas,
         COALESCE(SUM(CASE WHEN l.categoria='estorno' THEN p.valor ELSE 0 END), 0)::text AS estornos,
         COALESCE(SUM(CASE WHEN l.categoria='estorno' AND l.tipo='saida' AND original.categoria IN ('venda','ordem_servico') THEN p.valor ELSE 0 END), 0)::text AS estornos_vendas,
         COALESCE(SUM(CASE WHEN l.categoria='estorno' AND l.tipo='entrada' THEN p.valor ELSE 0 END), 0)::text AS estornos_entrada,
         COALESCE(SUM(CASE WHEN l.categoria='estorno' AND l.tipo='saida' THEN p.valor ELSE 0 END), 0)::text AS estornos_saida,
         COALESCE(SUM(CASE WHEN l.tipo='saida' AND l.categoria IN ('compra_materiais','compra_produtos','compra_estoque') THEN p.valor ELSE 0 END), 0)::text AS compras,
         COALESCE(SUM(CASE WHEN l.tipo='saida' AND (l.categoria IN ('aluguel','energia','agua','funcionarios') OR EXISTS (SELECT 1 FROM sapataria.categorias_despesas cd WHERE cd.nome=l.categoria)) THEN p.valor ELSE 0 END), 0)::text AS despesas
    FROM sapataria.pagamentos_financeiros p
    JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
    JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
    LEFT JOIN sapataria.lancamentos_financeiros original ON original.id=l.estorno_de_id
   WHERE ($1::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date)
     AND ($2::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date)`;

function valorData(data: string | undefined) {
  return data ?? new Date().toISOString().slice(0, 10);
}

export async function criarLancamento(
  conexao: Pick<PoolClient, 'query'>,
  dados: NovoLancamento,
) {
  const lancamento = await conexao.query(
    `INSERT INTO sapataria.lancamentos_financeiros
       (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,estorno_de_id,motivo_estorno,criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      dados.tipo,
      dados.categoria,
      dados.descricao,
      dados.valor,
      dados.origemTipo ?? null,
      dados.origemId ?? null,
      dados.estornoDeId ?? null,
      dados.motivoEstorno ?? null,
      dados.criadoPor ?? null,
    ],
  );
  const totalParcelas = dados.totalParcelas ?? 1;
  const valorTotal = Number(dados.valor);
  if (valorTotal === 0)
    return { lancamento: lancamento.rows[0], parcela: null };
  const valorBase = Number((valorTotal / totalParcelas).toFixed(2));
  const dataInicial = new Date(`${valorData(dados.vencimento)}T12:00:00Z`);
  let primeiraParcela: any;
  for (let numero = 1; numero <= totalParcelas; numero += 1) {
    const valorParcela =
      numero === totalParcelas
        ? Number((valorTotal - valorBase * (totalParcelas - 1)).toFixed(2))
        : valorBase;
    const vencimento = new Date(dataInicial);
    vencimento.setUTCMonth(vencimento.getUTCMonth() + numero - 1);
    const parcela = await conexao.query(
      `INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        lancamento.rows[0].id,
        numero,
        totalParcelas,
        valorParcela.toFixed(2),
        vencimento.toISOString().slice(0, 10),
      ],
    );
    if (numero === 1) primeiraParcela = parcela.rows[0];
  }
  return { lancamento: lancamento.rows[0], parcela: primeiraParcela };
}

export async function registrarPagamento(
  conexao: Pick<PoolClient, 'query'>,
  parcelaId: number,
  valor: string,
  forma: FormaPagamento,
  criadoPor: number | null,
  pagoEm?: string,
) {
  await conexao.query(`SELECT pg_advisory_xact_lock(hashtext('sapataria.financeiro'), (($1::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date - DATE '2000-01-01')::integer)`,[pagoEm??new Date().toISOString()]);
  const parcela = await conexao.query<{ valor: string }>(
    'SELECT valor FROM sapataria.parcelas_financeiras WHERE id=$1 FOR UPDATE',
    [parcelaId],
  );
  if (!parcela.rows[0])
    throw new ErroHttp(
      404,
      'PARCELA_NAO_ENCONTRADA',
      'Parcela financeira não encontrada.',
    );
  const recebido = await conexao.query<{ total: string }>(
    'SELECT COALESCE(SUM(valor),0)::text AS total FROM sapataria.pagamentos_financeiros WHERE parcela_id=$1',
    [parcelaId],
  );
  const limite =
    Number(parcela.rows[0].valor) - Number(recebido.rows[0]?.total ?? '0');
  if (Number(valor) <= 0 || Number(valor) > limite + 0.000001)
    throw new ErroHttp(
      409,
      'PAGAMENTO_EXCEDENTE',
      'O pagamento excede o valor pendente da parcela.',
    );
  const resultado = await conexao.query(
    `INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,pago_em,criado_por)
     VALUES ($1,$2,$3,COALESCE($4::timestamptz,CURRENT_TIMESTAMP),$5) RETURNING *`,
    [parcelaId, valor, forma, pagoEm ?? null, criadoPor],
  );
  return resultado.rows[0];
}

export async function parcelaPertenceOs(conexao:Pick<PoolClient,'query'>,parcelaId:number) {
  const r=await conexao.query(`SELECT EXISTS(SELECT 1 FROM sapataria.parcelas_financeiras pa JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE pa.id=$1 AND l.origem_tipo='ordem_servico' AND l.estorno_de_id IS NULL) AS os`,[parcelaId]); return Boolean(r.rows[0]?.os);
}

export async function criarVenda(
  conexao: Pick<PoolClient, 'query'>,
  vendaId: number,
  total: string,
  forma: FormaPagamento,
  criadoPor: number,
) {
  const criado = await criarLancamento(conexao, {
    tipo: 'entrada',
    categoria: 'venda',
    descricao: `Venda #${vendaId}`,
    valor: total,
    origemTipo: 'venda',
    origemId: vendaId,
    criadoPor,
  });
  if (Number(total) > 0)
    await registrarPagamento(
      conexao,
      criado.parcela.id,
      total,
      forma,
      criadoPor,
    );
}

export async function criarOrdemServico(
  conexao: Pick<PoolClient, 'query'>,
  ordemId: number,
  valor: string,
  criadoPor: number | null,
  forma?: FormaPagamento | null,
  pagarAgora = true,
) {
  const criado = await criarLancamento(conexao, {
    tipo: 'entrada',
    categoria: 'ordem_servico',
    descricao: `OS #${ordemId}`,
    valor,
    origemTipo: 'ordem_servico',
    origemId: ordemId,
    criadoPor,
  });
  if (pagarAgora && criado.parcela && forma) await registrarPagamento(conexao, criado.parcela.id, valor, forma, criadoPor);
}

export async function totalPagoOrigem(conexao:Pick<PoolClient,'query'>,origemTipo:string,origemId:number) {
  const r=await conexao.query<{total:string}>('SELECT COALESCE(SUM(p.valor),0)::text AS total FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE l.origem_tipo=$1 AND l.origem_id=$2 AND l.estorno_de_id IS NULL',[origemTipo,origemId]); return Number(r.rows[0]?.total??0);
}

export async function atualizarValorOrigem(
  conexao: Pick<PoolClient, 'query'>,
  origemTipo: string,
  origemId: number,
  valor: string,
) {
  const pagamento = await conexao.query<{ total: string }>(
    `SELECT COALESCE(SUM(p.valor),0)::text AS total FROM sapataria.pagamentos_financeiros p
      JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
      JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
     WHERE l.origem_tipo=$1 AND l.origem_id=$2`,
    [origemTipo, origemId],
  );
  if (Number(pagamento.rows[0]?.total ?? 0) > 0)
    throw new ErroHttp(
      409,
      'VALOR_FINANCEIRO_PAGO',
      'Não é possível alterar o valor após registrar um pagamento.',
    );
  await conexao.query(
    `UPDATE sapataria.lancamentos_financeiros SET valor_total=$3 WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL`,
    [origemTipo, origemId, valor],
  );
  await conexao.query(
    `UPDATE sapataria.parcelas_financeiras SET valor=$3 WHERE lancamento_id IN (SELECT id FROM sapataria.lancamentos_financeiros WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL)`,
    [origemTipo, origemId, valor],
  );
}

export async function criarCompra(
  conexao: Pick<PoolClient, 'query'>,
  compraId: number,
  valor: string,
  categoria: string,
  criadoPor?: number,
) {
  await criarLancamento(conexao, {
    tipo: 'saida',
    categoria,
    descricao: `Compra #${compraId}`,
    valor,
    origemTipo: 'compra_estoque',
    origemId: compraId,
    criadoPor,
  });
}

export async function estornarOrigem(
  conexao: Pick<PoolClient, 'query'>,
  origemTipo: string,
  origemId: number,
  criadoPor: number | null,
  motivo: string,
) {
  const original = await conexao.query<{
    id: number;
    tipo: TipoFinanceiro;
    categoria: string;
    descricao: string;
    valor_total: string;
  }>(
    `SELECT id,tipo,categoria,valor_total FROM sapataria.lancamentos_financeiros WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    [origemTipo, origemId],
  );
  if (!original.rows[0]) return null;
  const existente = await conexao.query(
    'SELECT id FROM sapataria.lancamentos_financeiros WHERE estorno_de_id=$1',
    [original.rows[0].id],
  );
  if (existente.rowCount)
    throw new ErroHttp(
      409,
      'LANCAMENTO_JA_ESTORNADO',
      'Este lançamento já possui estorno.',
    );
  const reverso = original.rows[0].tipo === 'entrada' ? 'saida' : 'entrada';
  const criado = await criarLancamento(conexao, {
    tipo: reverso,
    categoria: 'estorno',
    descricao: `Estorno de ${original.rows[0].descricao}`,
    valor: original.rows[0].valor_total,
    origemTipo,
    origemId,
    estornoDeId: original.rows[0].id,
    motivoEstorno: motivo,
    criadoPor,
  });
  const pagos = await conexao.query<{
    forma_pagamento: FormaPagamento;
    total: string;
  }>(
    `SELECT p.forma_pagamento, COALESCE(SUM(p.valor),0)::text AS total FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id WHERE pa.lancamento_id=$1 GROUP BY p.forma_pagamento ORDER BY p.forma_pagamento`,
    [original.rows[0].id],
  );
  for (const pago of pagos.rows)
    if (Number(pago.total) > 0 && criado.parcela)
      await registrarPagamento(
        conexao,
        criado.parcela.id,
        pago.total,
        pago.forma_pagamento,
        criadoPor,
      );
  return criado.lancamento;
}

export async function estornarLancamento(
  conexao: Pick<PoolClient, 'query'>,
  lancamentoId: number,
  criadoPor: number | null,
  motivo: string,
) {
  const original = await conexao.query<{
    origem_tipo: string | null;
    origem_id: number | null;
  }>(
    'SELECT origem_tipo,origem_id FROM sapataria.lancamentos_financeiros WHERE id=$1',
    [lancamentoId],
  );
  if (!original.rows[0])
    throw new ErroHttp(
      404,
      'LANCAMENTO_NAO_ENCONTRADO',
      'Lançamento financeiro não encontrado.',
    );
  if(['venda','ordem_servico'].includes(original.rows[0].origem_tipo??'')) throw new ErroHttp(409,'CANCELAMENTO_PELO_MODULO_ORIGEM','Vendas e OS devem ser reembolsadas pelo fluxo de cancelamento do próprio módulo.');
  const existente = await conexao.query(
    'SELECT id FROM sapataria.lancamentos_financeiros WHERE estorno_de_id=$1',
    [lancamentoId],
  );
  if (existente.rowCount)
    throw new ErroHttp(
      409,
      'LANCAMENTO_JA_ESTORNADO',
      'Este lançamento já possui estorno.',
    );
  if (!original.rows[0].origem_tipo || original.rows[0].origem_id === null)
    throw new ErroHttp(
      409,
      'ORIGEM_AUSENTE',
      'Este lançamento não possui origem para estorno.',
    );
  return estornarOrigem(
    conexao,
    original.rows[0].origem_tipo,
    original.rows[0].origem_id,
    criadoPor,
    motivo,
  );
}

export async function resumo(inicio: string, fim: string) {
  const resultado = await pool.query<{
    entradas: string;
    saidas: string;
    estornos: string;
    estornos_vendas: string;
    estornos_entrada: string;
    estornos_saida: string;
    compras: string;
    despesas: string;
  }>(resumoPagamentos, [inicio || null, fim || null]);
  const linha = resultado.rows[0]!;
  const custos = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.custo_total ELSE -m.custo_total END),0)::text AS total
        FROM sapataria.movimentacoes_estoque m
        LEFT JOIN sapataria.movimentacoes_estoque origem ON origem.id=m.reversao_de_id
      WHERE (m.material_os_id IS NOT NULL OR m.item_venda_id IS NOT NULL
             OR origem.material_os_id IS NOT NULL OR origem.item_venda_id IS NOT NULL)
        AND ($1::date IS NULL OR (m.data AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date)
        AND ($2::date IS NULL OR (m.data AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date)`,
    [inicio || null, fim || null],
  );
  const entrada = Number(linha.entradas);
  const saida = Number(linha.saidas);
  const estorno = Number(linha.estornos);
  const estornoVendas = Number(linha.estornos_vendas);
  const estornoEntrada = Number(linha.estornos_entrada);
  const estornoSaida = Number(linha.estornos_saida);
  const custo = Number(custos.rows[0]?.total ?? 0);
  const despesas = Number(linha.despesas);
  const saidasCaixa = saida + estornoSaida - estornoEntrada;
  return {
    faturamento_bruto: (entrada - estornoVendas).toFixed(2),
    saidas_caixa: saidasCaixa.toFixed(2),
    compras: linha.compras,
    estornos: linha.estornos,
    custo_mercadorias_e_materiais: custo.toFixed(2),
    despesas: despesas.toFixed(2),
    lucro_bruto: (entrada - estornoVendas - custo).toFixed(2),
    lucro_operacional: (entrada - estornoVendas - custo - despesas).toFixed(2),
    lucro_liquido: null,
    impostos: null,
  };
}

export async function movimentacoes(inicio: string, fim: string) {
  const resultado = await pool.query(
    `SELECT p.id, p.pago_em, p.valor, p.forma_pagamento, l.tipo, l.categoria, l.descricao,
            l.origem_tipo, l.origem_id, l.estorno_de_id, l.motivo_estorno
       FROM sapataria.pagamentos_financeiros p
       JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
       JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
      WHERE ($1::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date)
        AND ($2::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date)
      ORDER BY p.pago_em DESC, p.id DESC LIMIT 500`,
    [inicio || null, fim || null],
  );
  return resultado.rows;
}

export async function contas(inicio: string, fim: string) {
  const resultado = await pool.query(
    `SELECT l.id,l.tipo,l.categoria,l.descricao,l.valor_total,l.origem_tipo,l.origem_id,
            pa.id AS parcela_id,pa.numero,pa.total_parcelas,pa.valor,pa.vencimento,
            COALESCE((SELECT SUM(p.valor) FROM sapataria.pagamentos_financeiros p WHERE p.parcela_id=pa.id),0)::text AS valor_pago
       FROM sapataria.lancamentos_financeiros l JOIN sapataria.parcelas_financeiras pa ON pa.lancamento_id=l.id
      WHERE NOT (l.origem_tipo='ordem_servico' AND EXISTS (SELECT 1 FROM sapataria.ordens_servico os WHERE os.id=l.origem_id AND os.status='Cancelada'))
        AND ($1::date IS NULL OR pa.vencimento >= $1::date) AND ($2::date IS NULL OR pa.vencimento <= $2::date)
      ORDER BY pa.vencimento DESC, l.id DESC LIMIT 500`,
    [inicio || null, fim || null],
  );
  return resultado.rows.map((item: any) => {
    const pago = Number(item.valor_pago);
    const valor = Number(item.valor);
    const status =
      pago >= valor
        ? 'pago'
        : pago > 0
          ? 'parcial'
          : new Date(item.vencimento) < new Date()
            ? 'vencido'
            : 'pendente';
    return { ...item, status, parcelado: Number(item.total_parcelas) > 1 };
  });
}

async function pagamentosDoDia(data: string, ids?: number[], conexao:Pick<PoolClient,'query'>=pool) {
  const resultado = await conexao.query<PagamentoFechamento>(
    `SELECT p.id,p.valor::text,p.forma_pagamento,l.tipo,l.categoria,l.descricao,
            l.origem_tipo,l.origem_id,p.pago_em
       FROM sapataria.pagamentos_financeiros p
       JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
       JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
      WHERE (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date=$1::date
        AND ($2::integer[] IS NULL OR p.id=ANY($2::integer[]))
      ORDER BY p.pago_em,p.id`,
    [data, ids ?? null],
  );
  return resultado.rows;
}

function somarPagamentos(
  data: string,
  pagamentos: PagamentoFechamento[],
  itensManuais: ItemManualFechamento[] = [],
  modo: 'automatico' | 'manual' = 'automatico',
) {
  const porForma: Record<string, number> = {};
  const porOrigem: Record<string, number> = {
    ordem_servico: 0,
    venda: 0,
    outro: 0,
  };
  const saidasPorCategoria: Record<string, number> = {};
  let recebimentos = 0;
  let saidas = 0;
  for (const linha of pagamentos) {
    const valor = Number(linha.valor);
    if (linha.tipo === 'entrada') recebimentos += valor;
    else saidas += valor;
    if (linha.tipo === 'entrada')
      porForma[linha.forma_pagamento] =
        (porForma[linha.forma_pagamento] ?? 0) + valor;
    if (linha.tipo === 'entrada') {
      const origem =
        linha.categoria === 'ordem_servico' || linha.categoria === 'venda'
          ? linha.categoria
          : 'outro';
      porOrigem[origem] += valor;
    } else {
      saidasPorCategoria[linha.categoria] =
        (saidasPorCategoria[linha.categoria] ?? 0) + valor;
    }
  }
  for (const item of itensManuais) {
    const valor = Number(item.valor);
    if (item.tipo === 'entrada') {
      recebimentos += valor;
      if (item.forma_pagamento)
        porForma[item.forma_pagamento] =
          (porForma[item.forma_pagamento] ?? 0) + valor;
      porOrigem[item.origem] += valor;
    } else {
      saidas += valor;
      saidasPorCategoria.manual = (saidasPorCategoria.manual ?? 0) + valor;
    }
  }
  const moeda = (valor: number) => valor.toFixed(2);
  return {
    data,
    modo,
    recebimentos_brutos: moeda(recebimentos),
    saidas: moeda(saidas),
    total_liquido: moeda(recebimentos - saidas),
    por_forma_pagamento: Object.fromEntries(
      Object.entries(porForma).map(([chave, valor]) => [chave, moeda(valor)]),
    ),
    por_origem: Object.fromEntries(
      Object.entries(porOrigem).map(([chave, valor]) => [chave, moeda(valor)]),
    ),
    saidas_por_categoria: Object.fromEntries(
      Object.entries(saidasPorCategoria).map(([chave, valor]) => [chave, moeda(valor)]),
    ),
    pagamentos_selecionados: pagamentos,
    itens_manuais: itensManuais,
  };
}

function somarResumo(data:string,pagamentos:PagamentoFechamento[],r:Record<string,string>,modo:'automatico'|'manual') {
  const formas={dinheiro:r.dinheiro??'0.00',pix:r.pix??'0.00',credito:r.credito??'0.00',debito:r.debito??'0.00'};
  // Formas de pagamento e origem são duas classificações do mesmo recebido.
  // O bruto vem de serviços + vendas; as formas ficam como conferência paralela.
  const servicos=Number(r.servicos??0);
  const vendas=Number(r.vendas??0);
  const bruto=servicos+vendas;
  const saidas=Number(r.saidas??0);
  const porOrigem={ordem_servico:servicos.toFixed(2),venda:vendas.toFixed(2),outro:'0.00'};
  return {data,modo,recebimentos_brutos:bruto.toFixed(2),saidas:saidas.toFixed(2),total_liquido:(bruto-saidas).toFixed(2),por_forma_pagamento:formas,por_origem:porOrigem,saidas_por_categoria:saidas?{manual:saidas.toFixed(2)}:{},pagamentos_selecionados:pagamentos,itens_manuais:[] as ItemManualFechamento[]};
}

export async function consultarFechamento(data: string) {
  const resultado = await pool.query<FechamentoCaixa>(
    'SELECT data::text,recebimentos_brutos::text,saidas::text,total_liquido::text,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,true AS fechado,fechado_em,fechado_por FROM sapataria.fechamentos_caixa WHERE data=$1::date',
    [data],
  );
  const pagamentos = await pagamentosDoDia(data);
  return {
    fechamento: resultado.rows[0] ?? {
      ...somarPagamentos(data, pagamentos),
      formato_manual: 'detalhado' as const,
      fonte_manual:'valores' as const,
      resumo_manual: null,
      dinheiro_contado: null,
      diferenca_dinheiro: null,
      fechado: false,
      fechado_em: null,
      fechado_por: null,
    },
    pagamentos_disponiveis: pagamentos,
  };
}

export async function listarFechamentos(inicio: string, fim: string, pagina: number, limite: number) {
  const [resultado,total] = await Promise.all([
    pool.query<FechamentoCaixa>(`SELECT data::text,recebimentos_brutos::text,saidas::text,total_liquido::text,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,true AS fechado,fechado_em,fechado_por FROM sapataria.fechamentos_caixa WHERE ($1::date IS NULL OR data >= $1::date) AND ($2::date IS NULL OR data <= $2::date) ORDER BY data DESC LIMIT $3 OFFSET $4`,[inicio||null,fim||null,limite,(pagina-1)*limite]),
    pool.query<{total:string}>('SELECT count(*)::text AS total FROM sapataria.fechamentos_caixa WHERE ($1::date IS NULL OR data >= $1::date) AND ($2::date IS NULL OR data <= $2::date)',[inicio||null,fim||null]),
  ]);
  return { itens: resultado.rows, pagina, limite, total: Number(total.rows[0]?.total ?? 0), paginas: Math.ceil(Number(total.rows[0]?.total ?? 0)/limite) };
}

export async function criarFechamento(
  data: string,
  funcionarioId: number,
  modo: 'automatico' | 'manual',
  idsPagamentos: number[] = [],
  itensManuais: ItemManualFechamento[] = [],
  formatoManual: 'resumo' | 'detalhado' = 'detalhado',
  resumoManual: Record<string,string> | null = null,
  dinheiroContado: string | null = null,
  fonteManual:'pagamentos'|'valores'='valores',
) {
  if (modo === 'manual' && ((formatoManual === 'resumo' && itensManuais.length > 0) || (formatoManual === 'detalhado' && resumoManual !== null))) throw new ErroHttp(400,'FORMATO_MANUAL_INVALIDO','Use um único formato no fechamento manual.');
  if (modo === 'manual' && formatoManual === 'resumo' && resumoManual) {
    const campos=['dinheiro','pix','credito','debito','servicos','vendas','saidas'];
    for (const campo of campos) if (resumoManual[campo] === undefined) throw new ErroHttp(400,'FORMATO_MANUAL_INVALIDO',`Preencha ${campo} no resumo manual.`);
  }
  return emTransacao(async(conexao)=>{
  await bloquearDiaCaixa(conexao,data);
  const pagamentos = await pagamentosDoDia(data,modo==='automatico'?undefined:idsPagamentos,conexao);
  if (modo === 'manual' && pagamentos.length !== new Set(idsPagamentos).size)
    throw new ErroHttp(400,'PAGAMENTO_FORA_DO_DIA','Um ou mais pagamentos selecionados não pertencem à data do fechamento.');
  const apurado = resumoManual ? somarResumo(data,pagamentos,resumoManual,modo) : somarPagamentos(data, pagamentos, itensManuais, modo);
  const dinheiroSistema = Number(apurado.por_forma_pagamento.dinheiro ?? 0);
  const diferencaDinheiro = dinheiroContado === null ? null : (Number(dinheiroContado)-dinheiroSistema).toFixed(2);
  const resultado = await conexao.query<FechamentoCaixa>(
    `INSERT INTO sapataria.fechamentos_caixa
       (data,recebimentos_brutos,saidas,total_liquido,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,fechado_por)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11,$12,$13::jsonb,$14,$15,$16)
     RETURNING data::text,recebimentos_brutos::text,saidas::text,total_liquido::text,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,true AS fechado,fechado_em,fechado_por`,
    [data, apurado.recebimentos_brutos, apurado.saidas, apurado.total_liquido,
      JSON.stringify(apurado.por_forma_pagamento), JSON.stringify(apurado.por_origem),
      JSON.stringify(apurado.saidas_por_categoria), modo,
      JSON.stringify(pagamentos), JSON.stringify(itensManuais), formatoManual,fonteManual, resumoManual ? JSON.stringify(resumoManual) : null, dinheiroContado,diferencaDinheiro, funcionarioId],
  );
  return resultado.rows[0]!;
  });
}

export async function corrigirFechamento(data:string, funcionarioId:number, modo:'automatico'|'manual', ids:number[], itens:ItemManualFechamento[], formato:'resumo'|'detalhado', resumo:Record<string,string>|null, dinheiroContado:string|null, motivo:string, fonte:'pagamentos'|'valores') {
  return emTransacao(async (conexao) => {
    await bloquearDiaCaixa(conexao,data);
    const atual=await conexao.query('SELECT * FROM sapataria.fechamentos_caixa WHERE data=$1::date FOR UPDATE',[data]);
    if(!atual.rows[0]) throw new ErroHttp(404,'FECHAMENTO_NAO_ENCONTRADO','Não há fechamento salvo para corrigir.');
    if(!motivo.trim()) throw new ErroHttp(400,'MOTIVO_OBRIGATORIO','Informe o motivo da correção.');
    await conexao.query('INSERT INTO sapataria.historico_fechamentos_caixa(data,fechamento_anterior,corrigido_por,motivo) VALUES($1,$2::jsonb,$3,$4)',[data,JSON.stringify(atual.rows[0]),funcionarioId,motivo.trim()]);
    const pagamentos=modo==='automatico' ? (await conexao.query<PagamentoFechamento>(`SELECT p.id,p.valor::text,p.forma_pagamento,l.tipo,l.categoria,l.descricao,l.origem_tipo,l.origem_id,p.pago_em FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date=$1::date ORDER BY p.id`,[data])).rows : (await conexao.query<PagamentoFechamento>(`SELECT p.id,p.valor::text,p.forma_pagamento,l.tipo,l.categoria,l.descricao,l.origem_tipo,l.origem_id,p.pago_em FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id WHERE (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date=$1::date AND p.id=ANY($2::integer[]) ORDER BY p.id`,[data,ids])).rows;
    if(modo==='manual'&&pagamentos.length!==new Set(ids).size) throw new ErroHttp(400,'PAGAMENTO_FORA_DO_DIA','Pagamento selecionado não pertence à data.');
    if(modo==='manual'&&((formato==='resumo'&&itens.length)||(formato==='detalhado'&&resumo))) throw new ErroHttp(400,'FORMATO_MANUAL_INVALIDO','Use um único formato manual.');
    const itensUsados=itens;
    const apurado=resumo?somarResumo(data,pagamentos,resumo,modo):somarPagamentos(data,pagamentos,itensUsados,modo);
    const dinheiroSistema=Number(apurado.por_forma_pagamento.dinheiro??0);
    const diferenca=dinheiroContado===null?null:(Number(dinheiroContado)-dinheiroSistema).toFixed(2);
    const atualizado=await conexao.query(`UPDATE sapataria.fechamentos_caixa SET recebimentos_brutos=$2,saidas=$3,total_liquido=$4,por_forma_pagamento=$5::jsonb,por_origem=$6::jsonb,saidas_por_categoria=$7::jsonb,modo=$8,pagamentos_selecionados=$9::jsonb,itens_manuais=$10::jsonb,formato_manual=$11,fonte_manual=$12,resumo_manual=$13::jsonb,dinheiro_contado=$14,diferenca_dinheiro=$15,fechado_em=CURRENT_TIMESTAMP,fechado_por=$16 WHERE data=$1 RETURNING data::text,recebimentos_brutos::text,saidas::text,total_liquido::text,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,true AS fechado,fechado_em,fechado_por`,[data,apurado.recebimentos_brutos,apurado.saidas,apurado.total_liquido,JSON.stringify(apurado.por_forma_pagamento),JSON.stringify(apurado.por_origem),JSON.stringify(apurado.saidas_por_categoria),modo,JSON.stringify(pagamentos),JSON.stringify(itensUsados),formato,fonte,resumo?JSON.stringify(resumo):null,dinheiroContado,diferenca,funcionarioId]);
    return atualizado.rows[0];
  });
}

export async function listarCategoriasDespesas() { return (await pool.query('SELECT id,nome FROM sapataria.categorias_despesas ORDER BY nome')).rows; }
export async function listarCorrecoes(data:string) { return (await pool.query(`SELECT h.id,to_char(h.corrigido_em AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD HH24:MI:SS') AS corrigido_em,h.motivo,f.nome AS corrigido_por,h.fechamento_anterior FROM sapataria.historico_fechamentos_caixa h LEFT JOIN sapataria.funcionarios f ON f.id=h.corrigido_por WHERE h.data=$1::date ORDER BY h.corrigido_em DESC,h.id DESC`,[data])).rows; }
export async function criarCategoriaDespesa(nome:string) { const criado=await pool.query('INSERT INTO sapataria.categorias_despesas(nome) VALUES($1) ON CONFLICT DO NOTHING RETURNING id,nome',[nome.trim()]); if(criado.rows[0]) return criado.rows[0]; return (await pool.query('SELECT id,nome FROM sapataria.categorias_despesas WHERE lower(nome)=lower($1)',[nome.trim()])).rows[0]; }
