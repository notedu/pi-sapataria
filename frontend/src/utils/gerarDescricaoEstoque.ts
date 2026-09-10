type DadosDescricaoEstoque = {
  tipo: 'materia-prima' | 'produtos';
  categoria: string;
  unidade: string;
  fornecedor?: string;
};

const MODELOS_MATERIA_PRIMA: Record<string, string> = {
  Couros: 'Material indicado para confecção e reparos de calçados artesanais.',
  Solados: 'Componente indicado para substituição e montagem de calçados.',
  Ferragens: 'Componente utilizado em ajustes, fixações e acabamentos de calçados.',
  'Colas e adesivos': 'Produto indicado para colagem e reparos de componentes de calçados.',
  'Linhas e costura': 'Material indicado para costura, reforço e acabamento de peças.',
  Tintas: 'Produto indicado para acabamento, renovação e conservação de calçados.',
  'Tintas e acabamentos': 'Produto indicado para acabamento e proteção de peças em couro.',
  'Palmilhas e espumas': 'Material indicado para conforto, ajuste e acabamento interno.',
  'Materiais de limpeza': 'Produto indicado para limpeza e conservação de calçados.',
  Embalagens: 'Material indicado para proteção e apresentação dos produtos.',
};

const MODELOS_PRODUTOS: Record<string, string> = {
  Calçados: 'Calçado disponível para venda, com acabamento pensado para conforto e durabilidade.',
  Acessórios: 'Acessório disponível para complementar o uso e o cuidado dos calçados.',
  Palmilhas: 'Produto disponível para venda, indicado para conforto e melhor ajuste do calçado.',
  'Produtos para cuidado': 'Produto disponível para limpeza, proteção e conservação de calçados.',
  Bolsas: 'Produto disponível para venda, produzido para uso diário e boa durabilidade.',
};

export function gerarDescricaoEstoque({
  tipo,
  categoria,
  unidade,
  fornecedor,
}: DadosDescricaoEstoque) {
  const modelo =
    (tipo === 'materia-prima' ? MODELOS_MATERIA_PRIMA : MODELOS_PRODUTOS)[
      categoria
    ] ??
    (tipo === 'materia-prima'
      ? 'Material utilizado nos serviços e reparos realizados pela sapataria.'
      : 'Produto disponível para venda na sapataria.');
  const complemento =
    tipo === 'materia-prima'
      ? ` Unidade de medida: ${unidade}.${fornecedor?.trim() ? ` Fornecido por ${fornecedor.trim()}.` : ''}`
      : '';

  return `${modelo}${complemento}`.slice(0, 200);
}
