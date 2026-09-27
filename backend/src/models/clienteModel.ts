import { pool } from '../config/db';

export interface DadosCliente {
  nome: string;
  telefone: string;
  endereco: string;
  email: string | null;
  observacoes: string | null;
}

export interface Cliente extends DadosCliente {
  id: number;
}

const colunas = 'id, nome, telefone, endereco, email, observacoes';

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
    `INSERT INTO sapataria.clientes (nome, telefone, endereco, email, observacoes)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${colunas}`,
    [dados.nome, dados.telefone, dados.endereco, dados.email, dados.observacoes],
  );
  return resultado.rows[0]!;
}

export async function atualizarCliente(id: number, dados: DadosCliente): Promise<Cliente | undefined> {
  const resultado = await pool.query<Cliente>(
    `UPDATE sapataria.clientes
     SET nome = $1, telefone = $2, endereco = $3, email = $4, observacoes = $5
     WHERE id = $6 RETURNING ${colunas}`,
    [dados.nome, dados.telefone, dados.endereco, dados.email, dados.observacoes, id],
  );
  return resultado.rows[0];
}

export async function excluirCliente(id: number): Promise<boolean> {
  // A FK de ordens_servico bloqueia a exclusão de clientes com histórico.
  const resultado = await pool.query('DELETE FROM sapataria.clientes WHERE id = $1 RETURNING id', [id]);
  return resultado.rowCount === 1;
}
