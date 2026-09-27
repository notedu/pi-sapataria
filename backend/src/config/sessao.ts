import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    autenticacao?: { funcionarioId: number; versao: number; expiraEm: number };
  }
}

export const duracaoSessao = 8 * 60 * 60 * 1000;
export const nomeCookie = 'sapataria.sid';
export const producao = process.env.NODE_ENV === 'production';
export const segredoSessao = process.env.SESSION_SECRET ?? '';
if (Buffer.byteLength(segredoSessao) < 32) {
  throw new Error('Configure SESSION_SECRET com pelo menos 32 bytes aleatórios.');
}

const PgStore = connectPgSimple(session);
export const armazenarSessoes = new PgStore({
  pool,
  schemaName: 'sapataria',
  tableName: 'sessoes',
  createTableIfMissing: false,
  disableTouch: true,
  errorLog: () => console.error('Não foi possível acessar o armazenamento de sessões.'),
});

export const opcoesCookie = { httpOnly: true, secure: producao, sameSite: 'lax' as const, path: '/' };

export const gerenciarSessao = session({
  name: nomeCookie,
  secret: segredoSessao,
  store: armazenarSessoes,
  resave: false,
  saveUninitialized: false,
  cookie: { ...opcoesCookie, maxAge: duracaoSessao },
});
