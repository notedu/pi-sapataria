import type { Request, Response } from 'express';
import * as funcionarios from '../models/funcionarioModel';
import type { Perfil } from '../models/funcionarioModel';
import { cpfValido } from '../utils/cpf';
import { listar as listarOrdens } from '../models/ordemServicoModel';
import { protegerSenha, validarSenha, verificarSenha } from '../utils/senha';
import { limitarConfirmacoes } from '../models/loginModel';
import { ErroHttp, idValido, objeto, texto } from '../utils/validacao';

export function lerPerfil(valor: unknown): Perfil {
  if (valor !== 'administrador' && valor !== 'funcionario') {
    throw new ErroHttp(400, 'PERFIL_INVALIDO', 'Escolha administrador ou funcionario.');
  }
  return valor;
}

function dadosPessoais(dados: Record<string, unknown>): funcionarios.DadosPessoais {
  const email = texto(dados.email, 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe um e-mail em formato válido.');
  const cpf = texto(dados.cpf, 'cpf');
  const telefone = texto(dados.telefone, 'telefone');
  if (!cpfValido(cpf)) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe um CPF válido, sem pontuação.');
  if (!/^\d{11}$/.test(telefone)) throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe telefone com 11 dígitos, sem pontuação.');
  return { nome: texto(dados.nome, 'nome'), email, cpf, telefone };
}

export function validarCadastro(corpo: unknown) {
  const dados = objeto(corpo, ['nome', 'usuario', 'email', 'senha', 'perfil', 'ativo', 'cpf', 'telefone']);
  const pessoais = dadosPessoais(dados);
  if (dados.ativo !== undefined && typeof dados.ativo !== 'boolean') {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'O campo ativo deve ser true ou false.');
  }
  return {
    ...pessoais,
    usuario: texto(dados.usuario, 'usuario').toLowerCase(),
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
  const id = permitirConsulta(request);
  const funcionario = await funcionarios.buscar(id);
  if (!funcionario) throw new ErroHttp(404, 'FUNCIONARIO_NAO_ENCONTRADO', 'Funcionário não encontrado.');
  response.json({ dados: funcionario });
}

function permitirConsulta(request: Request): number {
  const id = idValido(request.params.id);
  if (request.funcionario?.perfil !== 'administrador' && request.funcionario?.id !== id) {
    throw new ErroHttp(403, 'ACESSO_NEGADO', 'Você só pode consultar o próprio perfil.');
  }
  return id;
}

export async function ordens(request: Request, response: Response): Promise<void> {
  const id = permitirConsulta(request);
  if (!await funcionarios.buscar(id)) throw new ErroHttp(404, 'FUNCIONARIO_NAO_ENCONTRADO', 'Funcionário não encontrado.');
  response.json({ dados: await listarOrdens(undefined, id) });
}

async function prepararConfirmacao(request: Request, senha: unknown): Promise<funcionarios.AutorizacaoAcesso> {
  const sessao = request.session.autenticacao;
  if (!sessao) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
  if (typeof senha !== 'string' || !senha || [...senha].length > 128) {
    throw new ErroHttp(400, 'CONFIRMACAO_OBRIGATORIA', 'Informe sua senha para confirmar a operação.');
  }
  await limitarConfirmacoes(sessao.funcionarioId, request.ip ?? 'desconhecido');
  return { ...sessao, confirmarSenha: async hash => {
    if (!await verificarSenha(senha, hash)) throw new ErroHttp(403, 'SENHA_CONFIRMACAO_INVALIDA', 'Sua senha está incorreta. A operação não foi realizada.');
  } };
}

export async function editar(request: Request, response: Response): Promise<void> {
  const id = idValido(request.params.id);
  const dados = objeto(request.body, ['nome', 'email', 'cpf', 'telefone', 'senha_admin']);
  const pessoais = dadosPessoais(dados);
  const autorizacao = await prepararConfirmacao(request, dados.senha_admin);
  response.json({ dados: await funcionarios.editarDados(id, pessoais, autorizacao) });
}

async function executarAlteracao(
  request: Request, id: number, perfil: Perfil | undefined, ativo: boolean, senha: unknown,
) {
  const sessao = request.session.autenticacao;
  if (!sessao) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
  if (!ativo && id === sessao.funcionarioId) {
    throw new ErroHttp(403, 'AUTODESATIVACAO_PROIBIDA', 'Você não pode desativar sua própria conta.');
  }
  const autorizacao = !ativo ? await prepararConfirmacao(request, senha) : sessao;
  return funcionarios.alterarAcesso(id, perfil, ativo, autorizacao);
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
