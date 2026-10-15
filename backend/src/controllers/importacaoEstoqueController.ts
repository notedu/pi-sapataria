import type { Request, Response } from 'express';
import * as model from '../models/importacaoEstoqueModel';
import { decimal, lista } from '../utils/operacoes';
import { ErroHttp, objeto, texto } from '../utils/validacao';

export async function importar(request: Request, response: Response) {
  const corpo = objeto(request.body, ['itens']);
  const itens = lista(corpo.itens, 'itens') as unknown[];
  if (itens.length > 500) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O arquivo pode conter até 500 linhas de itens.');
  const validados = itens.map((valor, indice) => {
    const dados = objeto(valor, ['tipo', 'nome', 'categoria', 'unidade', 'quantidade', 'quantidade_minima', 'custo', 'preco_custo', 'preco_venda']);
    if (dados.tipo !== 'material' && dados.tipo !== 'produto') throw new ErroHttp(400, 'DADOS_INVALIDOS', `Tipo inválido na linha ${indice + 2}.`);
    const comum = {
      tipo: dados.tipo,
      nome: texto(dados.nome, `nome na linha ${indice + 2}`),
      categoria: texto(dados.categoria, `categoria na linha ${indice + 2}`),
      quantidade: decimal(dados.quantidade, `quantidade na linha ${indice + 2}`, { inteiro: dados.tipo === 'produto' }),
      quantidade_minima: decimal(dados.quantidade_minima, `quantidade_minima na linha ${indice + 2}`, { inteiro: dados.tipo === 'produto' }),
    };
    if (dados.tipo === 'material') return {
      ...comum, tipo: 'material' as const, unidade: texto(dados.unidade, `unidade na linha ${indice + 2}`),
      custo: decimal(dados.custo, `custo na linha ${indice + 2}`, { dinheiro: true }),
    };
    return {
      ...comum, tipo: 'produto' as const,
      preco_custo: decimal(dados.preco_custo, `preco_custo na linha ${indice + 2}`, { dinheiro: true }),
      preco_venda: decimal(dados.preco_venda, `preco_venda na linha ${indice + 2}`, { dinheiro: true }),
    };
  });
  response.status(201).json({ dados: await model.importar(validados) });
}
