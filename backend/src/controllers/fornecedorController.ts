import type { Request, Response } from 'express';
import * as model from '../models/fornecedorModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';
import { idCorpo } from '../utils/operacoes';

export async function listar(_req: Request, res: Response) { res.json({ dados: await model.listar() }); }
export async function cadastrar(req: Request, res: Response) {
  const d = objeto(req.body, ['nome']);
  res.status(201).json({ dados: await model.salvar(texto(d.nome, 'nome')) });
}
export async function atualizar(req: Request, res: Response) {
  const d = objeto(req.body, ['nome']);
  res.json({ dados: await model.salvar(texto(d.nome, 'nome'), idValido(req.params.id)) });
}
export async function excluir(req: Request, res: Response) { await model.excluir(idValido(req.params.id)); res.status(204).end(); }
function tipo(valor: unknown): model.TipoItem {
  if (valor !== 'produtos' && valor !== 'materiais') throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Tipo de item inválido.');
  return valor;
}
export async function listarVinculos(req: Request, res: Response) { res.json({ dados: await model.vinculos(tipo(req.params.tipo)) }); }
export async function associar(req: Request, res: Response) {
  const d = objeto(req.body, ['fornecedores_ids']);
  if (!Array.isArray(d.fornecedores_ids)) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe a lista de fornecedores.');
  const ids = d.fornecedores_ids.map(idCorpo);
  if (new Set(ids).size !== ids.length) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Não repita fornecedores.');
  await model.associar(tipo(req.params.tipo), idValido(req.params.id), ids);
  res.status(204).end();
}
