import { idCorpo } from './operacoes';
import { ErroHttp } from './validacao';

// Ausência preserva vínculos na edição; [] remove explicitamente a seleção.
export function fornecedoresIds(valor: unknown): number[] | undefined {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor)) throw new ErroHttp(400, 'FORNECEDOR_INVALIDO', 'Informe uma lista de fornecedores.');
  const ids = valor.map(idCorpo);
  if (new Set(ids).size !== ids.length) throw new ErroHttp(400, 'FORNECEDOR_INVALIDO', 'Não repita fornecedores.');
  return ids;
}
