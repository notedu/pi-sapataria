// Erros esperados podem ser apresentados sem expor detalhes internos.
export class ErroHttp extends Error {
  constructor(public status: number, public codigo: string, mensagem: string) {
    super(mensagem);
  }
}

export function objeto(valor: unknown, campos: string[]): Record<string, unknown> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', 'Envie um objeto JSON.');
  }
  const dados = valor as Record<string, unknown>;
  if (Object.keys(dados).some((campo) => !campos.includes(campo))) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Campos aceitos: ${campos.join(', ')}.`);
  }
  return dados;
}

export function texto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErroHttp(400, 'DADOS_INVALIDOS', `Informe ${campo} como texto não vazio.`);
  }
  return valor.trim();
}

export function idValido(valor: unknown): number {
  const id = Number(valor);
  if (typeof valor !== 'string' || !/^\d+$/.test(valor) || !Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new ErroHttp(400, 'ID_INVALIDO', 'Informe um ID inteiro positivo válido.');
  }
  return id;
}
