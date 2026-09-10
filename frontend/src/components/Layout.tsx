import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, Briefcase, FileText, LayoutGrid, LoaderCircle, LogOut, Menu, Package, Search, Settings, Users, Wallet, Wrench, X } from 'lucide-react';
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

type ClienteBusca = {
  id: number;
  nome: string;
  telefone: string;
  cpf?: string;
};

type FuncionarioBusca = {
  id: number;
  nome: string;
  cargo: string;
  cpf?: string;
  telefone?: string;
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
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [dadosBuscaCarregados, setDadosBuscaCarregados] = useState(false);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [clientesBusca, setClientesBusca] = useState<ClienteBusca[]>([]);
  const [funcionariosBusca, setFuncionariosBusca] = useState<FuncionarioBusca[]>([]);
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

  async function abrirBusca() {
    setBuscaAberta(true);
    if (dadosBuscaCarregados || carregandoBusca) return;
    setCarregandoBusca(true);
    try {
      const [clientesAtuais, ordensAtuais, funcionariosAtuais] = await Promise.all([
        api.get<ClienteBusca[]>('/clientes'),
        api.get<OrdemServico[]>('/ordens-servico'),
        api.get<FuncionarioBusca[]>('/funcionarios'),
      ]);
      setClientesBusca(clientesAtuais);
      setOrdens(ordensAtuais);
      setFuncionariosBusca(funcionariosAtuais);
      setDadosBuscaCarregados(true);
    } finally {
      setCarregandoBusca(false);
    }
  }

  function irParaBusca(rota: string) {
    setBuscaAberta(false);
    navegar(rota);
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <Sidebar aberto={menuAberto} aoFechar={() => setMenuAberto(false)} itens={ITENS_MENU} itensRodape={ITENS_RODAPE} />
      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#c4c6d4]/40 bg-[#f9f9ff]/95 px-5 backdrop-blur md:px-16">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menu" className="rounded-md p-2 text-[#444652] hover:bg-[#e5e8f3] md:hidden" onClick={() => setMenuAberto(true)} type="button"><Menu aria-hidden="true" className="size-5" /></button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button aria-haspopup="dialog" className="relative hidden text-left sm:block" onClick={() => void abrirBusca()} type="button">
              <span className="sr-only">Buscar no sistema</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
              <span className="block w-56 rounded-full border border-[#747683] bg-white py-2 pl-10 pr-4 text-sm text-[#747683] transition hover:border-[#002c7c] lg:w-72">Buscar no sistema...</span>
            </button>
            <div className="relative">
              <button aria-controls="painel-notificacoes" aria-expanded={notificacoesAbertas} aria-label="Notificações" className="relative rounded-full p-2 text-[#444652] transition hover:bg-[#e5e8f3]" onClick={abrirNotificacoes} type="button">
                <Bell aria-hidden="true" className="size-5" />
                {totalNotificacoes > 0 && <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#ba1a1a] text-[10px] font-bold text-white">{totalNotificacoes > 9 ? '9+' : totalNotificacoes}</span>}
              </button>
              {notificacoesAbertas && <PainelNotificacoes carregando={carregandoNotificacoes} desativadas={!notificacoesAtivas} materiais={materiaisComEstoqueBaixo} ordens={ordensPendentes} aoFechar={() => setNotificacoesAbertas(false)} aoIrPara={irPara} />}
            </div>
            <div aria-hidden="true" className="hidden size-8 items-center justify-center rounded-full bg-[#d7e2ff] text-xs font-bold text-[#002c7c] sm:flex">{usuario?.nome.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main className="min-w-0"><Outlet /></main>
        {buscaAberta && <PaletaBusca carregando={carregandoBusca} clientes={clientesBusca} funcionarios={funcionariosBusca} ordens={ordens} aoFechar={() => setBuscaAberta(false)} aoIrPara={irParaBusca} />}
      </div>
    </div>
  );
}

function PaletaBusca({
  carregando,
  clientes,
  funcionarios,
  ordens,
  aoFechar,
  aoIrPara,
}: {
  carregando: boolean;
  clientes: ClienteBusca[];
  funcionarios: FuncionarioBusca[];
  ordens: OrdemServico[];
  aoFechar: () => void;
  aoIrPara: (rota: string) => void;
}) {
  const [termo, setTermo] = useState('');
  const termoNormalizado = termo.trim().toLowerCase();
  const clientesFiltrados = termoNormalizado
    ? clientes.filter(cliente =>
        `${cliente.nome} ${cliente.telefone} ${cliente.cpf ?? ''}`
          .toLowerCase()
          .includes(termoNormalizado)
      )
    : [];
  const ordensFiltradas = termoNormalizado
    ? ordens.filter(ordem =>
        `${ordem.id} ${ordem.descricao_item} ${ordem.status ?? ''}`
          .toLowerCase()
          .includes(termoNormalizado)
      )
    : [];
  const funcionariosFiltrados = termoNormalizado
    ? funcionarios.filter(funcionario =>
        `${funcionario.nome} ${funcionario.cargo} ${funcionario.cpf ?? ''} ${funcionario.telefone ?? ''}`
          .toLowerCase()
          .includes(termoNormalizado)
      )
    : [];

  function pesquisar() {
    if (!termo.trim()) return;
    aoIrPara(`/busca?q=${encodeURIComponent(termo.trim())}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[#181c23]/45 px-4 pt-[10dvh] backdrop-blur-sm" onMouseDown={aoFechar}>
      <section aria-label="Busca global" aria-modal="true" className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#c4c6d4] bg-white shadow-2xl" onMouseDown={evento => evento.stopPropagation()} role="dialog">
        <div className="relative border-b border-[#c4c6d4]/60">
          <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
          <input autoFocus className="w-full bg-white py-4 pl-12 pr-12 text-base text-[#181c23] outline-none placeholder:text-[#747683]" onChange={evento => setTermo(evento.target.value)} onKeyDown={evento => { if (evento.key === 'Escape') aoFechar(); if (evento.key === 'Enter') pesquisar(); }} placeholder="Buscar clientes, ordens ou páginas..." type="search" value={termo} />
          <button aria-label="Fechar busca" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#444652] transition hover:bg-[#e5e8f3]" onClick={aoFechar} type="button"><X aria-hidden="true" className="size-4" /></button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-2">
          {carregando && <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#444652]"><LoaderCircle aria-hidden="true" className="size-4 animate-spin text-[#002c7c]" />Preparando busca...</div>}
          {!carregando && !termoNormalizado && <>
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-[#747683]">Ações rápidas</p>
            <AcaoBusca icone={Wrench} texto="Nova ordem de serviço" aoSelecionar={() => aoIrPara('/ordens-servico/nova')} />
            <AcaoBusca icone={Package} texto="Consultar estoque" aoSelecionar={() => aoIrPara('/estoque')} />
            <AcaoBusca icone={Briefcase} texto="Gerenciar funcionários" aoSelecionar={() => aoIrPara('/funcionarios')} />
            <AcaoBusca icone={FileText} texto="Ver financeiro" aoSelecionar={() => aoIrPara('/financeiro')} />
          </>}
          {!carregando && termoNormalizado && <>
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-[#747683]">Resultados</p>
            {ordensFiltradas.slice(0, 4).map(ordem => <AcaoBusca descricao={ordem.descricao_item} icone={Wrench} key={`ordem-${ordem.id}`} texto={`OS #${ordem.id} · ${ordem.status ?? 'Pendente'}`} aoSelecionar={() => aoIrPara(`/ordens-servico/${ordem.id}`)} />)}
            {clientesFiltrados.slice(0, 4).map(cliente => <AcaoBusca descricao={cliente.telefone} icone={Users} key={`cliente-${cliente.id}`} texto={cliente.nome} aoSelecionar={() => aoIrPara(`/busca?q=${encodeURIComponent(cliente.nome)}`)} />)}
            {funcionariosFiltrados.slice(0, 4).map(funcionario => <AcaoBusca descricao={funcionario.cargo} icone={Briefcase} key={`funcionario-${funcionario.id}`} texto={funcionario.nome} aoSelecionar={() => aoIrPara(`/funcionarios/${funcionario.id}`)} />)}
            {ordensFiltradas.length === 0 && clientesFiltrados.length === 0 && funcionariosFiltrados.length === 0 && <p className="px-3 py-8 text-center text-sm text-[#747683]">Nenhum resultado encontrado.</p>}
            {(ordensFiltradas.length > 0 || clientesFiltrados.length > 0 || funcionariosFiltrados.length > 0) && <button className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#002c7c] transition hover:bg-[#f1f3fe]" onClick={pesquisar} type="button">Ver todos os resultados <ArrowRight aria-hidden="true" className="size-4" /></button>}
          </>}
        </div>
        <footer className="flex items-center justify-between border-t border-[#c4c6d4]/60 px-4 py-2.5 text-xs text-[#747683]"><span>Pressione Enter para pesquisar</span><span>Esc para fechar</span></footer>
      </section>
    </div>
  );
}

function AcaoBusca({ icone: Icone, texto, descricao, aoSelecionar }: { icone: typeof Search; texto: string; descricao?: string; aoSelecionar: () => void }) {
  return <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[#f1f3fe]" onClick={aoSelecionar} type="button"><span className="rounded-md bg-[#edf1ff] p-2 text-[#002c7c]"><Icone aria-hidden="true" className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#181c23]">{texto}</strong>{descricao && <span className="mt-0.5 block truncate text-xs text-[#605e59]">{descricao}</span>}</span><ArrowRight aria-hidden="true" className="size-4 text-[#747683]" /></button>;
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
