import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { ErroHttp } from '../utils/validacao';

export function novoTokenCsrf(): string {
  return randomBytes(32).toString('hex');
}

export const fornecerCsrf: RequestHandler = (request, response) => {
  request.session.csrfToken ??= novoTokenCsrf();
  response.json({ csrfToken: request.session.csrfToken });
};

export const verificarCsrf: RequestHandler = (request, _response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
  const recebido = request.get('X-CSRF-Token');
  const esperado = request.session.csrfToken;
  if (!recebido || !esperado || !/^[a-f0-9]{64}$/.test(recebido) || recebido.length !== esperado.length || !timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))) {
    throw new ErroHttp(403, 'CSRF_INVALIDO', 'Obtenha um token em GET /api/v1/auth/csrf e envie o cabeçalho X-CSRF-Token.');
  }
  next();
};
