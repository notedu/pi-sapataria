import type { Request, Response } from 'express';
import { duracaoSessao, nomeCookie, opcoesCookie } from '../config/sessao';
import { encerrarSessao } from '../middlewares/autenticacao';
import { novoTokenCsrf } from '../middlewares/csrf';
import { buscarCredencial, dadosPublicos } from '../models/funcionarioModel';
import { limitarTentativas, limparTentativasUsuario } from '../models/loginModel';
import { verificarSenha } from '../utils/senha';
import { ErroHttp, objeto, texto } from '../utils/validacao';

export async function login(request: Request, response: Response): Promise<void> {
  const dados = objeto(request.body, ['usuario', 'senha']);
  const usuario = texto(dados.usuario, 'usuario').toLowerCase();
  if (typeof dados.senha !== 'string' || !dados.senha || [...dados.senha].length > 128) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Informe a senha com até 128 caracteres.');
  }
  await limitarTentativas(usuario, request.ip ?? 'desconhecido');
  const funcionario = await buscarCredencial(usuario);
  const senhaCorreta = await verificarSenha(dados.senha, funcionario?.senha_protegida);
  if (!funcionario?.ativo || !senhaCorreta) {
    // A mesma resposta evita revelar se uma conta existe ou está inativa.
    throw new ErroHttp(401, 'CREDENCIAIS_INVALIDAS', 'Usuário ou senha inválidos.');
  }
  await limparTentativasUsuario(usuario);
  // Troca o identificador da sessão após o login para impedir fixação de sessão.
  await new Promise<void>((resolve, reject) => request.session.regenerate((erro) => erro ? reject(erro) : resolve()));
  request.session.autenticacao = {
    funcionarioId: funcionario.id,
    versao: funcionario.versao_acesso,
    expiraEm: Date.now() + duracaoSessao,
  };
  request.session.csrfToken = novoTokenCsrf();
  request.session.cookie.maxAge = duracaoSessao;
  await new Promise<void>((resolve, reject) => request.session.save((erro) => erro ? reject(erro) : resolve()));
  response.json({ dados: dadosPublicos(funcionario), csrfToken: request.session.csrfToken });
}

export async function logout(request: Request, response: Response): Promise<void> {
  await encerrarSessao(request);
  response.clearCookie(nomeCookie, opcoesCookie);
  response.status(204).end();
}

export function me(request: Request, response: Response): void {
  response.json({ dados: request.funcionario });
}
