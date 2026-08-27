import { type Request, type Response } from "express";
import * as funcionarioModel from "../models/funcionarioModel.js";

// GET /funcionarios - lista todos
export async function index(req: Request, res: Response) {
  try {
    const funcionarios = await funcionarioModel.listarFuncionarios();
    return res.status(200).json(funcionarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar funcionários" });
  }
}

// GET /funcionarios/:id - busca um específico
export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id); // converte o parâmetro de rota (string) para número
    const funcionario = await funcionarioModel.buscarFuncionarioPorId(id);

    if (!funcionario) {
      // se não encontrou, retorna 404 em vez de um objeto vazio
      return res.status(404).json({ erro: "Funcionário não encontrado" });
    }

    return res.status(200).json(funcionario);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar funcionário" });
  }
}

// POST /funcionarios - cria um novo
export async function create(req: Request, res: Response) {
  try {
    const { nome, cpf, telefone, genero, cargo } = req.body;

    // validação básica dos campos obrigatórios
    // (cargo entra aqui no lugar de "endereco", porque em funcionarios ele é obrigatório)
    if (!nome || !cpf || !telefone || !cargo) {
      return res.status(400).json({
        erro: "Os campos nome, cpf, telefone e cargo são obrigatórios",
      });
    }

    const novoFuncionario = await funcionarioModel.criarFuncionario({
      nome,
      cpf,
      telefone,
      genero,
      cargo,
    });

    return res.status(201).json(novoFuncionario); // 201 = "criado com sucesso"
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao criar funcionário" });
  }
}

// PUT /funcionarios/:id - atualiza um existente
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, cpf, telefone, genero, cargo } = req.body;

    const funcionarioAtualizado = await funcionarioModel.atualizarFuncionario(
      id,
      {
        nome,
        cpf,
        telefone,
        genero,
        cargo,
      },
    );

    if (!funcionarioAtualizado) {
      return res.status(404).json({ erro: "Funcionário não encontrado" });
    }

    return res.status(200).json(funcionarioAtualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar funcionário" });
  }
}

// DELETE /funcionarios/:id - remove um funcionário
export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const funcionarioDeletado = await funcionarioModel.deletarFuncionario(id);

    if (!funcionarioDeletado) {
      return res.status(404).json({ erro: "Funcionário não encontrado" });
    }

    return res
      .status(200)
      .json({ mensagem: "Funcionário removido com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover funcionário" });
  }
}
