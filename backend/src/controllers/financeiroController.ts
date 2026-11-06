import type { Request, Response } from 'express';
import { emTransacao } from '../config/transacao';
import * as model from '../models/financeiroModel';
import type { ItemManualFechamento } from '../models/financeiroModel';
import { decimal, idCorpo, lista, pagamento } from '../utils/operacoes';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

function textoConsulta(valor: unknown): string | undefined {
  return typeof valor === 'string' ? valor : undefined;
}
function data(valor: unknown, campo: string): string {
  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
    !Number.isFinite(Date.parse(`${valor}T00:00:00Z`))
  ) {
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      `Informe ${campo} como data YYYY-MM-DD.`,
    );
  }
  return valor;
}

function periodo(request: Request) {
  const inicioConsulta = textoConsulta(request.query.inicio);
  const fimConsulta = textoConsulta(request.query.fim);
  const inicio = inicioConsulta ? data(inicioConsulta, 'inicio') : '';
  const fim = fimConsulta ? data(fimConsulta, 'fim') : '';
  if (inicio && fim && inicio > fim)
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'O início deve ser anterior ou igual ao fim.',
    );
  return { inicio, fim };
}

export async function consultar(request: Request, response: Response) {
  const { inicio, fim } = periodo(request);
  response.json({
    dados: {
      periodo: { inicio: inicio || null, fim: fim || null, regime: 'caixa' },
      resumo: await model.resumo(inicio, fim),
      movimentacoes: await model.movimentacoes(inicio, fim),
      contas: await model.contas(inicio, fim),
    },
  });
}

export async function consultarFechamentos(_request: Request, response: Response) {
  response.json({ dados: await model.listarFechamentos() });
}

export async function fechamentoPorData(request: Request, response: Response) {
  const dataFechamento = data(request.params.data, 'data');
  response.json({ dados: await model.consultarFechamento(dataFechamento) });
}

export async function fecharCaixa(request: Request, response: Response) {
  const d = objeto(request.body, [
    'data',
    'modo',
    'pagamentos_ids',
    'itens_manuais',
  ]);
  const dataFechamento = data(d.data, 'data');
  const modo = d.modo ?? 'automatico';
  if (modo !== 'automatico' && modo !== 'manual')
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'modo deve ser automatico ou manual.');
  const idsPagamentos =
    d.pagamentos_ids === undefined
      ? []
      : lista(d.pagamentos_ids, 'pagamentos_ids', true).map(idCorpo);
  if (new Set(idsPagamentos).size !== idsPagamentos.length)
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Não repita pagamentos no fechamento.');
  const itensManuais: ItemManualFechamento[] =
    d.itens_manuais === undefined
      ? []
      : lista(d.itens_manuais, 'itens_manuais', true).map((valor, indice) => {
          const item = objeto(valor, [
            'descricao',
            'tipo',
            'valor',
            'forma_pagamento',
            'origem',
          ]);
          const descricao = texto(item.descricao, `itens_manuais[${indice}].descricao`);
          if (descricao.length > 200)
            throw new ErroHttp(400, 'DADOS_INVALIDOS', 'A descrição aceita até 200 caracteres.');
          if (item.tipo !== 'entrada' && item.tipo !== 'saida')
            throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O tipo manual deve ser entrada ou saida.');
          const origem = item.origem ?? 'outro';
          if (!['ordem_servico', 'venda', 'outro'].includes(String(origem)))
            throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Origem manual inválida.');
          const forma =
            item.tipo === 'entrada' ? pagamento(item.forma_pagamento) : null;
          return {
            descricao,
            tipo: item.tipo,
            valor: decimal(item.valor, `itens_manuais[${indice}].valor`, {
              positivo: true,
              dinheiro: true,
            }),
            forma_pagamento: forma as ItemManualFechamento['forma_pagamento'],
            origem: origem as ItemManualFechamento['origem'],
          };
        });
  if (modo === 'automatico' && (idsPagamentos.length || itensManuais.length))
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O fechamento automático não recebe itens manuais.');
  try {
    const fechamento = await model.criarFechamento(
      dataFechamento,
      request.funcionario!.id,
      modo,
      idsPagamentos,
      itensManuais,
    );
    response.status(201).json({ dados: fechamento });
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && error.code === '23505'
    )
      throw new ErroHttp(
        409,
        'CAIXA_JA_FECHADO',
        'O caixa desta data já foi fechado.',
      );
    throw error;
  }
}

