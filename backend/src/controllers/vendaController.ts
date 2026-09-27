import { idCorpo, decimal, pagamento, lista } from '../utils/operacoes';
import type { Request, Response } from 'express';
import * as itemVendaModel from '../models/itemVendaModel';
import * as vendaModel from '../models/vendaModel';
import { ErroHttp, idValido, objeto } from '../utils/validacao';

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await vendaModel.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const registro = await vendaModel.buscar(idValido(request.params.id));
  if (!registro) throw new ErroHttp(404, 'VENDA_NAO_ENCONTRADA', 'Venda não encontrada.');
  response.json({ dados: registro });
}

export async function listarItens(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  // Uma lista vazia é diferente de uma venda/OS que não existe.
  if (!await vendaModel.buscar(id)) {
    throw new ErroHttp(404, 'VENDA_NAO_ENCONTRADA', 'Venda não encontrada.');
  }
  response.json({ dados: await itemVendaModel.listarPorVenda(id) });
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['forma_pagamento', 'itens']);
  const itens = lista(d.itens, 'itens').map((valor) => {
    const item = objeto(valor, ['produto_id', 'quantidade']);
    return { produto_id: idCorpo(item.produto_id), quantidade: decimal(item.quantidade, 'quantidade', { positivo: true, inteiro: true }) };
  });
  response.status(201).json({ dados: await vendaModel.criar(request.funcionario!.id, pagamento(d.forma_pagamento)!, itens) });
}

export async function cancelar(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['itens_devolvidos']);
  const itens = lista(d.itens_devolvidos, 'itens_devolvidos', true).map((valor) => {
    const item = objeto(valor, ['item_venda_id', 'quantidade']);
    return { item_venda_id: idCorpo(item.item_venda_id), quantidade: decimal(item.quantidade, 'quantidade', { positivo: true, inteiro: true }) };
  });
  if (new Set(itens.map((item) => item.item_venda_id)).size !== itens.length) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe cada item devolvido uma única vez.');
  }
  response.json({ dados: await vendaModel.cancelar(idValido(request.params.id), itens) });
}
