import { pool } from '../config/db';

// O pg retorna numeric como texto para preservar a precisão dos valores.
export interface MaterialOs {
  id: number;
  ordem_servico_id: number;
  material_id: number;
  quantidade_usada: string;
  quantidade_devolvida: string;
  quantidade_restante: string;
}

export async function listarPorOrdemServico(id: number): Promise<MaterialOs[]> {
  const resultado = await pool.query<MaterialOs>(
    `SELECT uso.id, uso.ordem_servico_id, uso.material_id,
            uso.quantidade_usada::text AS quantidade_usada,
            COALESCE(SUM(devolucao.quantidade),0)::text AS quantidade_devolvida,
            (uso.quantidade_usada - COALESCE(SUM(devolucao.quantidade),0))::text AS quantidade_restante
       FROM sapataria.materiais_os AS uso
       LEFT JOIN sapataria.movimentacoes_estoque AS origem
         ON origem.material_os_id=uso.id
       LEFT JOIN sapataria.movimentacoes_estoque AS devolucao
         ON devolucao.reversao_de_id=origem.id
      WHERE uso.ordem_servico_id = $1
      GROUP BY uso.id ORDER BY uso.id`,
    [id],
  );
  return resultado.rows;
}
