import { type Request, type Response } from "express";
import * as clienteModel from "../models/clienteModel.js";

// GET /clientes - lista todos
export async function index(req: Request, res: Response) {
  try {
    const clientes = await clienteModel.listarClientes();
    return res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar clientes" });
  }
}

// GET /clientes/:id - busca um específico
export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id); // converte o parâmetro de rota (string) para número
    const cliente = await clienteModel.buscarClientePorId(id);

    if (!cliente) {
      // se não encontrou, retorna 404 em vez de um objeto vazio
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar cliente" });
  }
}

// POST /clientes - cria um novo
export async function create(req: Request, res: Response) {
  try {
    const { nome, cpf, telefone, genero, endereco } = req.body;

    // validação básica dos campos obrigatórios
    if (!nome || !cpf || !telefone) {
      return res.status(400).json({
        erro: "Os campos nome, cpf e telefone são obrigatórios",
      });
    }

    const novoCliente = await clienteModel.criarCliente({
      nome,
      cpf,
      telefone,
      genero,
      endereco,
    });

    return res.status(201).json(novoCliente); // 201 = "criado com sucesso"
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao criar cliente" });
  }
}

// PUT /clientes/:id - atualiza um existente
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, cpf, telefone, genero, endereco } = req.body;

    const clienteAtualizado = await clienteModel.atualizarCliente(id, {
      nome,
      cpf,
      telefone,
      genero,
      endereco,
    });

    if (!clienteAtualizado) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    return res.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao atualizar cliente" });
  }
}

// DELETE /clientes/:id - remove um cliente
export async function destroy(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const clienteDeletado = await clienteModel.deletarCliente(id);

    if (!clienteDeletado) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    return res.status(200).json({ mensagem: "Cliente removido com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao remover cliente" });
  }
}
