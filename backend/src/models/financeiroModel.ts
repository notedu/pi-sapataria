import type { PoolClient } from 'pg';
import { pool } from '../config/db';
import { ErroHttp } from '../utils/validacao';

export type TipoFinanceiro = 'entrada' | 'saida';
export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro';

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
         COALESCE(SUM(CASE WHEN l.tipo='saida' AND l.categoria IN ('aluguel','energia','agua','funcionarios') THEN p.valor ELSE 0 END), 0)::text AS despesas
    FROM sapataria.pagamentos_financeiros p
    JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
    JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
    LEFT JOIN sapataria.lancamentos_financeiros original ON original.id=l.estorno_de_id
   WHERE ($1::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date)
     AND ($2::date IS NULL OR (p.pago_em AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date)`;

function valorData(data: string | undefined) {
  return data ?? new Date().toISOString().slice(0, 10);
}

export async function criarLancamento(conexao: Pick<PoolClient, 'query'>, dados: NovoLancamento) {
  const lancamento = await conexao.query(
    `INSERT INTO sapataria.lancamentos_financeiros
       (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,estorno_de_id,motivo_estorno,criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [dados.tipo, dados.categoria, dados.descricao, dados.valor, dados.origemTipo ?? null, dados.origemId ?? null,
      dados.estornoDeId ?? null, dados.motivoEstorno ?? null, dados.criadoPor ?? null],
  );
  const totalParcelas = dados.totalParcelas ?? 1;
  const valorTotal = Number(dados.valor);
  if (valorTotal === 0) return { lancamento: lancamento.rows[0], parcela: null };
  const valorBase = Number((valorTotal / totalParcelas).toFixed(2));
  const dataInicial = new Date(`${valorData(dados.vencimento)}T12:00:00Z`);
  let primeiraParcela: any;
  for (let numero = 1; numero <= totalParcelas; numero += 1) {
    const valorParcela = numero === totalParcelas
      ? Number((valorTotal - valorBase * (totalParcelas - 1)).toFixed(2))
      : valorBase;
    const vencimento = new Date(dataInicial);
    vencimento.setUTCMonth(vencimento.getUTCMonth() + numero - 1);
    const parcela = await conexao.query(
      `INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [lancamento.rows[0].id, numero, totalParcelas, valorParcela.toFixed(2), vencimento.toISOString().slice(0, 10)],
    );
    if (numero === 1) primeiraParcela = parcela.rows[0];
  }
  return { lancamento: lancamento.rows[0], parcela: primeiraParcela };
}

export async function registrarPagamento(conexao: Pick<PoolClient, 'query'>, parcelaId: number, valor: string, forma: FormaPagamento, criadoPor: number | null, pagoEm?: string) {
  const parcela = await conexao.query<{ valor: string }>('SELECT valor FROM sapataria.parcelas_financeiras WHERE id=$1 FOR UPDATE', [parcelaId]);
  if (!parcela.rows[0]) throw new ErroHttp(404, 'PARCELA_NAO_ENCONTRADA', 'Parcela financeira não encontrada.');
  const recebido = await conexao.query<{ total: string }>('SELECT COALESCE(SUM(valor),0)::text AS total FROM sapataria.pagamentos_financeiros WHERE parcela_id=$1', [parcelaId]);
  const limite = Number(parcela.rows[0].valor) - Number(recebido.rows[0]?.total ?? '0');
  if (Number(valor) <= 0 || Number(valor) > limite + 0.000001) throw new ErroHttp(409, 'PAGAMENTO_EXCEDENTE', 'O pagamento excede o valor pendente da parcela.');
  const resultado = await conexao.query(
    `INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,pago_em,criado_por)
     VALUES ($1,$2,$3,COALESCE($4::timestamptz,CURRENT_TIMESTAMP),$5) RETURNING *`,
    [parcelaId, valor, forma, pagoEm ?? null, criadoPor],
  );
  return resultado.rows[0];
}

export async function criarVenda(conexao: Pick<PoolClient, 'query'>, vendaId: number, total: string, forma: FormaPagamento, criadoPor: number) {
  const criado = await criarLancamento(conexao, { tipo: 'entrada', categoria: 'venda', descricao: `Venda #${vendaId}`, valor: total, origemTipo: 'venda', origemId: vendaId, criadoPor });
  if (Number(total) > 0) await registrarPagamento(conexao, criado.parcela.id, total, forma, criadoPor);
}

export async function criarOrdemServico(conexao: Pick<PoolClient, 'query'>, ordemId: number, valor: string, criadoPor: number | null) {
  await criarLancamento(conexao, { tipo: 'entrada', categoria: 'ordem_servico', descricao: `OS #${ordemId}`, valor, origemTipo: 'ordem_servico', origemId: ordemId, criadoPor });
}

export async function atualizarValorOrigem(conexao: Pick<PoolClient, 'query'>, origemTipo: string, origemId: number, valor: string) {
  const pagamento = await conexao.query<{ total: string }>(
    `SELECT COALESCE(SUM(p.valor),0)::text AS total FROM sapataria.pagamentos_financeiros p
      JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id
      JOIN sapataria.lancamentos_financeiros l ON l.id=pa.lancamento_id
     WHERE l.origem_tipo=$1 AND l.origem_id=$2`, [origemTipo, origemId]);
  if (Number(pagamento.rows[0]?.total ?? 0) > 0) throw new ErroHttp(409, 'VALOR_FINANCEIRO_PAGO', 'Não é possível alterar o valor após registrar um pagamento.');
  await conexao.query(
    `UPDATE sapataria.lancamentos_financeiros SET valor_total=$3 WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL`, [origemTipo, origemId, valor]);
  await conexao.query(
    `UPDATE sapataria.parcelas_financeiras SET valor=$3 WHERE lancamento_id IN (SELECT id FROM sapataria.lancamentos_financeiros WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL)`, [origemTipo, origemId, valor]);
}

export async function criarCompra(conexao: Pick<PoolClient, 'query'>, compraId: number, valor: string, categoria: string, criadoPor?: number) {
  await criarLancamento(conexao, { tipo: 'saida', categoria, descricao: `Compra #${compraId}`, valor, origemTipo: 'compra_estoque', origemId: compraId, criadoPor });
}

export async function estornarOrigem(conexao: Pick<PoolClient, 'query'>, origemTipo: string, origemId: number, criadoPor: number | null, motivo: string) {
  const original = await conexao.query<{ id: number; tipo: TipoFinanceiro; categoria: string; descricao: string; valor_total: string }>(
    `SELECT id,tipo,categoria,valor_total FROM sapataria.lancamentos_financeiros WHERE origem_tipo=$1 AND origem_id=$2 AND estorno_de_id IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE`, [origemTipo, origemId],
  );
  if (!original.rows[0]) return null;
  const existente = await conexao.query('SELECT id FROM sapataria.lancamentos_financeiros WHERE estorno_de_id=$1', [original.rows[0].id]);
  if (existente.rowCount) throw new ErroHttp(409, 'LANCAMENTO_JA_ESTORNADO', 'Este lançamento já possui estorno.');
  const reverso = original.rows[0].tipo === 'entrada' ? 'saida' : 'entrada';
  const criado = await criarLancamento(conexao, { tipo: reverso, categoria: 'estorno', descricao: `Estorno de ${original.rows[0].descricao}`, valor: original.rows[0].valor_total, origemTipo, origemId, estornoDeId: original.rows[0].id, motivoEstorno: motivo, criadoPor });
  const pagos = await conexao.query<{ forma_pagamento: FormaPagamento; total: string }>(
    `SELECT forma_pagamento, COALESCE(SUM(valor),0)::text AS total FROM sapataria.pagamentos_financeiros p JOIN sapataria.parcelas_financeiras pa ON pa.id=p.parcela_id WHERE pa.lancamento_id=$1 GROUP BY forma_pagamento ORDER BY forma_pagamento`, [original.rows[0].id],
  );
  for (const pago of pagos.rows) if (Number(pago.total) > 0 && criado.parcela) await registrarPagamento(conexao, criado.parcela.id, pago.total, pago.forma_pagamento, criadoPor);
  return criado.lancamento;
}

export async function estornarLancamento(conexao: Pick<PoolClient, 'query'>, lancamentoId: number, criadoPor: number | null, motivo: string) {
  const original = await conexao.query<{ origem_tipo: string | null; origem_id: number | null }>('SELECT origem_tipo,origem_id FROM sapataria.lancamentos_financeiros WHERE id=$1', [lancamentoId]);
  if (!original.rows[0]) throw new ErroHttp(404, 'LANCAMENTO_NAO_ENCONTRADO', 'Lançamento financeiro não encontrado.');
  const existente = await conexao.query('SELECT id FROM sapataria.lancamentos_financeiros WHERE estorno_de_id=$1', [lancamentoId]);
  if (existente.rowCount) throw new ErroHttp(409, 'LANCAMENTO_JA_ESTORNADO', 'Este lançamento já possui estorno.');
  if (!original.rows[0].origem_tipo || original.rows[0].origem_id === null) throw new ErroHttp(409, 'ORIGEM_AUSENTE', 'Este lançamento não possui origem para estorno.');
  return estornarOrigem(conexao, original.rows[0].origem_tipo, original.rows[0].origem_id, criadoPor, motivo);
}

export async function resumo(inicio: string, fim: string) {
  const resultado = await pool.query<{ entradas: string; saidas: string; estornos: string; estornos_vendas: string; estornos_entrada: string; estornos_saida: string; compras: string; despesas: string }>(resumoPagamentos, [inicio || null, fim || null]);
  const linha = resultado.rows[0]!;
  const custos = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.custo_total ELSE -m.custo_total END),0)::text AS total
        FROM sapataria.movimentacoes_estoque m
        LEFT JOIN sapataria.movimentacoes_estoque origem ON origem.id=m.reversao_de_id
      WHERE (m.material_os_id IS NOT NULL OR m.item_venda_id IS NOT NULL
             OR origem.material_os_id IS NOT NULL OR origem.item_venda_id IS NOT NULL)
        AND ($1::date IS NULL OR (m.data AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date)
        AND ($2::date IS NULL OR (m.data AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date)`, [inicio || null, fim || null]);
  const entrada = Number(linha.entradas); const saida = Number(linha.saidas); const estorno = Number(linha.estornos); const estornoVendas = Number(linha.estornos_vendas); const estornoEntrada = Number(linha.estornos_entrada); const estornoSaida = Number(linha.estornos_saida); const custo = Number(custos.rows[0]?.total ?? 0); const despesas = Number(linha.despesas);
  const saidasCaixa = saida + estornoSaida - estornoEntrada;
  return {
    faturamento_bruto: (entrada - estornoVendas).toFixed(2), saidas_caixa: saidasCaixa.toFixed(2), compras: linha.compras, estornos: linha.estornos,
    custo_mercadorias_e_materiais: custo.toFixed(2), despesas: despesas.toFixed(2),
    lucro_bruto: (entrada - estornoVendas - custo).toFixed(2), lucro_operacional: (entrada - estornoVendas - custo - despesas).toFixed(2),
    lucro_liquido: null, impostos: null,
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
      ORDER BY p.pago_em DESC, p.id DESC LIMIT 500`, [inicio || null, fim || null]);
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
      ORDER BY pa.vencimento DESC, l.id DESC LIMIT 500`, [inicio || null, fim || null]);
  return resultado.rows.map((item: any) => {
    const pago = Number(item.valor_pago); const valor = Number(item.valor); const status = pago >= valor ? 'pago' : pago > 0 ? 'parcial' : new Date(item.vencimento) < new Date() ? 'vencido' : 'pendente';
    return { ...item, status, parcelado: Number(item.total_parcelas) > 1 };
  });
}
