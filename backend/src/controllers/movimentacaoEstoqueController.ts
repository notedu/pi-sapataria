import { idCorpo, decimal } from '../utils/operacoes';
import type { Request, Response } from 'express';
import * as movimentacaoEstoqueModel from '../models/movimentacaoEstoqueModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await movimentacaoEstoqueModel.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const registro = await movimentacaoEstoqueModel.buscar(idValido(request.params.id));
  if (!registro) throw new ErroHttp(404, 'MOVIMENTACAO_NAO_ENCONTRADA', 'Movimentação não encontrada.');
  response.json({ dados: registro });
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['tipo', 'material_id', 'produto_id', 'quantidade', 'motivo']);
  if (d.tipo !== 'entrada' && d.tipo !== 'saida') throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Tipo deve ser entrada ou saida.');
  const material = d.material_id !== null && d.material_id !== undefined;
  const produto = d.produto_id !== null && d.produto_id !== undefined;
  if (material === produto) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe exatamente um entre material_id e produto_id.');
  response.status(201).json({ dados: await movimentacaoEstoqueModel.criar({
    tipo: d.tipo, material_id: material ? idCorpo(d.material_id) : null, produto_id: produto ? idCorpo(d.produto_id) : null,
    quantidade: decimal(d.quantidade, 'quantidade', { positivo: true, inteiro: produto }), motivo: texto(d.motivo, 'motivo'),
  }) });
}

export async function estornar(request: Request, response: Response): Promise<void> {
  const d = objeto(request.body, ['motivo']);
  response.status(201).json({ dados: await movimentacaoEstoqueModel.estornar(idValido(request.params.id), texto(d.motivo, 'motivo')) });
}
