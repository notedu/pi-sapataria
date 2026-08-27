import pool from "../config/db.js";

// Interface do Servico: bem mais enxuta que Cliente/Funcionario,
// porque a tabela "servicos" só tem esses campos.
export interface Servico {
  id?: number;
  nome: string;
  descricao?: string;
}

// Lista todos os serviços cadastrados
export async function listarServicos() {
  const result = await pool.query("SELECT * FROM servicos ORDER BY id");
  return result.rows;
}

// Busca um único serviço pelo ID
export async function buscarServicoPorId(id: number) {
  const result = await pool.query("SELECT * FROM servicos WHERE id = $1", [id]);
  return result.rows[0];
}

// Cria um novo serviço
export async function criarServico(servico: Servico) {
  const { nome, descricao } = servico;
  const result = await pool.query(
    `INSERT INTO servicos (nome, descricao)
     VALUES ($1, $2) RETURNING *`,
    [nome, descricao],
  );
  return result.rows[0];
}

// Atualiza um serviço existente
export async function atualizarServico(id: number, servico: Servico) {
  const { nome, descricao } = servico;
  const result = await pool.query(
    `UPDATE servicos
     SET nome = $1, descricao = $2
     WHERE id = $3 RETURNING *`,
    [nome, descricao, id],
  );
  return result.rows[0];
}

// Remove um serviço pelo ID
export async function deletarServico(id: number) {
  const result = await pool.query(
    "DELETE FROM servicos WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
}
