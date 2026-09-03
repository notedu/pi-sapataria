import pool from "../config/db.js";

export interface EstoqueMateriaPrima {
  id?: number;
  nome: string;
  descricao?: string;
  categoria?: string;
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
    categoria,
    unidade_medida,
    quantidade,
    quantidade_minima,
    valor_unitario,
    fornecedor,
  } = item;
  const result = await pool.query(
    `INSERT INTO estoque_materia_prima
      (nome, descricao, categoria, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor)
     VALUES ($1, $2, $3, $4, COALESCE($5, 0::numeric), $6, $7, $8)
     RETURNING *`,
    [
      nome,
      descricao,
      categoria,
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
    categoria,
    unidade_medida,
    quantidade,
    quantidade_minima,
    valor_unitario,
    fornecedor,
  } = item;
  const result = await pool.query(
    `UPDATE estoque_materia_prima
     SET nome = $1, descricao = $2, categoria = $3, unidade_medida = $4, quantidade = $5,
         quantidade_minima = $6, valor_unitario = $7, fornecedor = $8,
         atualizado_em = NOW()
     WHERE id = $9 RETURNING *`,
    [
      nome,
      descricao,
      categoria,
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
