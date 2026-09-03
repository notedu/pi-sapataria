// EmConstrucao.tsx
// Placeholder genérico pra qualquer módulo que ainda não foi construído.
// Cada página real (Clientes.tsx, Dashboard.tsx etc.) usa esse componente
// até quem for dono daquele módulo substituir pelo conteúdo de verdade.

interface EmConstrucaoProps {
  titulo: string;
}

export default function EmConstrucao({ titulo }: EmConstrucaoProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-stone-50 p-8 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{titulo}</h1>
      <p className="mt-2 text-stone-500">
        Essa página ainda está em construção.
      </p>
    </div>
  );
}
