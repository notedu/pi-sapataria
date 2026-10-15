import type { Request, Response } from 'express';
import * as model from '../models/fornecedorModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';
import { fornecedoresIds } from '../utils/fornecedores';
import { cnpjValido } from '../utils/cnpj';

export function validarFornecedor(corpo: unknown): model.DadosFornecedor {
  const d = objeto(corpo, ['nome', ...model.camposOpcionais]);
  const dados: model.DadosFornecedor = { nome: texto(d.nome, 'nome') };
  for (const campo of model.camposOpcionais) {
    if (d[campo] === undefined) continue;
    if (d[campo] === null || (typeof d[campo] === 'string' && !d[campo].trim())) dados[campo] = null;
    else dados[campo] = texto(d[campo], campo);
  }
  if (dados.cnpj) {
    dados.cnpj = dados.cnpj.toUpperCase().replace(/[.\/\-\s]/g, '');
    if (!cnpjValido(dados.cnpj)) throw new ErroHttp(400, 'CNPJ_INVALIDO', 'Informe um CNPJ com formato e dígitos verificadores válidos.');
  }
  if (dados.cep) {
    dados.cep = dados.cep.replace(/[\s-]/g, '');
    if (!/^\d{8}$/.test(dados.cep)) throw new ErroHttp(400, 'CEP_INVALIDO', 'Informe um CEP com 8 números.');
  }
  if (dados.telefone) {
    dados.telefone = dados.telefone.replace(/[()\s-]/g, '');
    if (!/^\d{10,11}$/.test(dados.telefone)) throw new ErroHttp(400, 'TELEFONE_INVALIDO', 'Informe telefone com DDD e 10 ou 11 números.');
  }
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) throw new ErroHttp(400, 'EMAIL_INVALIDO', 'Informe um e-mail em formato válido.');
  return dados;
}

export async function listar(_req: Request, res: Response) { res.json({ dados: await model.listar() }); }
export async function cadastrar(req: Request, res: Response) {
  res.status(201).json({ dados: await model.salvar(validarFornecedor(req.body)) });
}
export async function atualizar(req: Request, res: Response) {
  res.json({ dados: await model.salvar(validarFornecedor(req.body), idValido(req.params.id)) });
}
export async function excluir(req: Request, res: Response) { await model.excluir(idValido(req.params.id)); res.status(204).end(); }
function tipo(valor: unknown): model.TipoItem {
  if (valor !== 'produtos' && valor !== 'materiais') throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Tipo de item inválido.');
  return valor;
}
export async function listarVinculos(req: Request, res: Response) { res.json({ dados: await model.vinculos(tipo(req.params.tipo)) }); }
export async function associar(req: Request, res: Response) {
  const d = objeto(req.body, ['fornecedores_ids']);
  const ids = fornecedoresIds(d.fornecedores_ids);
  if (!ids) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe a lista de fornecedores.');
  await model.associar(tipo(req.params.tipo), idValido(req.params.id), ids);
  res.status(204).end();
}
