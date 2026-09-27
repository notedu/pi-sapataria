import type { PoolClient } from 'pg';
import { pool } from './db';

// Todas as consultas da operação usam a mesma conexão: ou tudo confirma, ou nada.
export async function emTransacao<T>(operacao: (conexao: PoolClient) => Promise<T>): Promise<T> {
  const conexao = await pool.connect();
  try {
    await conexao.query('BEGIN');
    const resultado = await operacao(conexao);
    await conexao.query('COMMIT');
    return resultado;
  } catch (erro) {
    await conexao.query('ROLLBACK');
    throw erro;
  } finally {
    conexao.release();
  }
}
