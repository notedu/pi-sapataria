import type { Request, Response } from 'express';
import * as model from '../models/compraEstoqueModel';
import { decimal, idCorpo, lista } from '../utils/operacoes';
import { ErroHttp, objeto } from '../utils/validacao';

export async function listar(_request: Request, response: Response) {
  response.json({ dados: await model.listar() });
}

export async function cadastrar(request: Request, response: Response) {
  const dados = objeto(request.body, ['fornecedor_id', 'itens']);
  const fornecedorId = idCorpo(dados.fornecedor_id);
  const itens = lista(dados.itens, 'itens') as unknown[];
  if (itens.length > 100)
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'Cada compra pode conter até 100 itens.',
    );
  const chaves = new Set<string>();
  const validados = itens.map((valor) => {
    const item = objeto(valor, [
      'material_id',
      'produto_id',
      'quantidade',
      'preco_unitario',
    ]);
    const temMaterial =
      item.material_id !== null && item.material_id !== undefined;
    const temProduto =
      item.produto_id !== null && item.produto_id !== undefined;
    if (temMaterial === temProduto)
      throw new ErroHttp(
        400,
        'DADOS_INVALIDOS',
        'Cada linha deve selecionar exatamente um Material ou Produto.',
      );
    const materialId = temMaterial ? idCorpo(item.material_id) : null;
    const produtoId = temProduto ? idCorpo(item.produto_id) : null;
    const chave = `${temMaterial ? 'm' : 'p'}:${materialId ?? produtoId}`;
    if (chaves.has(chave))
      throw new ErroHttp(
        400,
        'DADOS_INVALIDOS',
        'Remova itens repetidos da compra.',
      );
    chaves.add(chave);
    return {
      material_id: materialId,
      produto_id: produtoId,
      quantidade: decimal(item.quantidade, 'quantidade', {
        positivo: true,
        inteiro: temProduto,
      }),
      preco_unitario: decimal(item.preco_unitario, 'preco_unitario', {
        dinheiro: true,
      }),
    };
  });
  response
    .status(201)
    .json({
      dados: await model.criar(
        fornecedorId,
        validados,
        request.funcionario!.id,
      ),
    });
}
