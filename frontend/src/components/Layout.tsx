import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Briefcase, CircleUserRound, LayoutGrid, LoaderCircle, LogOut, Menu, Package, Search, Settings, Users, Wallet, Wrench, X } from 'lucide-react';
import Sidebar, { type ItemMenu } from './Sidebar';
import { useAuth } from '../context/auth';
import { api } from '../services/api';

type OrdemServico = {
  id: number;
  descricao_item: string;
  status?: string | null;
  criado_em?: string | null;
};

type MateriaPrima = {
  id: number;
  nome: string;
  quantidade: number | string;
  quantidade_minima?: number | string | null;
  unidade_medida: string;
};

const ITENS_MENU: ItemMenu[] = [
  { rota: '/dashboard', label: 'Dashboard', icone: LayoutGrid },
  { rota: '/busca', label: 'Busca', icone: Search },
  { rota: '/clientes', label: 'Clientes', icone: Users },
  { rota: '/ordens-servico', label: 'Ordens de Serviço', icone: Wrench },
  { rota: '/financeiro', label: 'Financeiro', icone: Wallet },
  { rota: '/funcionarios', label: 'Funcionários', icone: Briefcase },
  { rota: '/estoque', label: 'Estoque', icone: Package },
];

const ITENS_RODAPE: ItemMenu[] = [
  { rota: '/configuracoes', label: 'Configurações', icone: Settings },
  { rota: null, label: 'Sair', icone: LogOut },
];

