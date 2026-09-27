import type { Request, RequestHandler } from 'express';
import type { Funcionario } from '../models/funcionarioModel';
import { buscarAcesso, dadosPublicos } from '../models/funcionarioModel';
import { nomeCookie, opcoesCookie } from '../config/sessao';
import { ErroHttp } from '../utils/validacao';

declare global {
  namespace Express {
    interface Request { funcionario?: Funcionario }
  }
}

export function encerrarSessao(request: Request): Promise<void> {
  return new Promise((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
}

export const exigirLogin: RequestHandler = async (request, response, next) => {
  const acesso = request.session.autenticacao;
  const funcionario = acesso && acesso.expiraEm > Date.now() ? await buscarAcesso(acesso.funcionarioId) : undefined;
  if (!funcionario?.ativo || funcionario.versao_acesso !== acesso?.versao) {
    await encerrarSessao(request);
    response.clearCookie(nomeCookie, opcoesCookie);
    throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Faça login para acessar este recurso.');
  }
  request.funcionario = dadosPublicos(funcionario);
  next();
};

export const exigirAdministrador: RequestHandler = (request, _response, next) => {
  if (request.funcionario?.perfil !== 'administrador') {
    throw new ErroHttp(403, 'ACESSO_NEGADO', 'Este recurso é exclusivo do administrador.');
  }
  next();
};
