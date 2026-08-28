import pool from "../config/db.js";

// Interface: define o "formato" que um objeto Cliente deve ter no TypeScript.
// O "?" indica que o campo é opcional.
export interface Cliente {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string;
  genero?: string;
  endereco?: string;
}

// Lista todos os clientes cadastrados
export async function listarClientes() {
  const result = await pool.query("SELECT * FROM clientes ORDER BY id");
  return result.rows;
}

// Busca um único cliente pelo ID
export async function buscarClientePorId(id: number) {
  const result = await pool.query(
    "SELECT * FROM clientes WHERE id = $1", // corrigido: "clientes" no plural
    [id],
  );
  return result.rows[0]; // retorna só o primeiro (e único) resultado
}

// Cria um novo cliente
export async function criarCliente(cliente: Cliente) {
  const { nome, cpf, telefone, genero, endereco } = cliente;
  const result = await pool.query(
    `INSERT INTO clientes (nome, cpf, telefone, genero, endereco)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nome, cpf, telefone, genero, endereco],
  );
  return result.rows[0]; // RETURNING * devolve o registro recém-criado
}

// Atualiza um cliente existente
export async function atualizarCliente(id: number, cliente: Cliente) {
  const { nome, cpf, telefone, genero, endereco } = cliente;
  const result = await pool.query(
    `UPDATE clientes
     SET nome = $1, cpf = $2, telefone = $3, genero = $4, endereco = $5
     WHERE id = $6 RETURNING *`,
    [nome, cpf, telefone, genero, endereco, id],
  );
  return result.rows[0]; // undefined se o id não existir
}

// Remove um cliente pelo ID
export async function deletarCliente(id: number) {
  const result = await pool.query(
    "DELETE FROM clientes WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0]; // retorna o registro deletado (ou undefined se não existia)
}
