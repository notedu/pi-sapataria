import { type Request, type Response } from "express";
import * as ordemServicoModel from "../models/ordemServicoModel.js";

// GET /ordens-servico - lista todas
export async function index(req: Request, res: Response) {
  try {
    const ordens = await ordemServicoModel.listarOrdensServico();
    return res.status(200).json(ordens);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar ordens de serviço" });
  }
}

// GET /ordens-servico/:id - busca uma específica
export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const ordem = await ordemServicoModel.buscarOrdemServicoPorId(id);

    if (!ordem) {
      return res.status(404).json({ erro: "Ordem de serviço não encontrada" });
    }

    return res.status(200).json(ordem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar ordem de serviço" });
  }
}

// POST /ordens-servico - cria uma nova
export async function create(req: Request, res: Response) {
  try {
    const {
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
    } = req.body;

    // validação básica: os campos NOT NULL do schema.sql (exceto funcionario_id e status,
    // que têm tratamento próprio) precisam estar presentes
    if (!cliente_id || !servico_id || !descricao_item || !valor_servico) {
      return res.status(400).json({
        erro: "Os campos cliente_id, servico_id, descricao_item e valor_servico são obrigatórios",
      });
    }

    const novaOrdem = await ordemServicoModel.criarOrdemServico({
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
    });

    return res.status(201).json(novaOrdem);
  } catch (error) {
    console.error(error);
    // erro comum aqui: cliente_id/funcionario_id/servico_id que não existem no banco
    // (violação de FK) — por enquanto cai no 500 genérico
    return res.status(500).json({ erro: "Erro ao criar ordem de serviço" });
  }
}

// PUT /ordens-servico/:id - atualiza uma existente
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const {
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
    } = req.body;

    const ordemAtualizada = await ordemServicoModel.atualizarOrdemServico(id, {
      cliente_id,
      funcionario_id,
      servico_id,
      descricao_item,
      cor_item,
      observacoes,
      valor_servico,
      status,
    });

    if (!ordemAtualizada) {
      return res.status(404).json({ erro: "Ordem de serviço não encontrada" });
    }

    return res.status(200).json(ordemAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar ordem de serviço" });
  }
}

// DELETE /ordens-servico/:id - remove uma ordem
export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const ordemDeletada = await ordemServicoModel.deletarOrdemServico(id);

    if (!ordemDeletada) {
      return res.status(404).json({ erro: "Ordem de serviço não encontrada" });
    }

    return res
      .status(200)
      .json({ mensagem: "Ordem de serviço removida com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover ordem de serviço" });
  }
}
