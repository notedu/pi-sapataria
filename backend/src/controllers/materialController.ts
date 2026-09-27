import { decimal } from '../utils/operacoes';
import type { Request, Response } from 'express';
import * as materialModel from '../models/materialModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await materialModel.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const registro = await materialModel.buscar(idValido(request.params.id));
  if (!registro) throw new ErroHttp(404, 'MATERIAL_NAO_ENCONTRADO', 'Material não encontrado.');
  response.json({ dados: registro });
}

function validar(corpo: unknown): materialModel.DadosMaterial {
  const d = objeto(corpo, ['nome', 'categoria', 'unidade', 'quantidade_minima', 'custo']);
  return {
    nome: texto(d.nome, 'nome'),
    categoria: texto(d.categoria, 'categoria'),
    unidade: texto(d.unidade, 'unidade'),
    quantidade_minima: decimal(d.quantidade_minima, 'quantidade_minima'),
    custo: decimal(d.custo, 'custo', { dinheiro: true }),
  };
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  response.status(201).json({ dados: await materialModel.criar(validar(request.body)) });
}

export async function atualizar(request: Request, response: Response): Promise<void> {
  const registro = await materialModel.atualizar(idValido(request.params.id), validar(request.body));
  if (!registro) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Cadastro não encontrado.');
  response.json({ dados: registro });
}

export async function excluir(request: Request, response: Response): Promise<void> {
  await materialModel.excluir(idValido(request.params.id));
  response.status(204).end();
}
