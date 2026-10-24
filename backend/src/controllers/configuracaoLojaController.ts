import type { Request, Response } from 'express';
import * as loja from '../models/configuracaoLojaModel';
import { ErroHttp, objeto } from '../utils/validacao';

export async function consultar(
  _request: Request,
  response: Response,
): Promise<void> {
  response.json({ dados: await loja.consultarLoja() });
}

export async function atualizar(
  request: Request,
  response: Response,
): Promise<void> {
  const dados = objeto(request.body, ['endereco']);
  if (typeof dados.endereco !== 'string' || dados.endereco.length > 500) {
    throw new ErroHttp(
      400,
      'DADOS_INVALIDOS',
      'O endereço deve ter até 500 caracteres.',
    );
  }
  response.json({ dados: await loja.atualizarEndereco(dados.endereco.trim()) });
}
