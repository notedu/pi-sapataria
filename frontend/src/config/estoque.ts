import type { TipoEstoque } from '../services/estoque'

// Sugestões, não um catálogo fechado. As categorias existentes continuam válidas.
export const categoriasSugeridas: Record<TipoEstoque, string[]> = {
  produtos: ['Palmilhas', 'Cadarços', 'Calçados'],
  materiais: ['Cola'],
}
export function unidadesDaCategoria(categoria: string): string[] {
  return ['cola', 'colas'].includes(categoria.trim().toLocaleLowerCase('pt-BR'))
    ? ['kg', 'g']
    : []
}
