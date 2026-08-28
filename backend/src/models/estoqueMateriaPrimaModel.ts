import pool from "../config/db.js";

export interface EstoqueMateriaPrima {
  id?: number;
  nome: string;
  descricao?: string;
  unidade_medida: string;
  quantidade?: number;
  quantidade_minima?: number;
  valor_unitario?: number;
  fornecedor?: string;
}

// Lista todos os itens de matéria-prima
export async function listarMateriaPrima() {
  const result = await pool.query(
    "SELECT * FROM estoque_materia_prima ORDER BY id",
  );
  return result.rows;
}

// Busca um item específico pelo ID
export async function buscarMateriaPrimaPorId(id: number) {
  const result = await pool.query(
    "SELECT * FROM estoque_materia_prima WHERE id = $1",
    [id],
  );
  return result.rows[0];
}

// Cria um novo item de matéria-prima
export async function criarMateriaPrima(item: EstoqueMateriaPrima) {
  const {
    nome,
    descricao,
    unidade_medida,
    quantidade,
    quantidade_minima,
    valor_unitario,
    fornecedor,
  } = item;
  const result = await pool.query(
    `INSERT INTO estoque_materia_prima
      (nome, descricao, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor)
     VALUES ($1, $2, $3, COALESCE($4, 0::numeric), $5, $6, $7)
     RETURNING *`,
    [
      nome,
      descricao,
      unidade_medida,
      quantidade,
      quantidade_minima,
      valor_unitario,
      fornecedor,
    ],
  );
  return result.rows[0];
}

// Atualiza um item existente
export async function atualizarMateriaPrima(
  id: number,
  item: EstoqueMateriaPrima,
) {
  const {
    nome,
    descricao,
    unidade_medida,
    quantidade,
    quantidade_minima,
    valor_unitario,
    fornecedor,
  } = item;
  const result = await pool.query(
    `UPDATE estoque_materia_prima
     SET nome = $1, descricao = $2, unidade_medida = $3, quantidade = $4,
         quantidade_minima = $5, valor_unitario = $6, fornecedor = $7,
         atualizado_em = NOW()
     WHERE id = $8 RETURNING *`,
    [
      nome,
      descricao,
      unidade_medida,
      quantidade,
      quantidade_minima,
      valor_unitario,
      fornecedor,
      id,
    ],
  );
  return result.rows[0];
}

// Remove um item pelo ID
export async function deletarMateriaPrima(id: number) {
  const result = await pool.query(
    "DELETE FROM estoque_materia_prima WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
}
