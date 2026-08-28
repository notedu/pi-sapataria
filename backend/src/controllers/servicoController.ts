import { type Request, type Response } from "express";
import * as servicoModel from "../models/servicoModel.js";

// GET /servicos - lista todos
export async function index(req: Request, res: Response) {
  try {
    const servicos = await servicoModel.listarServicos();
    return res.status(200).json(servicos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar serviços" });
  }
}

// GET /servicos/:id - busca um específico
export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const servico = await servicoModel.buscarServicoPorId(id);

    if (!servico) {
      return res.status(404).json({ erro: "Serviço não encontrado" });
    }

    return res.status(200).json(servico);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar serviço" });
  }
}

// POST /servicos - cria um novo
export async function create(req: Request, res: Response) {
  try {
    const { nome, descricao } = req.body;

    // aqui só "nome" é obrigatório, já que "descricao" é opcional no schema
    if (!nome) {
      return res.status(400).json({
        erro: "O campo nome é obrigatório",
      });
    }

    const novoServico = await servicoModel.criarServico({ nome, descricao });

    return res.status(201).json(novoServico);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao criar serviço" });
  }
}

// PUT /servicos/:id - atualiza um existente
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, descricao } = req.body;

    const servicoAtualizado = await servicoModel.atualizarServico(id, {
      nome,
      descricao,
    });

    if (!servicoAtualizado) {
      return res.status(404).json({ erro: "Serviço não encontrado" });
    }

    return res.status(200).json(servicoAtualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar serviço" });
  }
}

// DELETE /servicos/:id - remove um serviço
export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const servicoDeletado = await servicoModel.deletarServico(id);

    if (!servicoDeletado) {
      return res.status(404).json({ erro: "Serviço não encontrado" });
    }

    return res.status(200).json({ mensagem: "Serviço removido com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover serviço" });
  }
}
