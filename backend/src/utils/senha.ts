import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { ErroHttp } from './validacao';

// Parâmetros scrypt recomendados pela OWASP: 32 MiB de memória, p=3.
const parametros = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let operacoesAtivas = 0;

function derivar(senha: string, salt: string): Promise<Buffer> {
  // Limita memória usada simultaneamente por requisições de autenticação.
  if (operacoesAtivas >= 4) {
    throw new ErroHttp(503, 'AUTENTICACAO_OCUPADA', 'Tente novamente em alguns instantes.');
  }
  operacoesAtivas++;
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, 64, parametros, (error, hash) => {
      operacoesAtivas--;
      if (error) reject(error);
      else resolve(hash);
    });
  });
}

export function validarSenha(valor: unknown): string {
  if (typeof valor !== 'string' || [...valor].length < 15 || [...valor].length > 128) {
    throw new ErroHttp(400, 'SENHA_INVALIDA', 'A senha deve conter entre 15 e 128 caracteres.');
  }
  return valor; // Não remove espaços nem modifica a senha escolhida.
}

export async function protegerSenha(senha: string): Promise<string> {
  validarSenha(senha);
  const salt = randomBytes(16).toString('hex');
  const hash = await derivar(senha, salt);
  return `scrypt$32768$8$3$${salt}$${hash.toString('hex')}`;
}

// Mesmo trabalho criptográfico quando o usuário não existe, sem revelar cadastro.
const hashAusente = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export async function verificarSenha(senha: string, protegida?: string): Promise<boolean> {
  const formato = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
  const partes = formato.exec(protegida ?? '') ?? formato.exec(hashAusente)!;
  const calculado = await derivar(senha, partes[1]!);
  const igual = timingSafeEqual(calculado, Buffer.from(partes[2]!, 'hex'));
  return Boolean(protegida && formato.test(protegida) && igual);
}
