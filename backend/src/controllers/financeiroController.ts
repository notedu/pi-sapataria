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
  const { inicio, fim } = periodo(_request);
  const pagina = Number(_request.query.pagina ?? 1);
  const limite = Number(_request.query.limite ?? 20);
  if (!Number.isInteger(pagina) || pagina < 1 || !Number.isInteger(limite) || limite < 1 || limite > 100)
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Pagina deve ser positiva e limite entre 1 e 100.');
  response.json({ dados: await model.listarFechamentos(inicio, fim, pagina, limite) });
}

export async function fechamentoPorData(request: Request, response: Response) {
  const dataFechamento = data(request.params.data, 'data');
  const resultado = await model.consultarFechamento(dataFechamento);
  response.json({ dados: { fechamento: resultado.fechamento, pagamentos_disponiveis: resultado.pagamentos_disponiveis } });
}

export async function fecharCaixa(request: Request, response: Response) {
  const d = objeto(request.body, [
    'data',
    'modo',
    'pagamentos_ids',
    'itens_manuais', 'formato_manual', 'resumo_manual', 'dinheiro_contado','fonte_manual',
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
  const formatoManual = d.formato_manual ?? 'detalhado';
  const fonteManual=d.fonte_manual??'valores';
  if(!['pagamentos','valores'].includes(String(fonteManual))) throw new ErroHttp(400,'DADOS_INVALIDOS','fonte_manual inválida.');
  if (!['resumo', 'detalhado'].includes(String(formatoManual))) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Formato manual inválido.');
  if (modo === 'manual' && ((formatoManual === 'resumo' && itensManuais.length) || (formatoManual === 'detalhado' && d.resumo_manual !== undefined && d.resumo_manual !== null))) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Use somente um formato de preenchimento manual.');
  const resumoCru = d.resumo_manual === undefined || d.resumo_manual === null ? null : objeto(d.resumo_manual, ['dinheiro','pix','credito','debito','servicos','vendas','saidas']);
  const resumoManual = resumoCru ? Object.fromEntries(['dinheiro','pix','credito','debito','servicos','vendas','saidas'].map((campo)=>[campo,decimal(resumoCru[campo],`resumo_manual.${campo}`,{dinheiro:true})])) as Record<string,string> : null;
  if(modo==='manual'&&fonteManual==='valores'&&formatoManual==='resumo'&&resumoManual===null) throw new ErroHttp(400,'DADOS_INVALIDOS','Informe os valores do resumo manual.');
  if(modo==='manual'&&((fonteManual==='pagamentos'&&(itensManuais.length||resumoManual!==null))||(fonteManual==='valores'&&idsPagamentos.length))) throw new ErroHttp(400,'FONTES_MANUAIS_EXCLUSIVAS','Escolha pagamentos ou valores manuais.');
  const dinheiroContado = d.dinheiro_contado === undefined || d.dinheiro_contado === null ? null : decimal(d.dinheiro_contado, 'dinheiro_contado', { dinheiro: true });
  if (modo === 'automatico' && (idsPagamentos.length || itensManuais.length || resumoManual!==null))
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O fechamento automático não recebe itens manuais.');
  try {
    const fechamento = await model.criarFechamento(
      dataFechamento,
      request.funcionario!.id,
      modo,
      idsPagamentos,
      itensManuais,
      formatoManual as 'resumo' | 'detalhado',
      resumoManual,
      dinheiroContado,
      fonteManual as 'pagamentos'|'valores',
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

export async function corrigirFechamento(request: Request, response: Response) {
  const dataFechamento = data(request.params.data, 'data');
  const d = objeto(request.body, ['modo','pagamentos_ids','itens_manuais','formato_manual','resumo_manual','dinheiro_contado','fonte_manual','motivo']);
  const modo = d.modo;
  if (modo !== 'automatico' && modo !== 'manual') throw new ErroHttp(400,'DADOS_INVALIDOS','modo deve ser automatico ou manual.');
  const formato=d.formato_manual??'detalhado';
  const fonte=d.fonte_manual??'valores';
  if(!['resumo','detalhado'].includes(String(formato))||!['pagamentos','valores'].includes(String(fonte))) throw new ErroHttp(400,'DADOS_INVALIDOS','Formato ou fonte manual inválidos.');
  const itens:ItemManualFechamento[] = d.itens_manuais === undefined ? [] : lista(d.itens_manuais,'itens_manuais',true).map((v, i) => {
    const x=objeto(v,['descricao','tipo','valor','forma_pagamento','origem']);
    if(x.tipo!=='entrada'&&x.tipo!=='saida') throw new ErroHttp(400,'DADOS_INVALIDOS',`Tipo inválido no item ${i+1}.`);
    const origem=x.origem??'outro';
    if(!['ordem_servico','venda','outro'].includes(String(origem))) throw new ErroHttp(400,'DADOS_INVALIDOS',`Origem inválida no item ${i+1}.`);
    return { descricao:texto(x.descricao,'descricao'), tipo:x.tipo as 'entrada'|'saida', valor:decimal(x.valor,'valor',{positivo:true,dinheiro:true}), forma_pagamento:x.tipo==='entrada'?pagamento(x.forma_pagamento) as ItemManualFechamento['forma_pagamento']:null, origem:origem as ItemManualFechamento['origem'] };
  });
  const ids = d.pagamentos_ids === undefined ? [] : lista(d.pagamentos_ids,'pagamentos_ids',true).map(idCorpo);
  if(new Set(ids).size!==ids.length) throw new ErroHttp(400,'DADOS_INVALIDOS','Não repita pagamentos na correção.');
  const dinheiroContado = d.dinheiro_contado === undefined || d.dinheiro_contado === null ? null : decimal(d.dinheiro_contado,'dinheiro_contado',{dinheiro:true});
  const rawResumo=d.resumo_manual===undefined||d.resumo_manual===null?null:objeto(d.resumo_manual,['dinheiro','pix','credito','debito','servicos','vendas','saidas']);
  const resumo=rawResumo?Object.fromEntries(['dinheiro','pix','credito','debito','servicos','vendas','saidas'].map(c=>[c,decimal(rawResumo[c],`resumo_manual.${c}`,{dinheiro:true})])):null;
  if(modo==='manual'&&fonte==='valores'&&formato==='resumo'&&resumo===null) throw new ErroHttp(400,'DADOS_INVALIDOS','Informe os valores do resumo manual.');
  if(modo==='automatico'&&(ids.length||itens.length||resumo)) throw new ErroHttp(400,'DADOS_INVALIDOS','O fechamento automático não recebe itens manuais.');
  if(modo==='manual'&&((fonte==='pagamentos'&&(itens.length||resumo))||(fonte==='valores'&&ids.length)||(formato==='resumo'&&itens.length)||(formato==='detalhado'&&resumo))) throw new ErroHttp(400,'FONTES_MANUAIS_EXCLUSIVAS','Escolha uma única fonte e formato manual.');
  response.json({dados: await model.corrigirFechamento(dataFechamento,request.funcionario!.id,modo,ids,itens,formato as 'resumo'|'detalhado',resumo,dinheiroContado,texto(d.motivo,'motivo'),fonte as 'pagamentos'|'valores')});
}

export async function consultarCorrecoesFechamento(request:Request,response:Response) { response.json({dados:await model.listarCorrecoes(data(request.params.data,'data'))}); }

export async function categoriasDespesa(_request:Request,response:Response) { response.json({dados:await model.listarCategoriasDespesas()}); }
export async function criarCategoriaDespesa(request:Request,response:Response) { const d=objeto(request.body,['nome']); const nome=texto(d.nome,'nome'); if(nome.length>80) throw new ErroHttp(400,'DADOS_INVALIDOS','A categoria aceita até 80 caracteres.'); response.status(201).json({dados:await model.criarCategoriaDespesa(nome)}); }

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
  const categorias = await model.listarCategoriasDespesas();
  if (typeof d.categoria !== 'string' || !categorias.some((c:any)=>c.nome===d.categoria))
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'Categoria de despesa inválida.',
    );
  const vencimento = data(d.vencimento, 'vencimento');
  const valor = decimal(d.valor, 'valor', { positivo: true, dinheiro: true });
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
    model.parcelaPertenceOs(conexao,idCorpo(d.parcela_id)).then((ehOs)=>{
      if(ehOs) throw new ErroHttp(409,'PAGAMENTO_OS_NO_FLUXO_DE_ENTREGA','O pagamento da OS deve ser registrado ao mudar o status para Entregue.');
      return model.registrarPagamento(
      conexao,
      idCorpo(d.parcela_id),
      valor,
      pagamentoForma as 'pix' | 'credito' | 'debito' | 'dinheiro',
      request.funcionario!.id,
      pagoEm?.toISOString(),
      );
    }),
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
