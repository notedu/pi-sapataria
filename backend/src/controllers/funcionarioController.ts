import type { Request, Response } from 'express';
import * as funcionarios from '../models/funcionarioModel';
import type { Perfil } from '../models/funcionarioModel';
import { protegerSenha, validarSenha } from '../utils/senha';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export function lerPerfil(valor: unknown): Perfil {
  if (valor !== 'administrador' && valor !== 'funcionario') {
    throw new ErroHttp(400, 'PERFIL_INVALIDO', 'Escolha administrador ou funcionario.');
  }
  return valor;
}

export function validarCadastro(corpo: unknown) {
  const dados = objeto(corpo, ['nome', 'usuario', 'email', 'senha', 'perfil', 'ativo']);
  const email = texto(dados.email, 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe um e-mail em formato válido.');
  }
  if (dados.ativo !== undefined && typeof dados.ativo !== 'boolean') {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O campo ativo deve ser true ou false.');
  }
  return {
    nome: texto(dados.nome, 'nome'),
    usuario: texto(dados.usuario, 'usuario').toLowerCase(),
    email,
    senha: validarSenha(dados.senha),
    perfil: lerPerfil(dados.perfil),
    ativo: dados.ativo === undefined ? true : dados.ativo,
  };
}

export async function cadastrar(request: Request, response: Response): Promise<void> {
  const { senha, ...dados } = validarCadastro(request.body);
  const funcionario = await funcionarios.criar({ ...dados, senha_protegida: await protegerSenha(senha) });
  response.status(201).json({ dados: funcionario });
}

export async function listar(_request: Request, response: Response): Promise<void> {
  response.json({ dados: await funcionarios.listar() });
}

export async function buscarPorId(request: Request, response: Response): Promise<void> {
  const funcionario = await funcionarios.buscar(idValido(request.params.id));
  if (!funcionario) throw new ErroHttp(404, 'FUNCIONARIO_NAO_ENCONTRADO', 'Funcionário não encontrado.');
  response.json({ dados: funcionario });
}

export async function alterarAcesso(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  const dados = objeto(request.body, ['perfil', 'ativo']);
  const perfil = lerPerfil(dados.perfil);
  if (typeof dados.ativo !== 'boolean') {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe ativo como true ou false.');
  }
  const funcionario = await funcionarios.alterarAcesso(id, perfil, dados.ativo);
  if (!funcionario) throw new ErroHttp(404, 'FUNCIONARIO_NAO_ENCONTRADO', 'Funcionário não encontrado.');
  response.json({ dados: funcionario });
}
