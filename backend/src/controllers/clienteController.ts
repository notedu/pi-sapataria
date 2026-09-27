import type { Request, Response } from 'express';
import * as clienteModel from '../models/clienteModel';
import type { DadosCliente } from '../models/clienteModel';

function validarDados(corpo: unknown): DadosCliente {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw new Error('O corpo deve conter um objeto JSON.');
  }

  const dados = corpo as Record<string, unknown>;
  const campos = ['nome', 'telefone', 'endereco', 'email', 'observacoes'];
  if (Object.keys(dados).some((campo) => !campos.includes(campo))) {
    throw new Error('Envie somente nome, telefone, endereco, email e observacoes.');
  }

  function texto(campo: string, obrigatorio: boolean): string | null {
    const valor = dados[campo];
    if (valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim())) {
      if (obrigatorio) throw new Error(`O campo ${campo} é obrigatório.`);
      return null;
    }
    if (typeof valor !== 'string') throw new Error(`O campo ${campo} deve ser um texto.`);
    return valor.trim();
  }

  const cliente: DadosCliente = {
    nome: texto('nome', true)!,
    telefone: texto('telefone', true)!,
    endereco: texto('endereco', true)!,
    email: texto('email', false),
    observacoes: texto('observacoes', false),
  };
  if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
    throw new Error('Informe um e-mail em formato válido.');
  }
  return cliente;
}

function lerDados(request: Request, response: Response): DadosCliente | undefined {
  try {
    return validarDados(request.body);
  } catch (error) {
    response.status(400).json({ erro: {
      codigo: 'DADOS_INVALIDOS',
      mensagem: (error as Error).message,
    } });
    return undefined;
  }
}

function lerId(request: Request, response: Response): number | undefined {
  const valor = request.params.id;
  const id = Number(valor);
  if (typeof valor !== 'string' || !/^\d+$/.test(valor) || !Number.isInteger(id) || id < 1 || id > 2147483647) {
    response.status(400).json({ erro: { codigo: 'ID_INVALIDO', mensagem: 'Informe um ID inteiro positivo válido.' } });
    return undefined;
  }
  return id;
}

function naoEncontrado(response: Response): void {
  response.status(404).json({ erro: { codigo: 'CLIENTE_NAO_ENCONTRADO', mensagem: 'Cliente não encontrado.' } });
}

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await clienteModel.listarClientes() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const id = lerId(request, response);
  if (id === undefined) return;
  const cliente = await clienteModel.buscarCliente(id);
  if (!cliente) return naoEncontrado(response);
  response.json({ dados: cliente });
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  const dados = lerDados(request, response);
  if (!dados) return;
  const cliente = await clienteModel.criarCliente(dados);
  response.status(201).json({ dados: cliente });
}

export async function atualizar(request: Request, response: Response): Promise<void> {
  const id = lerId(request, response);
  if (id === undefined) return;
  const dados = lerDados(request, response);
  if (!dados) return;
  const cliente = await clienteModel.atualizarCliente(id, dados);
  if (!cliente) return naoEncontrado(response);
  response.json({ dados: cliente });
}

export async function excluir(request: Request, response: Response): Promise<void> {
  const id = lerId(request, response);
  if (id === undefined) return;
  if (!await clienteModel.excluirCliente(id)) return naoEncontrado(response);
  response.status(204).end();
}
