const avancos: Record<string, string> = {
  Aberta: 'Em andamento',
  'Em andamento': 'Pronta',
  Pronta: 'Entregue',
};

const retornos: Record<string, string> = {
  'Em andamento': 'Aberta',
  Pronta: 'Em andamento',
  Entregue: 'Pronta',
};

export function transicaoOsPermitida(atual: string, novo: string): boolean {
  if (atual === 'Cancelada') return false;
  if (novo === 'Cancelada')
    return ['Aberta', 'Em andamento', 'Pronta'].includes(atual);
  return avancos[atual] === novo || retornos[atual] === novo;
}