function notificacoesEstaoAtivas() {
  try {
    const configuracoes = window.localStorage.getItem('seda-e-couro-configuracoes');
    if (!configuracoes) return true;
    const preferencias = JSON.parse(configuracoes) as {
      preferencias?: { notificacoes?: boolean };
    };
    return preferencias.preferencias?.notificacoes !== false;
  } catch {
    return true;
  }
}

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    notificacoesEstaoAtivas
  );
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const carregarNotificacoes = useCallback(async () => {
    setCarregandoNotificacoes(true);
    try {
      const [ordensAtuais, materiasAtuais] = await Promise.all([
        api.get<OrdemServico[]>('/ordens-servico'),
        api.get<MateriaPrima[]>('/estoque-materia-prima'),
      ]);
      setOrdens(ordensAtuais);
      setMaterias(materiasAtuais);
    } catch {
      // A tela atual continua utilizável mesmo quando a consulta das notificações falhar.
    } finally {
      setCarregandoNotificacoes(false);
    }
  }, []);

  useEffect(() => {
    const sincronizarPreferencias = () =>
      setNotificacoesAtivas(notificacoesEstaoAtivas());
    window.addEventListener('configuracoes:atualizadas', sincronizarPreferencias);
    window.addEventListener('storage', sincronizarPreferencias);
    return () => {
      window.removeEventListener(
        'configuracoes:atualizadas',
        sincronizarPreferencias
      );
      window.removeEventListener('storage', sincronizarPreferencias);
    };
  }, []);

  useEffect(() => {
    if (!notificacoesAtivas) return;
    const consultaInicial = window.setTimeout(() => {
      void carregarNotificacoes();
    }, 0);
    return () => window.clearTimeout(consultaInicial);
  }, [carregarNotificacoes, notificacoesAtivas]);

  const ordensPendentes = useMemo(
    () =>
      ordens
        .filter(ordem => (ordem.status ?? 'Pendente').toLowerCase() === 'pendente')
        .sort((a, b) =>
          String(b.criado_em ?? '').localeCompare(String(a.criado_em ?? ''))
        )
        .slice(0, 5),
    [ordens]
  );
  const materiaisComEstoqueBaixo = useMemo(
    () =>
      materias
        .filter(materia => {
          const minimo = Number(materia.quantidade_minima ?? 0);
          return minimo > 0 && Number(materia.quantidade) <= minimo;
        })
        .slice(0, 5),
    [materias]
  );
  const totalNotificacoes = notificacoesAtivas
    ? ordensPendentes.length + materiaisComEstoqueBaixo.length
    : 0;

  function abrirNotificacoes() {
    setNotificacoesAbertas(abertas => !abertas);
    if (notificacoesAtivas) void carregarNotificacoes();
  }

  function irPara(rota: string) {
    setNotificacoesAbertas(false);
    navegar(rota);
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <Sidebar aberto={menuAberto} aoFechar={() => setMenuAberto(false)} itens={ITENS_MENU} itensRodape={ITENS_RODAPE} />
      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#c4c6d4]/40 bg-[#f9f9ff]/95 px-5 backdrop-blur md:px-16">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menu" className="rounded-md p-2 text-[#444652] hover:bg-[#e5e8f3] md:hidden" onClick={() => setMenuAberto(true)} type="button"><Menu aria-hidden="true" className="size-5" /></button>
            <span className="text-xl font-bold text-[#002c7c] md:text-2xl">Seda e Couro</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="relative hidden sm:block">
              <span className="sr-only">Buscar clientes</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
              <input className="w-56 rounded-full border border-[#747683] bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20 lg:w-64" placeholder="Buscar clientes..." type="search" />
            </label>
            <div className="relative">
              <button aria-controls="painel-notificacoes" aria-expanded={notificacoesAbertas} aria-label="Notificações" className="relative rounded-full p-2 text-[#444652] transition hover:bg-[#e5e8f3]" onClick={abrirNotificacoes} type="button">
                <Bell aria-hidden="true" className="size-5" />
                {totalNotificacoes > 0 && <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#ba1a1a] text-[10px] font-bold text-white">{totalNotificacoes > 9 ? '9+' : totalNotificacoes}</span>}
              </button>
              {notificacoesAbertas && <PainelNotificacoes carregando={carregandoNotificacoes} desativadas={!notificacoesAtivas} materiais={materiaisComEstoqueBaixo} ordens={ordensPendentes} aoFechar={() => setNotificacoesAbertas(false)} aoIrPara={irPara} />}
            </div>
            <button aria-label="Conta" className="rounded-full p-2 text-[#444652] hover:bg-[#e5e8f3]" type="button"><CircleUserRound aria-hidden="true" className="size-6" /></button>
            <div aria-hidden="true" className="hidden size-8 items-center justify-center rounded-full bg-[#d7e2ff] text-xs font-bold text-[#002c7c] sm:flex">{usuario?.nome.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

function PainelNotificacoes({
  carregando,
  desativadas,
  ordens,
  materiais,
  aoFechar,
  aoIrPara,
}: {
  carregando: boolean;
  desativadas: boolean;
  ordens: OrdemServico[];
  materiais: MateriaPrima[];
  aoFechar: () => void;
  aoIrPara: (rota: string) => void;
}) {
  const vazio = !carregando && ordens.length === 0 && materiais.length === 0;

  return (
    <section aria-label="Painel de notificações" className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl border border-[#c4c6d4] bg-white shadow-xl" id="painel-notificacoes">
      <header className="flex items-center justify-between border-b border-[#c4c6d4]/60 px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#181c23]">Notificações</h2>
          <p className="text-xs text-[#747683]">Ordens e estoque que precisam de atenção</p>
        </div>
        <button aria-label="Fechar notificações" className="rounded-md p-1.5 text-[#444652] transition hover:bg-[#e5e8f3]" onClick={aoFechar} type="button"><X aria-hidden="true" className="size-4" /></button>
      </header>
      <div className="max-h-[min(28rem,calc(100dvh-5rem))] overflow-y-auto">
        {desativadas && <p className="px-4 py-10 text-center text-sm text-[#747683]">As notificações estão desativadas nas Configurações.</p>}
        {!desativadas && carregando && <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-[#444652]"><LoaderCircle aria-hidden="true" className="size-4 animate-spin text-[#002c7c]" />Carregando notificações...</div>}
        {!desativadas && vazio && <p className="px-4 py-10 text-center text-sm text-[#747683]">Nenhuma notificação no momento.</p>}
        {!desativadas && ordens.length > 0 && <GrupoNotificacoes titulo="Ordens de serviço pendentes" icone={Wrench}>
          {ordens.map(ordem => <button className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f1f3fe]" key={ordem.id} onClick={() => aoIrPara(`/ordens-servico/${ordem.id}`)} type="button"><span className="mt-0.5 rounded-full bg-[#fff0c9] p-2 text-[#7a5200]"><Wrench aria-hidden="true" className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-sm text-[#181c23]">OS #{ordem.id} aguardando atendimento</strong><span className="mt-0.5 block truncate text-xs text-[#605e59]">{ordem.descricao_item}</span></span></button>)}
        </GrupoNotificacoes>}
        {!desativadas && materiais.length > 0 && <GrupoNotificacoes titulo="Estoque baixo" icone={AlertTriangle}>
          {materiais.map(materia => <button className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f1f3fe]" key={materia.id} onClick={() => aoIrPara('/estoque')} type="button"><span className="mt-0.5 rounded-full bg-[#ffefed] p-2 text-[#ba1a1a]"><AlertTriangle aria-hidden="true" className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-sm text-[#181c23]">{materia.nome}</strong><span className="mt-0.5 block text-xs text-[#a22929]">{materia.quantidade} de {materia.quantidade_minima} {materia.unidade_medida}</span></span></button>)}
        </GrupoNotificacoes>}
      </div>
    </section>
  );
}

function GrupoNotificacoes({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Wrench; children: React.ReactNode }) {
  return <section className="border-b border-[#c4c6d4]/60 last:border-0"><h3 className="flex items-center gap-2 bg-[#f7f8ff] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#444652]"><Icone aria-hidden="true" className="size-4 text-[#002c7c]" />{titulo}</h3>{children}</section>;
}
