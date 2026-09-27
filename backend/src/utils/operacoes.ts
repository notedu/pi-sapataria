import { ErroHttp, idValido, objeto, texto } from './validacao';

export function idCorpo(valor: unknown): number {
  return idValido(typeof valor === 'number' ? String(valor) : valor);
}

export function decimal(valor: unknown, campo: string, opcoes: { positivo?: boolean; inteiro?: boolean; dinheiro?: boolean } = {}): string {
  if (typeof valor === 'number' && !Number.isSafeInteger(Math.trunc(valor))) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Envie ${campo} como string decimal para preservar a precisão.`);
  }
  const representacao = typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : valor;
  if (typeof representacao !== 'string' || !/^\d+(\.\d+)?$/.test(representacao) || representacao.length > 100) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Informe ${campo} como decimal não negativo, usando ponto.`);
  }
  const [parteInteira, parteFracionaria = ''] = representacao.split('.');
  const inteiro = parteInteira!.replace(/^0+(?=\d)/, '');
  const fracao = parteFracionaria.replace(/0+$/, '');
  if ((opcoes.positivo && inteiro === '0' && !fracao) || (opcoes.inteiro && fracao) || (opcoes.dinheiro && fracao.length > 2)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Quantidade ou precisão inválida para ${campo}.`);
  }
  return opcoes.dinheiro ? `${inteiro}.${fracao.padEnd(2, '0')}` : `${inteiro}${fracao ? `.${fracao}` : ''}`;
}

export function opcional(valor: unknown, campo: string): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  return texto(valor, campo);
}

export function pagamento(valor: unknown, podeOmitir = false): string | null {
  if (podeOmitir && (valor === undefined || valor === null)) return null;
  if (typeof valor !== 'string' || !['pix', 'credito', 'debito', 'dinheiro'].includes(valor)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Forma de pagamento: pix, credito, debito ou dinheiro.');
  }
  return valor;
}

export function dadosOs(corpo: unknown) {
  const d = objeto(corpo, ['cliente_id', 'responsavel_id', 'descricao_calcado', 'servico', 'valor', 'prazo_entrega', 'forma_pagamento', 'observacoes']);
  const prazo = opcional(d.prazo_entrega, 'prazo_entrega');
  if (prazo && (!/^\d{4}-\d{2}-\d{2}$/.test(prazo) || prazo.startsWith('0000') || !Number.isFinite(Date.parse(prazo)) || new Date(prazo).toISOString().slice(0, 10) !== prazo)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe prazo_entrega como uma data válida YYYY-MM-DD.');
  }
  return {
    cliente_id: idCorpo(d.cliente_id), responsavel_id: idCorpo(d.responsavel_id),
    descricao_calcado: texto(d.descricao_calcado, 'descricao_calcado'), servico: texto(d.servico, 'servico'),
    valor: decimal(d.valor, 'valor', { dinheiro: true }), prazo_entrega: prazo,
    forma_pagamento: pagamento(d.forma_pagamento, true), observacoes: opcional(d.observacoes, 'observacoes'),
  };
}

export function lista(corpo: unknown, campo: string, permitirVazia = false): unknown[] {
  if (!Array.isArray(corpo) || (!permitirVazia && !corpo.length)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Informe ${campo} como uma lista${permitirVazia ? '' : ' não vazia'}.`);
  }
  return corpo;
}
