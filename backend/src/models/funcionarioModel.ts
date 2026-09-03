import pool from "../config/db.js";

// Interface: define o "formato" que um objeto Funcionario deve ter no TypeScript.
// Repare que os campos são quase os mesmos de Cliente, mas trocamos
// "endereco" por "cargo" (que aqui é obrigatório, sem "?").
export interface Funcionario {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string;
  genero?: string;
  cargo: string;
  status: string; // "Ativo" ou "Inativo" (quem valida a lista de valores é o controller)
  data_admissao: string; // formato "YYYY-MM-DD", compatível com o tipo DATE do Postgres
}

// Lista todos os funcionários cadastrados
export async function listarFuncionarios() {
  const result = await pool.query("SELECT * FROM funcionarios ORDER BY id");
  return result.rows;
}

// Busca um único funcionário pelo ID
export async function buscarFuncionarioPorId(id: number) {
  const result = await pool.query("SELECT * FROM funcionarios WHERE id = $1", [
    id,
  ]);
  return result.rows[0]; // retorna só o primeiro (e único) resultado
}

// Cria um novo funcionário
export async function criarFuncionario(funcionario: Funcionario) {
  const { nome, cpf, telefone, genero, cargo, status, data_admissao } =
    funcionario;
  const result = await pool.query(
    `INSERT INTO funcionarios (nome, cpf, telefone, genero, cargo, status, data_admissao)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [nome, cpf, telefone, genero, cargo, status, data_admissao],
  );
  return result.rows[0]; // RETURNING * devolve o registro recém-criado
}

// Atualiza um funcionário existente
export async function atualizarFuncionario(
  id: number,
  funcionario: Funcionario,
) {
  const { nome, cpf, telefone, genero, cargo, status, data_admissao } =
    funcionario;
  const result = await pool.query(
    `UPDATE funcionarios
     SET nome = $1, cpf = $2, telefone = $3, genero = $4, cargo = $5, status = $6, data_admissao = $7
     WHERE id = $8 RETURNING *`,
    [nome, cpf, telefone, genero, cargo, status, data_admissao, id],
  );
  return result.rows[0]; // undefined se o id não existir
}

// Remove um funcionário pelo ID
export async function deletarFuncionario(id: number) {
  const result = await pool.query(
    "DELETE FROM funcionarios WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0]; // retorna o registro deletado (ou undefined se não existia)
}
