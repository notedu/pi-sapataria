import type { Request, Response } from 'express';
import * as atividadeModel from '../models/atividadeModel';
import { ErroHttp, idValido } from '../utils/validacao';

function dataFiltro(valor: unknown, campo: string): string | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(`${valor}T00:00:00Z`))) {
    throw new ErroHttp(400, 'FILTRO_INVALIDO', `Informe ${campo} no formato AAAA-MM-DD.`);
  }
  return valor;
}

export async function listar(request: Request, response: Response): Promise<void> {
  const de = dataFiltro(request.query.de, 'de');
  const ate = dataFiltro(request.query.ate, 'ate');
  const funcionarioId = request.query.funcionario_id === undefined ? undefined : idValido(request.query.funcionario_id);
  const acao = typeof request.query.acao === 'string' ? request.query.acao.slice(0, 80) : undefined;
  response.json({ dados: await atividadeModel.listar(request.funcionario!.perfil, request.funcionario!.id, { de, ate, funcionarioId, acao }) });
}

export async function notificacoes(request: Request, response: Response): Promise<void> {
  response.json({ dados: await atividadeModel.listarNotificacoes(request.funcionario!.id) });
}

export async function quantidadeNaoLidas(request: Request, response: Response): Promise<void> {
  response.json({ dados: { quantidade: await atividadeModel.contarNaoLidas(request.funcionario!.id) } });
}

export async function marcarLida(request: Request, response: Response): Promise<void> {
  if (!await atividadeModel.marcarLida(idValido(request.params.id), request.funcionario!.id)) {
    throw new ErroHttp(404, 'NOTIFICACAO_NAO_ENCONTRADA', 'Notificação não encontrada ou já lida.');
  }
  response.status(204).end();
}

export async function marcarTodasLidas(request: Request, response: Response): Promise<void> {
  await atividadeModel.marcarTodasLidas(request.funcionario!.id);
  response.status(204).end();
}
