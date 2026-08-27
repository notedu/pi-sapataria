import pool from "../config/db.js";

// Interface da Ordem de Serviço.
// Repare que "funcionario_id" tem "?" (opcional), porque no schema.sql
// ele é a ÚNICA FK que NÃO tem NOT NULL — uma ordem pode existir
// sem funcionário definido ainda (ex: acabou de ser aberta).
// "status" também é opcional aqui porque o banco já tem um DEFAULT ('Pendente').
export interface OrdemServico {
  id?: number;
  cliente_id: number;
  funcionario_id?: number;
  servico_id: number;
  descricao_item: string;
  cor_item?: string;
  observacoes?: string;
  valor_servico: number;
  status?: string;
}

// Lista todas as ordens de serviço
export async function listarOrdensServico() {
  const result = await pool.query("SELECT * FROM ordens_servico ORDER BY id");
  return result.rows;
}

// Busca uma única ordem pelo ID
export async function buscarOrdemServicoPorId(id: number) {
  const result = await pool.query(
    "SELECT * FROM ordens_servico WHERE id = $1",
    [id],
  );
  return result.rows[0];
}

// Cria uma nova ordem de serviço
export async function criarOrdemServico(ordem: OrdemServico) {
  const {
    cliente_id,
    funcionario_id,
    servico_id,
    descricao_item,
    cor_item,
    observacoes,
    valor_servico,
    status,
  } = ordem;

  const result = await pool.query(
    `INSERT INTO ordens_servico
      (cliente_id, funcionario_id, servico_id, descricao_item, cor_item, observacoes, valor_servico, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'Pendente'))
     RETURNING *`,
    [
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
    ],
  );
  return result.rows[0];
}

// Atualiza uma ordem de serviço existente
export async function atualizarOrdemServico(id: number, ordem: OrdemServico) {
  const {
    cliente_id,
    funcionario_id,
    servico_id,
    descricao_item,
    cor_item,
    observacoes,
    valor_servico,
    status,
  } = ordem;

  const result = await pool.query(
    `UPDATE ordens_servico
     SET cliente_id = $1, funcionario_id = $2, servico_id = $3,
         descricao_item = $4, cor_item = $5, observacoes = $6,
         valor_servico = $7, status = $8
     WHERE id = $9 RETURNING *`,
    [
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
      id,
    ],
  );
  return result.rows[0];
}

// Remove uma ordem de serviço pelo ID
export async function deletarOrdemServico(id: number) {
  const result = await pool.query(
    "DELETE FROM ordens_servico WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
}
