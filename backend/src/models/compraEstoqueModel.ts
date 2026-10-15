import { pool } from '../config/db';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { movimentar } from './estoqueModel';

export type ItemCompra = { material_id: number | null; produto_id: number | null; quantidade: string; preco_unitario: string };

const consulta = `SELECT c.id, c.fornecedor_id, f.nome AS fornecedor_nome, c.registrada_em,
  COALESCE(json_agg(json_build_object(
    'id', ic.id, 'material_id', ic.material_id, 'produto_id', ic.produto_id,
    'item_nome', COALESCE(m.nome, p.nome), 'quantidade', ic.quantidade,
    'preco_unitario', ic.preco_unitario
  ) ORDER BY ic.id) FILTER (WHERE ic.id IS NOT NULL), '[]'::json) AS itens
  FROM sapataria.compras_estoque c
  JOIN sapataria.fornecedores f ON f.id = c.fornecedor_id
  LEFT JOIN sapataria.itens_compra_estoque ic ON ic.compra_id = c.id
  LEFT JOIN sapataria.materiais m ON m.id = ic.material_id
  LEFT JOIN sapataria.produtos p ON p.id = ic.produto_id`;

export async function listar() {
  return (await pool.query(`${consulta} GROUP BY c.id, f.nome ORDER BY c.registrada_em DESC, c.id DESC`)).rows;
}

export async function criar(fornecedorId: number, itens: ItemCompra[]) {
  return emTransacao(async conexao => {
    const fornecedor = await conexao.query('SELECT id FROM sapataria.fornecedores WHERE id=$1 FOR KEY SHARE', [fornecedorId]);
    if (!fornecedor.rowCount) throw new ErroHttp(400, 'FORNECEDOR_INVALIDO', 'Selecione um fornecedor cadastrado.');
    const compra = await conexao.query('INSERT INTO sapataria.compras_estoque (fornecedor_id) VALUES ($1) RETURNING id', [fornecedorId]);
    const compraId = compra.rows[0].id as number;
    for (const item of itens) {
      const tipo = item.material_id !== null ? 'materiais' : 'produtos';
      const itemId = item.material_id ?? item.produto_id;
      const encontrado = await conexao.query(`SELECT id FROM sapataria.${tipo} WHERE id=$1 FOR UPDATE`, [itemId]);
      if (!encontrado.rowCount) throw new ErroHttp(404, 'ITEM_NAO_ENCONTRADO', 'Um dos itens da compra não existe.');
      const salvo = await conexao.query(
        `INSERT INTO sapataria.itens_compra_estoque (compra_id, material_id, produto_id, quantidade, preco_unitario)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [compraId, item.material_id, item.produto_id, item.quantidade, item.preco_unitario],
      );
      await movimentar(conexao, {
        tipo: 'entrada', material_id: item.material_id, produto_id: item.produto_id,
        quantidade: item.quantidade, motivo: `Compra #${compraId}`, item_compra_id: salvo.rows[0].id,
      });
    }
    const registro = await conexao.query(`${consulta} WHERE c.id=$1 GROUP BY c.id, f.nome`, [compraId]);
    return registro.rows[0];
  });
}
