import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from 'lucide-react';

const clientes = [
  { id: 1, nome: 'Carlos Silva', telefone: '(11) 98765-4321', visita: '12 Out 2023', pedidos: 14 },
  { id: 2, nome: 'Ana Beatriz Oliveira', telefone: '(11) 91234-5678', visita: '05 Nov 2023', pedidos: 8 },
  { id: 3, nome: 'Roberto Souza', telefone: '(21) 99887-7665', visita: '20 Nov 2023', pedidos: 2 },
  { id: 4, nome: 'Fernanda Lima', telefone: '(31) 97766-5544', visita: 'Ontem', pedidos: 25 },
  { id: 5, nome: 'Juliana Costa', telefone: '(41) 96655-4433', visita: 'Hoje', pedidos: 1 },
];

export default function Clientes() {
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const clientesFiltrados = useMemo(() => clientes.filter(cliente => `${cliente.nome} ${cliente.telefone}`.toLowerCase().includes(busca.toLowerCase())), [busca]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1200px] flex-col gap-6 px-5 py-7 sm:px-8 md:px-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl lg:text-5xl">Gestão de Clientes</h1>
          <p className="mt-2 text-base text-[#444652] sm:text-lg">Gerencie seus clientes, histórico de visitas e informações de contato.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d439c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002c7c] focus-visible:ring-offset-2" onClick={() => setMensagem('O formulário de cadastro será a próxima tela a ser implementada.')} type="button"><Plus aria-hidden="true" className="size-4" />Adicionar Cliente</button>
      </div>

      <label className="relative sm:hidden">
        <span className="sr-only">Buscar clientes</span>
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
        <input className="w-full rounded-lg border border-[#747683] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20" onChange={event => setBusca(event.target.value)} placeholder="Buscar clientes..." type="search" value={busca} />
      </label>
      {mensagem && <p aria-live="polite" className="text-sm text-[#444652]">{mensagem}</p>}

      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#c4c6d4]/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-[#c4c6d4]/60 bg-[#f1f3fe] text-xs uppercase tracking-wide text-[#444652]"><tr><th className="px-6 py-4 font-semibold">Nome</th><th className="px-6 py-4 font-semibold">Telefone</th><th className="px-6 py-4 font-semibold">Última visita</th><th className="px-6 py-4 text-right font-semibold">Total de pedidos</th><th className="px-6 py-4 text-right font-semibold">Ações</th></tr></thead>
            <tbody className="text-sm">
              {clientesFiltrados.map(cliente => {
                const visitaRecente = cliente.visita === 'Hoje' || cliente.visita === 'Ontem';
                return <tr className="group border-b border-[#c4c6d4]/55 last:border-0 hover:bg-[#f1f3fe]/45" key={cliente.id}>
                  <td className="px-6 py-5 font-semibold text-[#002c7c]">{cliente.nome}</td><td className="px-6 py-5 text-[#444652]">{cliente.telefone}</td>
                  <td className="px-6 py-5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${visitaRecente ? 'bg-[#1d439c] text-white' : 'bg-[#e6e2db] text-[#605e59]'}`}>{cliente.visita}</span></td>
                  <td className="px-6 py-5 text-right font-semibold text-[#181c23]">{cliente.pedidos}</td>
                  <td className="px-6 py-5 text-right"><button aria-label={`Editar ${cliente.nome}`} className="rounded-full p-2 text-[#605e59] transition hover:bg-[#e5e8f3] hover:text-[#002c7c] focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => setMensagem(`A edição de ${cliente.nome} será incluída na tela de cadastro.`)} type="button"><Pencil aria-hidden="true" className="size-4" /></button></td>
                </tr>;
              })}
              {clientesFiltrados.length === 0 && <tr><td className="px-6 py-12 text-center text-[#444652]" colSpan={5}>Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="mt-auto flex flex-col gap-3 border-t border-[#c4c6d4]/60 px-6 py-4 text-sm text-[#444652] sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando 1 a {clientesFiltrados.length} de 42 clientes</span>
          <div className="flex gap-2 self-end sm:self-auto"><button aria-label="Página anterior" className="rounded-lg border border-[#c4c6d4] p-2 text-[#747683] disabled:opacity-40" disabled type="button"><ChevronLeft aria-hidden="true" className="size-4" /></button><button aria-label="Próxima página" className="rounded-lg border border-[#c4c6d4] p-2 text-[#444652] transition hover:bg-[#f1f3fe]" type="button"><ChevronRight aria-hidden="true" className="size-4" /></button></div>
        </footer>
      </section>
    </div>
  );
}
