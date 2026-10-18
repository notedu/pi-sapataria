import type { Request, Response } from 'express';
import * as model from '../models/categoriaEstoqueModel';
import { ErroHttp, objeto, texto } from '../utils/validacao';

function tipo(valor: unknown): model.TipoCategoriaEstoque {
  if (valor !== 'produtos' && valor !== 'materiais') throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Tipo deve ser produtos ou materiais.');
  return valor;
}

export async function listar(request: Request, response: Response): Promise<void> {
  const valor = request.query.tipo;
  const filtro = valor === undefined ? undefined : tipo(valor);
  response.json({ dados: await model.listar(filtro) });
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  const dados = objeto(request.body, ['tipo', 'nome']);
  response.status(201).json({ dados: await model.criar(tipo(dados.tipo), texto(dados.nome, 'nome')) });
}
