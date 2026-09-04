// api.ts
// Wrapper genérico sobre o fetch nativo do navegador.
// Ideia: em vez de repetir "fetch(url, {headers...})" e tratar erro
// em cada arquivo de service, centralizamos essa lógica aqui uma vez só.

const BASE_URL = import.meta.env.VITE_API_URL;

// Erro customizado: guarda o status HTTP junto, pra quem chamar
// poder decidir o que fazer (ex: 404 vs 500 podem exigir tratamento diferente).
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Função central: monta a URL completa, faz o fetch e já devolve o JSON
// tipado (usamos Generics <T> pra cada service dizer qual formato espera).
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // O backend sempre responde JSON, mesmo em erro (ex: { erro: "..." }),
  // então lemos o corpo antes de decidir se foi sucesso ou falha.
  const data = await response.json();

  if (!response.ok) {
    // Reaproveita a mensagem de erro que o controller do backend já manda
    throw new ApiError(data.erro || 'Erro na requisição', response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
