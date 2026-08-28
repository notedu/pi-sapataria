import pool from "../config/db.js";

export interface EstoqueProdutoVenda {
  id?: number;
  nome: string;
  descricao?: string;
  quantidade?: number;
  valor_custo?: number;
  valor_venda: number;
  categoria?: string;
}

export async function listarProdutosVenda() {
  const result = await pool.query(
    "SELECT * FROM estoque_produtos_venda ORDER BY id",
  );
  return result.rows;
}

export async function buscarProdutoVendaPorId(id: number) {
  const result = await pool.query(
    "SELECT * FROM estoque_produtos_venda WHERE id = $1",
    [id],
  );
  return result.rows[0];
}

export async function criarProdutoVenda(produto: EstoqueProdutoVenda) {
  const { nome, descricao, quantidade, valor_custo, valor_venda, categoria } =
    produto;
  const result = await pool.query(
    `INSERT INTO estoque_produtos_venda
      (nome, descricao, quantidade, valor_custo, valor_venda, categoria)
     VALUES ($1, $2, COALESCE($3, 0), $4, $5, $6)
     RETURNING *`,
    [nome, descricao, quantidade, valor_custo, valor_venda, categoria],
  );
  return result.rows[0];
}

export async function atualizarProdutoVenda(
  id: number,
  produto: EstoqueProdutoVenda,
) {
  const { nome, descricao, quantidade, valor_custo, valor_venda, categoria } =
    produto;
  const result = await pool.query(
    `UPDATE estoque_produtos_venda
     SET nome = $1, descricao = $2, quantidade = $3, valor_custo = $4,
         valor_venda = $5, categoria = $6, atualizado_em = NOW()
     WHERE id = $7 RETURNING *`,
    [nome, descricao, quantidade, valor_custo, valor_venda, categoria, id],
  );
  return result.rows[0];
}

export async function deletarProdutoVenda(id: number) {
  const result = await pool.query(
    "DELETE FROM estoque_produtos_venda WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
}
