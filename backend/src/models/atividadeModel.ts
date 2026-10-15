import { pool } from '../config/db';
import { emTransacao } from '../config/transacao';
import type { PoolClient } from 'pg';

export type TipoEntidade = 'ordem_servico' | 'cliente' | 'funcionario' | 'material' | 'produto' | 'estoque' | 'venda' | 'fornecedor' | 'acesso';
export type NovaAtividade = {
  atorId: number | null;
  atorNome: string;
  acao: string;
  entidadeTipo: TipoEntidade;
  entidadeId?: number | null;
  detalhes?: Record<string, unknown>;
  notificarFuncionarios?: number[];
  notificarAdministradores?: boolean;
  mensagem?: string;
};

export async function registrarNaConexao(conexao: Pick<PoolClient, 'query'>, dados: NovaAtividade): Promise<void> {
  const atividade = await conexao.query<{ id: string }>(
    `INSERT INTO sapataria.atividades (ator_id, ator_nome, acao, entidade_tipo, entidade_id, detalhes)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id`,
    [dados.atorId, dados.atorNome, dados.acao, dados.entidadeTipo, dados.entidadeId ?? null, JSON.stringify(dados.detalhes ?? {})],
  );
  const destinatarios = new Set((dados.notificarFuncionarios ?? []).filter(id => id !== dados.atorId));
  if (dados.notificarAdministradores) {
    const admins = await conexao.query<{ id: number }>(
      `SELECT id FROM sapataria.funcionarios WHERE perfil='administrador' AND ativo=true AND ($1::integer IS NULL OR id <> $1)`, [dados.atorId],
    );
    admins.rows.forEach(admin => destinatarios.add(admin.id));
  }
  for (const id of destinatarios) {
    await conexao.query(
      `INSERT INTO sapataria.notificacoes (atividade_id, destinatario_id, mensagem)
       SELECT $1, f.id, $3 FROM sapataria.funcionarios f WHERE f.id=$2 AND f.ativo=true
       ON CONFLICT (atividade_id, destinatario_id) DO NOTHING`,
      [atividade.rows[0]!.id, id, dados.mensagem ?? dados.acao],
    );
    }
}

export async function registrar(dados: NovaAtividade): Promise<void> {
  await emTransacao(conexao => registrarNaConexao(conexao, dados));
}

export type Filtros = { de?: string; ate?: string; funcionarioId?: number; acao?: string };

export async function listar(perfil: string, funcionarioId: number, filtros: Filtros) {
  const valores: unknown[] = [funcionarioId, perfil];
  const condicoes = [
    `( $2 = 'administrador' OR a.ator_id = $1 OR (a.entidade_tipo='ordem_servico' AND EXISTS
      (SELECT 1 FROM sapataria.ordens_servico os WHERE os.id=a.entidade_id AND os.responsavel_id=$1)) )`,
  ];
  if (filtros.de) { valores.push(filtros.de); condicoes.push(`(a.criado_em AT TIME ZONE 'America/Sao_Paulo')::date >= $${valores.length}::date`); }
  if (filtros.ate) { valores.push(filtros.ate); condicoes.push(`(a.criado_em AT TIME ZONE 'America/Sao_Paulo')::date <= $${valores.length}::date`); }
  if (perfil === 'administrador' && filtros.funcionarioId) { valores.push(filtros.funcionarioId); condicoes.push(`a.ator_id = $${valores.length}`); }
  if (filtros.acao) {
    const categorias: Record<string, string[]> = {
      ordem_servico: ['ordem_servico.%'], cliente: ['cliente.%'], funcionario: ['funcionario.%'],
      material: ['material.%'], produto: ['produto.%'], fornecedor: ['fornecedor.%'],
      estoque: ['estoque.%'], venda: ['venda.%'], acesso: ['acesso.%'],
    };
    const padroes = categorias[filtros.acao] ?? [`%${filtros.acao}%`];
    valores.push(padroes);
    condicoes.push(`a.acao ILIKE ANY($${valores.length}::text[])`);
  }
  const resultado = await pool.query(
    `SELECT a.id, a.ator_id, a.ator_nome, a.acao, a.entidade_tipo, a.entidade_id, a.detalhes, a.criado_em
       FROM sapataria.atividades a WHERE ${condicoes.join(' AND ')}
      ORDER BY a.criado_em DESC, a.id DESC LIMIT 250`, valores,
  );
  return resultado.rows;
}

export async function listarNotificacoes(destinatarioId: number) {
  return (await pool.query(
    `SELECT n.id, n.mensagem, n.criada_em, n.lida_em,
            a.acao, a.entidade_tipo, a.entidade_id, a.ator_nome
       FROM sapataria.notificacoes n JOIN sapataria.atividades a ON a.id=n.atividade_id
      WHERE n.destinatario_id=$1 ORDER BY n.criada_em DESC, n.id DESC LIMIT 100`, [destinatarioId],
  )).rows;
}

export async function contarNaoLidas(destinatarioId: number): Promise<number> {
  const resultado = await pool.query<{ quantidade: string }>(
    'SELECT count(*)::text AS quantidade FROM sapataria.notificacoes WHERE destinatario_id=$1 AND lida_em IS NULL', [destinatarioId],
  );
  return Number(resultado.rows[0]?.quantidade ?? 0);
}

export async function marcarLida(id: number, destinatarioId: number): Promise<boolean> {
  const resultado = await pool.query(
    'UPDATE sapataria.notificacoes SET lida_em=CURRENT_TIMESTAMP WHERE id=$1 AND destinatario_id=$2 AND lida_em IS NULL RETURNING id', [id, destinatarioId],
  );
  return Boolean(resultado.rowCount);
}

export async function marcarTodasLidas(destinatarioId: number): Promise<void> {
  await pool.query('UPDATE sapataria.notificacoes SET lida_em=CURRENT_TIMESTAMP WHERE destinatario_id=$1 AND lida_em IS NULL', [destinatarioId]);
}
