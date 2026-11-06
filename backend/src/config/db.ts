import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ quiet: true });

const host = process.env.DATABASE_HOST;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;
const port = Number(process.env.DATABASE_PORT ?? 5432);

if (!host || !user || password === undefined || !database) {
  throw new Error(
    'Configure DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME no .env.',
  );
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DATABASE_PORT deve ser um número inteiro entre 1 e 65535.');
}

const sslConfigurado = process.env.DATABASE_SSL ?? 'false';
if (!['true', 'false'].includes(sslConfigurado.toLowerCase())) {
  throw new Error('DATABASE_SSL deve ser true ou false.');
}

const sslHabilitado = sslConfigurado.toLowerCase() === 'true';
const certificadoCa = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n').trim();

// Compartilha as conexões entre as consultas da API.
export const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  ssl: sslHabilitado
    ? {
        rejectUnauthorized: true,
        ...(certificadoCa ? { ca: certificadoCa } : {}),
      }
    : false,
  connectionTimeoutMillis: 8000,
});

pool.on('error', () => {
  console.error('Uma conexão ociosa com o banco foi interrompida.');
});
