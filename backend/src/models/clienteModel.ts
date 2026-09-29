import { pool } from '../config/db';

export interface DadosCliente {
  nome: string;
  telefone: string;
  cpf: string;
  cep: string;
  numero: string;
  email: string | null;
  observacoes: string | null;
}

export interface Cliente extends Omit<DadosCliente, "cpf" | "cep" | "numero"> {
  id: number;
  cpf: string | null;
  cep: string | null;
  numero: string | null;
  endereco: string | null;
  criado_em: string | null;
}

const colunas = 'id, nome, telefone, cpf, cep, numero, endereco, email, observacoes, criado_em';

export async function listarClientes(): Promise<Cliente[]> {
  const resultado = await pool.query<Cliente>(
    `SELECT ${colunas} FROM sapataria.clientes ORDER BY id`,
  );
  return resultado.rows;
}

export async function buscarCliente(id: number): Promise<Cliente | undefined> {
  const resultado = await pool.query<Cliente>(
    `SELECT ${colunas} FROM sapataria.clientes WHERE id = $1`, [id],
  );
  return resultado.rows[0];
}

export async function criarCliente(dados: DadosCliente): Promise<Cliente> {
  // Os valores são enviados separadamente do SQL para evitar injeção de SQL.
  const resultado = await pool.query<Cliente>(
    `INSERT INTO sapataria.clientes (nome, telefone, cpf, cep, numero, email, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${colunas}`,
    [dados.nome, dados.telefone, dados.cpf, dados.cep, dados.numero, dados.email, dados.observacoes],
  );
  return resultado.rows[0]!;
}

export async function atualizarCliente(id: number, dados: DadosCliente): Promise<Cliente | undefined> {
  const resultado = await pool.query<Cliente>(
    `UPDATE sapataria.clientes
     SET nome = $1, telefone = $2, cpf = $3, cep = $4, numero = $5, email = $6, observacoes = $7
     WHERE id = $8 RETURNING ${colunas}`,
    [dados.nome, dados.telefone, dados.cpf, dados.cep, dados.numero, dados.email, dados.observacoes, id],
  );
  return resultado.rows[0];
}

export async function excluirCliente(id: number): Promise<boolean> {
  // A FK de ordens_servico bloqueia a exclusão de clientes com histórico.
  const resultado = await pool.query('DELETE FROM sapataria.clientes WHERE id = $1 RETURNING id', [id]);
  return resultado.rowCount === 1;
}
