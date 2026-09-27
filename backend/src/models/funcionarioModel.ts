import type { PoolClient } from 'pg';
import { pool } from '../config/db';
import { ErroHttp } from '../utils/validacao';

export type Perfil = 'administrador' | 'funcionario';
export interface Funcionario {
  id: number;
  nome: string;
  usuario: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}
export interface Credencial extends Funcionario {
  senha_protegida: string;
  versao_acesso: number;
}
export interface NovoFuncionario {
  nome: string; usuario: string; email: string; perfil: Perfil; ativo: boolean; senha_protegida: string;
}

const colunas = 'id, nome, usuario, email, perfil, ativo';

export function dadosPublicos(funcionario: Funcionario): Funcionario {
  const { id, nome, usuario, email, perfil, ativo } = funcionario;
  return { id, nome, usuario, email, perfil, ativo };
}

export async function listar(): Promise<Funcionario[]> {
  return (await pool.query<Funcionario>(`SELECT ${colunas} FROM sapataria.funcionarios ORDER BY id`)).rows;
}

export async function buscar(id: number): Promise<Funcionario | undefined> {
  return (await pool.query<Funcionario>(`SELECT ${colunas} FROM sapataria.funcionarios WHERE id = $1`, [id])).rows[0];
}

export async function buscarAcesso(id: number): Promise<(Funcionario & { versao_acesso: number }) | undefined> {
  return (await pool.query<Funcionario & { versao_acesso: number }>(
    `SELECT ${colunas}, versao_acesso FROM sapataria.funcionarios WHERE id = $1`, [id],
  )).rows[0];
}

export async function buscarCredencial(usuario: string): Promise<Credencial | undefined> {
  return (await pool.query<Credencial>(
    `SELECT ${colunas}, senha_protegida, versao_acesso FROM sapataria.funcionarios WHERE lower(usuario) = $1`, [usuario],
  )).rows[0];
}

export async function criar(dados: NovoFuncionario, banco: Pick<PoolClient, 'query'> = pool): Promise<Funcionario> {
  return (await banco.query<Funcionario>(
    `INSERT INTO sapataria.funcionarios (nome, usuario, email, senha_protegida, perfil, ativo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${colunas}`,
    [dados.nome, dados.usuario, dados.email, dados.senha_protegida, dados.perfil, dados.ativo],
  )).rows[0]!;
}

export async function alterarAcesso(id: number, perfil: Perfil, ativo: boolean): Promise<Funcionario | undefined> {
  // Alterações de acesso invalidam sessões antigas, mesmo após uma reativação.
  return (await pool.query<Funcionario>(
    `UPDATE sapataria.funcionarios
     SET versao_acesso = versao_acesso + CASE WHEN perfil <> $2 OR ativo <> $3 THEN 1 ELSE 0 END,
         perfil = $2, ativo = $3
     WHERE id = $1 RETURNING ${colunas}`, [id, perfil, ativo],
  )).rows[0];
}

export async function criarPrimeiroAdministrador(dados: NovoFuncionario): Promise<Funcionario> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Impede duas execuções simultâneas do cadastro inicial.
    await client.query('LOCK TABLE sapataria.funcionarios IN EXCLUSIVE MODE');
    const existentes = await client.query('SELECT 1 FROM sapataria.funcionarios LIMIT 1');
    if (existentes.rowCount) throw new ErroHttp(409, 'CADASTRO_INICIAL_CONCLUIDO', 'Já existem funcionários. Use uma conta de administrador.');
    const funcionario = await criar({ ...dados, perfil: 'administrador', ativo: true }, client);
    await client.query('COMMIT');
    return funcionario;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
