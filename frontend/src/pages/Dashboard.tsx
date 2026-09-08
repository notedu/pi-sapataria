import { useEffect, useMemo, useState } from 'react';
import { Bell, CircleDollarSign, ClipboardList, LoaderCircle, Plus, Truck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

type Ordem = { id: number; cliente_id: number; servico_id: number; descricao_item: string; valor_servico: string | number; status?: string };
type Cliente = { id: number; nome: string; telefone: string };
type Servico = { id: number; nome: string };
const etapas = ['Pendente', 'Em andamento', 'Concluído'];

export default function Dashboard() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.get<Ordem[]>('/ordens-servico'), api.get<Cliente[]>('/clientes'), api.get<Servico[]>('/servicos')])
      .then(([listaOrdens, listaClientes, listaServicos]) => { setOrdens(listaOrdens); setClientes(listaClientes); setServicos(listaServicos); })
      .catch(() => setErro('Não foi possível carregar os dados. Confirme se a API está em execução.'))
      .finally(() => setCarregando(false));
  }, []);

  const clientePorId = useMemo(() => new Map(clientes.map(cliente => [cliente.id, cliente])), [clientes]);
  const servicoPorId = useMemo(() => new Map(servicos.map(servico => [servico.id, servico.nome])), [servicos]);
  const receita = ordens.reduce((total, ordem) => total + Number(ordem.valor_servico), 0);
  const avancar = async (ordem: Ordem) => {
    const indice = etapas.indexOf(ordem.status ?? 'Pendente');
    if (indice === etapas.length - 1) return;
    const status = etapas[indice + 1];
    try { const atualizada = await api.put<Ordem>(`/ordens-servico/${ordem.id}`, { ...ordem, status }); setOrdens(lista => lista.map(item => item.id === ordem.id ? atualizada : item)); }
    catch { setErro('Não foi possível atualizar o status da ordem.'); }
  };
  const dados = [
    { titulo: 'Ordens abertas', valor: ordens.length, detalhe: 'Serviços cadastrados', icone: ClipboardList, cor: 'bg-red-100 text-red-800' },
    { titulo: 'Faturamento', valor: receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), detalhe: 'Total das ordens', icone: CircleDollarSign, cor: 'bg-[#d7e2ff] text-[#002c7c]' },
    { titulo: 'Em andamento', valor: ordens.filter(ordem => ordem.status === 'Em andamento').length, detalhe: 'Na oficina agora', icone: Wrench, cor: 'bg-[#dbe1ff] text-[#002c7c]' },
    { titulo: 'Concluídas', valor: ordens.filter(ordem => ordem.status === 'Concluído').length, detalhe: 'Prontas para retirada', icone: Truck, cor: 'bg-[#e6e2db] text-[#605e59]' },
  ];

  return <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-[1280px] px-5 py-7 sm:px-8 md:px-16">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">Olá, Ricardo!</h1><p className="mt-1 text-[#605e59]">Acompanhe a operação da sapataria em tempo real.</p></div><div className="flex gap-3"><button aria-label="Notificações" className="rounded-full border border-[#002c7c]/20 p-2.5 text-[#002c7c]"><Bell className="size-5" /></button><Link className="inline-flex items-center gap-2 rounded-lg bg-[#002c7c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d439c]" to="/ordens-servico"><Plus className="size-5" />Nova ordem</Link></div></header>
    {erro && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erro}</p>}
    {carregando ? <div className="flex justify-center py-24 text-[#002c7c]"><LoaderCircle className="size-7 animate-spin" /></div> : <><section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dados.map(dado => { const Icone = dado.icone; return <article className="flex items-center gap-4 rounded-xl border border-[#002c7c]/20 bg-white p-4" key={dado.titulo}><span className={`rounded-lg p-3 ${dado.cor}`}><Icone className="size-6" /></span><div><p className="text-xs font-medium tracking-wide text-[#605e59]">{dado.titulo}</p><p className="mt-1 text-2xl font-semibold text-[#181c23]">{dado.valor}</p><p className="text-xs text-[#605e59]">{dado.detalhe}</p></div></article>; })}</section>
    <section className="mt-8 rounded-xl border border-[#002c7c]/20 bg-[#f1f3fe] p-4 sm:p-6"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-2xl font-semibold text-[#181c23]">Fluxo de ordens</h2><p className="mt-1 text-sm text-[#605e59]">Organize os reparos conforme cada etapa do atendimento.</p></div><Link className="text-sm font-semibold text-[#002c7c] hover:underline" to="/ordens-servico">Ver listagem completa</Link></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{etapas.map((etapa, indice) => { const lista = ordens.filter(ordem => (ordem.status ?? 'Pendente') === etapa); return <div key={etapa}><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#181c23]"><span className={`size-2 rounded-full ${indice === 0 ? 'bg-red-600' : indice === 1 ? 'bg-[#1d439c]' : 'bg-emerald-600'}`} />{etapa}<span className="rounded-full bg-[#dfe2ed] px-2 py-0.5 text-xs text-[#605e59]">{lista.length}</span></div><div className="space-y-3">{lista.map(ordem => { const cliente = clientePorId.get(ordem.cliente_id); return <article className="rounded-xl border border-[#002c7c]/20 bg-white p-4" key={ordem.id}><div className="flex justify-between"><span className="font-semibold text-red-700">#{ordem.id}</span><span className="text-sm font-semibold text-[#181c23]">{Number(ordem.valor_servico).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div><p className="mt-3 font-semibold text-[#181c23]">{cliente?.nome ?? `Cliente #${ordem.cliente_id}`}</p><p className="text-sm text-[#605e59]">{cliente?.telefone ?? 'Sem telefone'}</p><div className="mt-3 rounded-lg bg-[#f1f3fe] px-3 py-2 text-sm text-[#444652]">{servicoPorId.get(ordem.servico_id) ?? 'Serviço'} · {ordem.descricao_item}</div>{indice < 2 && <button className="mt-3 w-full rounded-lg border border-[#002c7c]/25 py-2 text-xs font-semibold text-[#002c7c] hover:bg-[#f1f3fe]" onClick={() => avancar(ordem)} type="button">Mover para {etapas[indice + 1]}</button>}</article>; })}{lista.length === 0 && <p className="rounded-xl border border-dashed border-[#c4c6d4] px-4 py-8 text-center text-sm text-[#747683]">Sem ordens nesta etapa.</p>}</div></div>; })}</div></section></>}
  </div>;
}