export async function indicador(request: Request, response: Response) {
  const permitidos = ['faturamento', 'materiais', 'lucro', 'impostos'];
  const nomeIndicador = textoConsulta(request.params.indicador) ?? '';
  if (!permitidos.includes(nomeIndicador))
    throw new ErroHttp(
      404,
      'INDICADOR_NAO_ENCONTRADO',
      'Indicador financeiro não encontrado.',
    );
  const { inicio, fim } = periodo(request);
  const resumo = await model.resumo(inicio, fim);
  const campo =
    nomeIndicador === 'faturamento'
      ? 'faturamento_bruto'
      : nomeIndicador === 'materiais'
        ? 'custo_mercadorias_e_materiais'
        : nomeIndicador === 'lucro'
          ? 'lucro_bruto'
          : 'impostos';
  response.json({
    dados: {
      indicador: nomeIndicador,
      periodo: { inicio: inicio || null, fim: fim || null, regime: 'caixa' },
      valor: resumo[campo as keyof typeof resumo],
      movimentacoes: await model.movimentacoes(inicio, fim),
    },
  });
}

export async function despesa(request: Request, response: Response) {
  const d = objeto(request.body, [
    'categoria',
    'descricao',
    'valor',
    'vencimento',
    'total_parcelas',
  ]);
  const categorias = ['aluguel', 'energia', 'agua', 'funcionarios'];
  if (typeof d.categoria !== 'string' || !categorias.includes(d.categoria))
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'Categoria de despesa inválida.',
    );
  const vencimento = data(d.vencimento, 'vencimento');
  const valor = decimal(d.valor, 'valor', { dinheiro: true });
  const total = d.total_parcelas === undefined ? 1 : Number(d.total_parcelas);
  if (!Number.isInteger(total) || total < 1 || total > 120)
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'total_parcelas deve ser um inteiro entre 1 e 120.',
    );
  const resultado = await emTransacao((conexao) =>
    model.criarLancamento(conexao, {
      tipo: 'saida',
      categoria: d.categoria as string,
      descricao: texto(d.descricao, 'descricao'),
      valor,
      vencimento,
      totalParcelas: total,
      criadoPor: request.funcionario!.id,
    }),
  );
  response.status(201).json({ dados: resultado.lancamento });
}

export async function pagamentoFinanceiro(
  request: Request,
  response: Response,
) {
  const d = objeto(request.body, [
    'parcela_id',
    'valor',
    'forma_pagamento',
    'pago_em',
  ]);
  const pagamentoForma = pagamento(d.forma_pagamento);
  const valor = decimal(d.valor, 'valor', { dinheiro: true });
  const pagoEm =
    d.pago_em === undefined ? undefined : new Date(String(d.pago_em));
  if (pagoEm && !Number.isFinite(pagoEm.getTime()))
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'pago_em deve ser uma data válida.',
    );
  const resultado = await emTransacao((conexao) =>
    model.registrarPagamento(
      conexao,
      idCorpo(d.parcela_id),
      valor,
      pagamentoForma as 'pix' | 'credito' | 'debito' | 'dinheiro',
      request.funcionario!.id,
      pagoEm?.toISOString(),
    ),
  );
  response.status(201).json({ dados: resultado });
}

export async function estorno(request: Request, response: Response) {
  const d = objeto(request.body, ['motivo']);
  const resultado = await emTransacao((conexao) =>
    model.estornarLancamento(
      conexao,
      idValido(request.params.id),
      request.funcionario!.id,
      texto(d.motivo, 'motivo'),
    ),
  );
  if (!resultado)
    throw new ErroHttp(
      404,
      'LANCAMENTO_NAO_ENCONTRADO',
      'Lançamento financeiro não encontrado.',
    );
  response.status(201).json({ dados: resultado });
}
