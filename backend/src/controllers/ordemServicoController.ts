import { dadosOs, idCorpo, decimal } from '../utils/operacoes';
import type { Request, Response } from 'express';
import * as materialOsModel from '../models/materialOsModel';
import * as ordemServicoModel from '../models/ordemServicoModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await ordemServicoModel.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const registro = await ordemServicoModel.buscar(idValido(request.params.id));
  if (!registro) throw new ErroHttp(404, 'OS_NAO_ENCONTRADA', 'Ordem de serviço não encontrada.');
  response.json({ dados: registro });
}

export async function listarMateriais(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  // Uma lista vazia é diferente de uma venda/OS que não existe.
  if (!await ordemServicoModel.buscar(id)) {
    throw new ErroHttp(404, 'OS_NAO_ENCONTRADA', 'Ordem de serviço não encontrada.');
  }
  response.json({ dados: await materialOsModel.listarPorOrdemServico(id) });
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  response.status(201).json({ dados: await ordemServicoModel.criar(dadosOs(request.body)) });
}

export async function atualizar(request: Request, response: Response): Promise<void> {
  response.json({ dados: await ordemServicoModel.atualizar(idValido(request.params.id), dadosOs(request.body)) });
}

export async function mudarStatus(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['status']);
  if (typeof d.status !== 'string' || !['Aberta', 'Em andamento', 'Pronta', 'Entregue', 'Cancelada'].includes(d.status)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe um status válido da OS.');
  }
  response.json({ dados: await ordemServicoModel.mudarStatus(idValido(request.params.id), d.status) });
}

export async function consumir(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['material_id', 'quantidade_usada']);
  response.status(201).json({ dados: await ordemServicoModel.consumir(idValido(request.params.id),
    idCorpo(d.material_id), decimal(d.quantidade_usada, 'quantidade_usada', { positivo: true })) });
}

export async function devolverMaterial(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['quantidade', 'motivo']);
  response.status(201).json({ dados: await ordemServicoModel.devolverMaterial(idValido(request.params.id),
    idValido(request.params.usoId), decimal(d.quantidade, 'quantidade', { positivo: true }), texto(d.motivo, 'motivo')) });
}
