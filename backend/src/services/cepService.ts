// Formato do que a API do ViaCEP devolve quando o CEP é válido
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean; // a API do ViaCEP manda "erro: true" quando o CEP não existe
}

export interface Endereco {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Busca um endereço na API externa do ViaCEP a partir do CEP.
// Retorna o endereço formatado, ou null se o CEP não existir.
export async function buscarEnderecoPorCep(
  cep: string,
): Promise<Endereco | null> {
  // remove qualquer caractere que não seja número (ex: "13870-000" -> "13870000")
  const cepLimpo = cep.replace(/\D/g, "");

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  const dados: ViaCepResponse = await response.json();

  // o ViaCEP não usa status HTTP de erro (404) para CEP inválido;
  // em vez disso, ele devolve { "erro": true } no corpo da resposta
  if (dados.erro) {
    return null;
  }

  return {
    cep: dados.cep,
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf,
  };
}
