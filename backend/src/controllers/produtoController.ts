import { decimal } from '../utils/operacoes';
import type { Request, Response } from 'express';
import * as produtoModel from '../models/produtoModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await produtoModel.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const registro = await produtoModel.buscar(idValido(request.params.id));
  if (!registro) throw new ErroHttp(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.');
  response.json({ dados: registro });
}

function validar(corpo: unknown): produtoModel.DadosProduto {
  const d = objeto(corpo, ['nome', 'categoria', 'preco_custo', 'preco_venda']);
  return {
    nome: texto(d.nome, 'nome'),
    categoria: texto(d.categoria, 'categoria'),
    preco_custo: decimal(d.preco_custo, 'preco_custo', { dinheiro: true }),
    preco_venda: decimal(d.preco_venda, 'preco_venda', { dinheiro: true }),
  };
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  response.status(201).json({ dados: await produtoModel.criar(validar(request.body)) });
}

export async function atualizar(request: Request, response: Response): Promise<void> {
  const registro = await produtoModel.atualizar(idValido(request.params.id), validar(request.body));
  if (!registro) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Cadastro não encontrado.');
  response.json({ dados: registro });
}

export async function excluir(request: Request, response: Response): Promise<void> {
  await produtoModel.excluir(idValido(request.params.id));
  response.status(204).end();
}
