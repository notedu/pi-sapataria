import { createHmac } from 'node:crypto';
import { pool } from '../config/db';
import { segredoSessao } from '../config/sessao';
import { ErroHttp } from '../utils/validacao';

function chave(tipo: string, valor: string): string {
  return createHmac('sha256', segredoSessao).update(`${tipo}:${valor}`).digest('hex');
}

async function consumir(chave: string, limite: number): Promise<void> {
  const resultado = await pool.query<{ tentativas: number }>(
    `INSERT INTO sapataria.tentativas_login (chave, tentativas, expira_em)
     VALUES ($1, 1, now() + interval '15 minutes')
     ON CONFLICT (chave) DO UPDATE SET
       tentativas = CASE WHEN tentativas_login.expira_em <= now() THEN 1 ELSE tentativas_login.tentativas + 1 END,
       expira_em = CASE WHEN tentativas_login.expira_em <= now() THEN now() + interval '15 minutes' ELSE tentativas_login.expira_em END
     RETURNING tentativas`, [chave],
  );
  if (resultado.rows[0]!.tentativas > limite) {
    throw new ErroHttp(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas de login. Aguarde até 15 minutos e tente novamente.');
  }
}

export async function limitarTentativas(usuario: string, ip: string): Promise<void> {
  await pool.query('DELETE FROM sapataria.tentativas_login WHERE expira_em <= now()');
  await consumir(chave('ip', ip), 50);
  await consumir(chave('usuario', usuario), 10);
}

export async function limparTentativasUsuario(usuario: string): Promise<void> {
  await pool.query('DELETE FROM sapataria.tentativas_login WHERE chave = $1', [chave('usuario', usuario)]);
}
