import { type Request, type Response } from "express";
import * as estoqueProdutosVendaModel from "../models/estoqueProdutosVendaModel.js";

export async function index(req: Request, res: Response) {
  try {
    const produtos = await estoqueProdutosVendaModel.listarProdutosVenda();
    return res.status(200).json(produtos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar produtos de venda" });
  }
}

export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const produto = await estoqueProdutosVendaModel.buscarProdutoVendaPorId(id);

    if (!produto) {
      return res.status(404).json({ erro: "Produto de venda não encontrado" });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar produto de venda" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { nome, descricao, quantidade, valor_custo, valor_venda, categoria } =
      req.body;

    if (!nome || !valor_venda) {
      return res.status(400).json({
        erro: "Os campos nome e valor_venda são obrigatórios",
      });
    }

    const novoProduto = await estoqueProdutosVendaModel.criarProdutoVenda({
      nome,
      descricao,
      quantidade,
      valor_custo,
      valor_venda,
      categoria,
    });

    return res.status(201).json(novoProduto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao criar produto de venda" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, descricao, quantidade, valor_custo, valor_venda, categoria } =
      req.body;

    const produtoAtualizado =
      await estoqueProdutosVendaModel.atualizarProdutoVenda(id, {
        nome,
        descricao,
        quantidade,
        valor_custo,
        valor_venda,
        categoria,
      });

    if (!produtoAtualizado) {
      return res.status(404).json({ erro: "Produto de venda não encontrado" });
    }

    return res.status(200).json(produtoAtualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar produto de venda" });
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const produtoDeletado =
      await estoqueProdutosVendaModel.deletarProdutoVenda(id);

    if (!produtoDeletado) {
      return res.status(404).json({ erro: "Produto de venda não encontrado" });
    }

    return res
      .status(200)
      .json({ mensagem: "Produto de venda removido com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover produto de venda" });
  }
}
