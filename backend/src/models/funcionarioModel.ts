import type { PoolClient } from 'pg';
import { pool } from '../config/db';
import { emTransacao } from '../config/transacao';
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

export interface AutorizacaoAcesso {
  funcionarioId: number;
  versao: number;
  expiraEm: number;
  confirmarSenha?: (hash: string) => Promise<void>;
}

export async function alterarAcesso(
  id: number, perfil: Perfil | undefined, ativo: boolean, autorizacao: AutorizacaoAcesso,
): Promise<Funcionario> {
  if (!ativo && id === autorizacao.funcionarioId) {
    throw new ErroHttp(403, 'AUTODESATIVACAO_PROIBIDA', 'Você não pode desativar sua própria conta.');
  }
  return emTransacao(async (client) => {
    // Ordem comum evita deadlock entre dois administradores. Os bloqueios impedem
    // autorizações obsoletas e preservam a versão usada para invalidar sessões.
    const pessoas = (await client.query<Credencial>(
      `SELECT ${colunas}, senha_protegida, versao_acesso FROM sapataria.funcionarios
       WHERE id = ANY($1::integer[]) ORDER BY id FOR UPDATE`, [[autorizacao.funcionarioId, id]],
    )).rows;
    const autor = pessoas.find(pessoa => pessoa.id === autorizacao.funcionarioId);
    if (!autor?.ativo || autor.versao_acesso !== autorizacao.versao || autorizacao.expiraEm <= Date.now()) {
      throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Faça login novamente.');
    }
    if (autor.perfil !== 'administrador') {
      throw new ErroHttp(403, 'ACESSO_NEGADO', 'Este recurso é exclusivo do administrador.');
    }
    const alvo = pessoas.find(pessoa => pessoa.id === id);
    if (!alvo) throw new ErroHttp(404, 'FUNCIONARIO_NAO_ENCONTRADO', 'Funcionário não encontrado.');
    if (!ativo) {
      if (!autorizacao.confirmarSenha) {
        throw new ErroHttp(400, 'CONFIRMACAO_OBRIGATORIA', 'Confirme a operação com sua senha.');
      }
      await autorizacao.confirmarSenha(autor.senha_protegida);
    }
    return (await client.query<Funcionario>(
      `UPDATE sapataria.funcionarios
       SET versao_acesso = versao_acesso + CASE WHEN perfil <> $2 OR ativo <> $3 THEN 1 ELSE 0 END,
           perfil = $2, ativo = $3
       WHERE id = $1 RETURNING ${colunas}`, [id, perfil ?? alvo.perfil, ativo],
    )).rows[0]!;
  });
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
