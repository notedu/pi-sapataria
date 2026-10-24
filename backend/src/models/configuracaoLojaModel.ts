import { pool } from '../config/db';

export type DadosLoja = { endereco: string };

export async function consultarLoja(): Promise<DadosLoja> {
  const resultado = await pool.query<DadosLoja>(
    'SELECT endereco FROM sapataria.configuracoes_loja WHERE id = 1',
  );
  return resultado.rows[0] ?? { endereco: '' };
}

export async function atualizarEndereco(endereco: string): Promise<DadosLoja> {
  const resultado = await pool.query<DadosLoja>(
    `INSERT INTO sapataria.configuracoes_loja (id, endereco) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET endereco = EXCLUDED.endereco
     RETURNING endereco`,
    [endereco],
  );
  return resultado.rows[0]!;
}
