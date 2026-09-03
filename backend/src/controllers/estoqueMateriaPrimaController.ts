import { type Request, type Response } from "express";
import * as estoqueMateriaPrimaModel from "../models/estoqueMateriaPrimaModel.js";

export async function index(req: Request, res: Response) {
  try {
    const itens = await estoqueMateriaPrimaModel.listarMateriaPrima();
    return res.status(200).json(itens);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar matéria-prima" });
  }
}

export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const item = await estoqueMateriaPrimaModel.buscarMateriaPrimaPorId(id);

    if (!item) {
      return res
        .status(404)
        .json({ erro: "Item de matéria-prima não encontrado" });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar matéria-prima" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const {
      nome,
      descricao,
      categoria,
      unidade_medida,
      quantidade,
      quantidade_minima,
      valor_unitario,
      fornecedor,
    } = req.body;

    if (!nome || !unidade_medida) {
      return res.status(400).json({
        erro: "Os campos nome e unidade_medida são obrigatórios",
      });
    }

    const novoItem = await estoqueMateriaPrimaModel.criarMateriaPrima({
      nome,
      descricao,
      categoria,
      unidade_medida,
      quantidade,
      quantidade_minima,
      valor_unitario,
      fornecedor,
    });

    return res.status(201).json(novoItem);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ erro: "Erro ao criar item de matéria-prima" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const {
      nome,
      descricao,
      categoria,
      unidade_medida,
      quantidade,
      quantidade_minima,
      valor_unitario,
      fornecedor,
    } = req.body;

    const itemAtualizado = await estoqueMateriaPrimaModel.atualizarMateriaPrima(
      id,
      {
        nome,
        descricao,
        categoria,
        unidade_medida,
        quantidade,
        quantidade_minima,
        valor_unitario,
        fornecedor,
      },
    );

    if (!itemAtualizado) {
      return res
        .status(404)
        .json({ erro: "Item de matéria-prima não encontrado" });
    }

    return res.status(200).json(itemAtualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar matéria-prima" });
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const itemDeletado = await estoqueMateriaPrimaModel.deletarMateriaPrima(id);

    if (!itemDeletado) {
      return res
        .status(404)
        .json({ erro: "Item de matéria-prima não encontrado" });
    }

    return res
      .status(200)
      .json({ mensagem: "Item de matéria-prima removido com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover matéria-prima" });
  }
}
