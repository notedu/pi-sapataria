import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ quiet: true });

// O certificado fica no ambiente, sem precisar de um arquivo separado.
const certificado = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n').trim();
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !certificado) {
  throw new Error('Configure DATABASE_URL e DATABASE_CA_CERT no .env.');
}

// Esses parâmetros substituiriam a configuração SSL abaixo no driver pg.
if (/[?&](sslmode|sslrootcert|sslcert|sslkey)=/i.test(databaseUrl)) {
  throw new Error('Remova sslmode, sslrootcert, sslcert e sslkey da DATABASE_URL; o SSL é configurado no db.ts.');
}

// Compartilha as conexões entre as consultas da API.
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { ca: certificado, rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
});

pool.on('error', () => {
  console.error('Uma conexão ociosa com o banco foi interrompida.');
});
