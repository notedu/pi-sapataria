import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface MaterialOs {
  id: number;
  ordem_servico_id: number;
  material_id: number;
  quantidade_usada: string;
}

const colunas = `id, ordem_servico_id, material_id, quantidade_usada`;

export async function listarPorOrdemServico(id: number): Promise<MaterialOs[]> {
  const resultado = await pool.query<MaterialOs>(
    `SELECT ${colunas} FROM sapataria.materiais_os WHERE ordem_servico_id = $1 ORDER BY id`, [id],
  );
  return resultado.rows;
}
