import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import pool from '../config/db.js';
import { hashPassword } from '../services/password.js';

// Run from backend; credentials are read from its ignored .env file.
try {
  const generated = process.argv.includes('--generate-password');
  const password = generated ? randomBytes(18).toString('base64url') : process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('Defina ADMIN_PASSWORD no backend/.env com 12 a 128 caracteres.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(await readFile(new URL('./migrations/001_auth.sql', import.meta.url), 'utf8'));
    const result = await client.query(
      `INSERT INTO usuarios (usuario, nome, senha_hash, perfil)
       VALUES ('admin', 'Administrador', $1, 'admin')
       ON CONFLICT (usuario) DO NOTHING RETURNING id`,
      [await hashPassword(password)],
    );
    await client.query('COMMIT');
    console.log(result.rowCount ? 'Administrador criado. Usuário: admin.' : 'Admin já existe; senha preservada.');
    if (result.rowCount && generated) console.log(`Senha inicial (guarde em local seguro): ${password}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao preparar autenticação.');
  process.exitCode = 1;
} finally { await pool.end(); }
