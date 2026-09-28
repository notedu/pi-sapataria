import type { Request, Response } from 'express';
import * as funcionarios from '../models/funcionarioModel';
import type { Perfil } from '../models/funcionarioModel';
import { protegerSenha, validarSenha, verificarSenha } from '../utils/senha';
import { limitarConfirmacoes } from '../models/loginModel';
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

async function executarAlteracao(
  request: Request, id: number, perfil: Perfil | undefined, ativo: boolean, senha: unknown,
) {
  const sessao = request.session.autenticacao;
  if (!sessao) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
  let confirmarSenha: ((hash: string) => Promise<void>) | undefined;
  if (!ativo) {
    if (id === sessao.funcionarioId) {
      throw new ErroHttp(403, 'AUTODESATIVACAO_PROIBIDA', 'Você não pode desativar sua própria conta.');
    }
    if (typeof senha !== 'string' || !senha || [...senha].length > 128) {
      throw new ErroHttp(400, 'CONFIRMACAO_OBRIGATORIA', 'Informe sua senha para confirmar a desativação.');
    }
    await limitarConfirmacoes(sessao.funcionarioId, request.ip ?? 'desconhecido');
    confirmarSenha = async (hash) => {
      if (!await verificarSenha(senha, hash)) {
        throw new ErroHttp(403, 'SENHA_CONFIRMACAO_INVALIDA', 'Sua senha está incorreta. A desativação não foi realizada.');
      }
    };
  }
  return funcionarios.alterarAcesso(id, perfil, ativo, { ...sessao, confirmarSenha });
}

export async function alterarAcesso(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  const dados = objeto(request.body, ['perfil', 'ativo', 'senha_admin']);
  const perfil = lerPerfil(dados.perfil);
  if (typeof dados.ativo !== 'boolean') {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe ativo como true ou false.');
  }
  const funcionario = await executarAlteracao(request, id, perfil, dados.ativo, dados.senha_admin);
  response.json({ dados: funcionario });
}

export async function desativar(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  const dados = objeto(request.body, ['senha_admin']);
  const funcionario = await executarAlteracao(request, id, undefined, false, dados.senha_admin);
  response.json({ dados: funcionario });
}
