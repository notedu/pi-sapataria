import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { pool } from '../src/config/db';
import { validarCadastro } from '../src/controllers/funcionarioController';
import { criarPrimeiroAdministrador } from '../src/models/funcionarioModel';
import { protegerSenha } from '../src/utils/senha';
import { ErroHttp } from '../src/utils/validacao';

async function executar(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Execute npm run criar:admin em um terminal interativo.');
  }
  let ocultar = false;
  const saida = new Writable({
    write(chunk, _encoding, callback) {
      if (!ocultar) process.stdout.write(chunk);
      callback();
    },
  });
  const terminal = createInterface({ input: process.stdin, output: saida, terminal: true });
  const cancelar = new AbortController();
  terminal.on('SIGINT', () => cancelar.abort());
  const perguntar = (pergunta: string) => terminal.question(pergunta, { signal: cancelar.signal });
  const lerSenha = async (pergunta: string) => {
    process.stdout.write(pergunta);
    ocultar = true;
    try { return await perguntar(''); }
    finally { ocultar = false; process.stdout.write('\n'); }
  };
  try {
    const nome = await perguntar('Nome: ');
    const usuario = await perguntar('Usuário de login: ');
    const email = await perguntar('E-mail de contato: ');
    const cpf = await perguntar('CPF (11 números, sem pontuação): ');
    const telefone = await perguntar('Telefone com DDD (11 números): ');
    const senha = await lerSenha('Senha (15 a 128 caracteres; não será exibida): ');
    const confirmacao = await lerSenha('Repita a senha: ');
    if (senha !== confirmacao) throw new Error('As senhas não coincidem. Nenhuma conta foi criada.');
    const dados = validarCadastro({ nome, usuario, email, cpf, telefone, senha, perfil: 'administrador' });
    const funcionario = await criarPrimeiroAdministrador({
      nome: dados.nome, cpf: dados.cpf, telefone: dados.telefone, usuario: dados.usuario, email: dados.email,
      perfil: dados.perfil, ativo: dados.ativo, senha_protegida: await protegerSenha(senha),
    });
    console.log(`Administrador criado: ${funcionario.usuario}. Faça login pela API.`);
  } finally { terminal.close(); }
}

executar().catch((error) => {
  if (error.name === 'AbortError') console.error('Operação cancelada.');
  else if (error instanceof ErroHttp || !error.code) console.error(error.message);
  else console.error('Não foi possível criar o administrador. Confira a conexão e a estrutura do banco.');
  process.exitCode = 1;
}).finally(() => pool.end());
