import { type Request, type Response } from "express";
import * as estoqueMateriaPrimaModel from "../models/estoqueMateriaPrimaModel.js";

const UNIDADES_INTEIRAS = new Set(["unidade", "par", "rolo", "caixa", "pacote"]);

function validarMateriaPrima(dados: {
  nome: unknown;
  categoria: unknown;
  unidade_medida: unknown;
  quantidade: unknown;
  quantidade_minima: unknown;
  valor_unitario: unknown;
  fornecedor: unknown;
}) {
  const { nome, categoria, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor } = dados;
  if (!nome || !categoria || !unidade_medida || !fornecedor || quantidade === "" || quantidade === undefined || quantidade_minima === "" || quantidade_minima === undefined || !Number.isFinite(Number(valor_unitario)) || Number(valor_unitario) <= 0) {
    return "Nome, categoria, fornecedor, unidade, quantidades e preço de custo são obrigatórios";
  }
  if (!Number.isFinite(Number(quantidade)) || !Number.isFinite(Number(quantidade_minima))) {
    return "Quantidade e estoque mínimo devem ser números válidos";
  }
  if (UNIDADES_INTEIRAS.has(String(unidade_medida)) && (!Number.isInteger(Number(quantidade)) || !Number.isInteger(Number(quantidade_minima)))) {
    return "Esta unidade de medida aceita somente quantidades inteiras";
  }
  return null;
}

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

    const erroValidacao = validarMateriaPrima({ nome, categoria, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor });
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

    if (descricao && descricao.length > 200) {
      return res.status(400).json({
        erro: "A descrição pode ter no máximo 200 caracteres",
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

    const erroValidacao = validarMateriaPrima({ nome, categoria, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor });
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

    if (descricao && descricao.length > 200) {
      return res.status(400).json({
        erro: "A descrição pode ter no máximo 200 caracteres",
      });
    }

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
