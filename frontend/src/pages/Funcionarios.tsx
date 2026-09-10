import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { ApiError, api } from '../services/api';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Funcionario = {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  genero?: string | null;
  cargo: string;
  status: string;
  data_admissao: string;
};
type OrdemServico = {
  id: number;
  cliente_id?: number | null;
  funcionario_id?: number | null;
  descricao_item: string;
  status: string;
  criado_em?: string | null;
};
type Cliente = {
  id: number;
  nome: string;
};
type OrdemDoFuncionario = OrdemServico & {
  clienteNome: string;
};
type DadosFormulario = Omit<Funcionario, 'id'>;

const CARGOS = [
  'Sapateiro Master',
  'Sapateiro',
  'Atendente',
  'Aprendiz',
  'Gerente',
  'Caixa',
];
const GENEROS = ['Feminino', 'Masculino', 'Não informar'];
const dadosIniciais = (): DadosFormulario => ({
  nome: '',
  cpf: '',
  telefone: '',
  genero: '',
  cargo: '',
  status: 'Ativo',
  data_admissao: new Date().toISOString().slice(0, 10),
});

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase();
}
function formatarData(data?: string) {
  if (!data) return 'Não informado';
  const valor = new Date(`${data.slice(0, 10)}T12:00:00`);
  return Number.isNaN(valor.getTime())
    ? data
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(valor);
}
function classeCargo(cargo: string) {
  const estilos: Record<string, string> = {
    'Sapateiro Master': 'bg-[#d7e2ff] text-[#18325c]',
    Sapateiro: 'bg-[#d7e2ff] text-[#18325c]',
    Atendente: 'bg-[#ffe1d7] text-[#7a3321]',
    Aprendiz: 'bg-[#e5e8f3] text-[#444652]',
    Gerente: 'bg-[#e6e2db] text-[#605e59]',
  };
  return estilos[cargo] ?? 'bg-[#e5e8f3] text-[#444652]';
}
function classeStatus(status: string) {
  return status.toLowerCase() === 'ativo'
    ? 'bg-[#d9f7e7] text-[#256b43]'
    : 'bg-[#ffe0df] text-[#a22929]';
}
function classeStatusOrdem(status: string) {
  const statusNormalizado = status.toLowerCase();
  if (statusNormalizado.includes('conclu')) {
    return 'bg-[#d9f7e7] text-[#256b43]';
  }
  if (statusNormalizado.includes('cancel')) {
    return 'bg-[#ffe0df] text-[#a22929]';
  }
  if (statusNormalizado.includes('andamento')) {
    return 'bg-[#d7e2ff] text-[#18325c]';
  }
  return 'bg-[#fff0c9] text-[#7a5200]';
}
function mensagemErro(erro: unknown) {
  return erro instanceof ApiError
    ? erro.message
    : 'Não foi possível comunicar com a API. Verifique se o back-end está em execução.';
}
function formatarCpf(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9)
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}
function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 2) return numeros ? `(${numeros}` : '';
  if (numeros.length <= 6)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  const inicio = numeros.length === 11 ? 7 : 6;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, inicio)}-${numeros.slice(inicio)}`;
}

export default function Funcionarios() {
  const { t } = useTranslation(['funcionarios', 'common']);
  const navegar = useNavigate();
  const localizacao = useLocation();
  const { id: idDaRota } = useParams<{ id?: string }>();
  const criando = localizacao.pathname === '/funcionarios/novo';
  const editandoRota = Boolean(
    idDaRota && localizacao.pathname.endsWith('/editar')
  );
  const perfilRota = Boolean(idDaRota && !editandoRota);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [notificacaoTemporaria, setNotificacaoTemporaria] = useState('');
  const [selecionado, setSelecionado] = useState<Funcionario | null>(null);
  const [dados, setDados] = useState<DadosFormulario>(dadosIniciais);
  const [ordens, setOrdens] = useState<OrdemDoFuncionario[]>([]);
  const [carregandoOrdens, setCarregandoOrdens] = useState(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] =
    useState<Funcionario | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo
      ? funcionarios.filter(funcionario =>
          `${funcionario.nome} ${funcionario.cpf} ${funcionario.telefone} ${funcionario.cargo}`
            .toLowerCase()
            .includes(termo)
        )
      : funcionarios;
  }, [busca, funcionarios]);

  async function carregarFuncionarios() {
    setCarregando(true);
    setErro('');
    try {
      setFuncionarios(await api.get<Funcionario[]>('/funcionarios'));
    } catch (erroAtual) {
      setErro(mensagemErro(erroAtual));
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => {
    const carregamentoInicial = window.setTimeout(() => {
      void carregarFuncionarios();
    }, 0);
    return () => window.clearTimeout(carregamentoInicial);
  }, []);

  async function carregarPerfil(funcionario: Funcionario) {
    setSelecionado(funcionario);
    setErro('');
    setAviso('');
    setOrdens([]);
    setCarregandoOrdens(true);
    try {
      const [respostaOrdens, respostaClientes] = await Promise.all([
        api.get<OrdemServico[]>('/ordens-servico'),
        api.get<Cliente[]>('/clientes'),
      ]);
      const clientesPorId = new Map(
        respostaClientes.map(cliente => [cliente.id, cliente.nome])
      );
      setOrdens(
        respostaOrdens
          .filter(ordem => ordem.funcionario_id === funcionario.id)
          .map(ordem => ({
            ...ordem,
            clienteNome:
              clientesPorId.get(ordem.cliente_id ?? -1) ?? 'Cliente não encontrado',
          }))
      );
    } catch {
      setAviso(
        'O perfil está disponível, mas não foi possível carregar as ordens de serviço agora.'
      );
    } finally {
      setCarregandoOrdens(false);
    }
  }
  function voltarParaLista() {
    navegar('/funcionarios');
    setErro('');
    setAviso('');
  }
  useEffect(() => {
    if (!criando && !editandoRota && !perfilRota) return;
    const sincronizarRota = window.setTimeout(() => {
      if (criando) {
        setSelecionado(null);
        setDados(dadosIniciais());
        setErro('');
        setAviso('');
        return;
      }
      if (carregando) return;
      const id = Number(idDaRota);
      const funcionario = funcionarios.find(atual => atual.id === id);
      if (!funcionario) {
        setSelecionado(null);
        setErro(t('funcionarios:notFound'));
        return;
      }
      if (editandoRota) {
        setSelecionado(funcionario);
        setDados({
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          telefone: funcionario.telefone,
          genero: funcionario.genero ?? '',
          cargo: funcionario.cargo,
          status: funcionario.status,
          data_admissao: funcionario.data_admissao?.slice(0, 10),
        });
        setErro('');
        setAviso('');
        return;
      }
      void carregarPerfil(funcionario);
    }, 0);
    return () => window.clearTimeout(sincronizarRota);
  }, [carregando, criando, editandoRota, funcionarios, idDaRota, perfilRota]);
  async function salvarFuncionario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (
      !dados.nome.trim() ||
      !dados.cpf.trim() ||
      !dados.telefone.trim() ||
      !dados.genero ||
      !dados.cargo
    ) {
      setErro(
        'Preencha nome, CPF, telefone, gênero e cargo para salvar o funcionário.'
      );
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        ...dados,
        nome: dados.nome.trim(),
        genero: dados.genero || undefined,
      };
      if (selecionado) {
        await api.put<Funcionario>(`/funcionarios/${selecionado.id}`, payload);
        setAviso(t('funcionarios:updated'));
      } else {
        await api.post<Funcionario>('/funcionarios', payload);
        setNotificacaoTemporaria(t('funcionarios:saved'));
      }
      await carregarFuncionarios();
      navegar('/funcionarios');
      setSelecionado(null);
    } catch (erroAtual) {
      setErro(mensagemErro(erroAtual));
    } finally {
      setSalvando(false);
    }
  }
  async function excluirFuncionario() {
    if (!funcionarioParaExcluir) return;
    setExcluindo(true);
    setErro('');
    try {
      await api.delete<{ mensagem: string }>(
        `/funcionarios/${funcionarioParaExcluir.id}`
      );
      setFuncionarios(atual =>
        atual.filter(
          funcionario => funcionario.id !== funcionarioParaExcluir.id
        )
      );
      setNotificacaoTemporaria(
        t('funcionarios:removed', { name: funcionarioParaExcluir.nome })
      );
      setFuncionarioParaExcluir(null);
    } catch (erroAtual) {
      setErro(mensagemErro(erroAtual));
      setFuncionarioParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (criando || editandoRota)
    return (
      <FormularioFuncionario
        dados={dados}
        editando={Boolean(selecionado)}
        erro={erro}
        salvando={salvando}
        aoCancelar={voltarParaLista}
        aoMudar={setDados}
        aoSalvar={salvarFuncionario}
      />
    );
  if (perfilRota && selecionado)
    return (
      <PerfilFuncionario
        funcionario={selecionado}
        ordens={ordens}
        carregandoOrdens={carregandoOrdens}
        aviso={aviso}
        aoEditar={() => navegar(`/funcionarios/${selecionado.id}/editar`)}
        aoVoltar={voltarParaLista}
      />
    );

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1200px] flex-col gap-6 px-5 py-7 sm:px-8 md:px-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">
            {t('funcionarios:title')}
          </h1>
          <p className="mt-2 text-base text-[#444652]">
            {t('funcionarios:subtitle')}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d439c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002c7c] focus-visible:ring-offset-2"
          onClick={() => navegar('/funcionarios/novo')}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('funcionarios:new')}
        </button>
      </div>
      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
      {notificacaoTemporaria && (
        <NotificacaoTemporaria
          aoFechar={() => setNotificacaoTemporaria('')}
          mensagem={notificacaoTemporaria}
        />
      )}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <label className="relative w-full sm:max-w-sm">
          <span className="sr-only">{t('funcionarios:search')}</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]"
          />
          <input
            className="w-full rounded-lg border border-[#c4c6d4] bg-white py-3 pl-10 pr-4 text-sm text-[#181c23] outline-none transition placeholder:text-[#747683] focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
            onChange={event => setBusca(event.target.value)}
            placeholder={t('funcionarios:search')}
            type="search"
            value={busca}
          />
        </label>
        <span className="text-sm text-[#444652]">
          {t('funcionarios:employees', { count: funcionarios.length })}
        </span>
      </div>
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#c4c6d4]/70 bg-white shadow-sm">
        {carregando ? (
          <Carregando texto={t('funcionarios:loading')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-[#c4c6d4]/60 bg-[#f1f3fe] text-xs uppercase tracking-wide text-[#444652]">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('funcionarios:name')}</th>
                  <th className="px-6 py-4 font-semibold">{t('funcionarios:cpf')}</th>
                  <th className="px-6 py-4 font-semibold">{t('funcionarios:phone')}</th>
                  <th className="px-6 py-4 font-semibold">{t('funcionarios:gender')}</th>
                  <th className="px-6 py-4 font-semibold">{t('funcionarios:role')}</th>
                  <th className="px-6 py-4 font-semibold">{t('common:status')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('funcionarios:actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {funcionariosFiltrados.map(funcionario => (
                  <tr
                    className="group border-b border-[#c4c6d4]/55 last:border-0 hover:bg-[#f1f3fe]/45"
                    key={funcionario.id}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#d7e2ff] text-xs font-bold text-[#002c7c]">
                          {iniciais(funcionario.nome)}
                        </span>
                        <span className="font-semibold text-[#181c23]">
                          {funcionario.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#444652]">
                      {funcionario.cpf}
                    </td>
                    <td className="px-6 py-4 text-[#444652]">
                      {funcionario.telefone}
                    </td>
                    <td className="px-6 py-4 text-[#444652]">
                      {funcionario.genero || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeCargo(funcionario.cargo)}`}
                      >
                        {funcionario.cargo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeStatus(funcionario.status)}`}
                      >
                        {funcionario.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Editar ${funcionario.nome}`}
                          className="rounded-md p-2 text-[#605e59] transition hover:bg-[#e5e8f3] hover:text-[#002c7c]"
                          onClick={() =>
                            navegar(`/funcionarios/${funcionario.id}/editar`)
                          }
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          aria-label={`Ver perfil de ${funcionario.nome}`}
                          className="rounded-md p-2 text-[#605e59] transition hover:bg-[#e5e8f3] hover:text-[#002c7c]"
                          onClick={() => navegar(`/funcionarios/${funcionario.id}`)}
                          type="button"
                        >
                          <Eye aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          aria-label={`Excluir ${funcionario.nome}`}
                          className="rounded-md p-2 text-[#a22929] transition hover:bg-[#ffefed]"
                          onClick={() => setFuncionarioParaExcluir(funcionario)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {funcionariosFiltrados.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-14 text-center text-[#444652]"
                      colSpan={7}
                    >
                      {t('funcionarios:empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="mt-auto flex items-center justify-between border-t border-[#c4c6d4]/60 px-6 py-4 text-sm text-[#444652]">
          <span>
            {t('funcionarios:showing', { shown: funcionariosFiltrados.length, total: funcionarios.length })}
          </span>
          <div className="flex gap-2">
            <button
              aria-label="Página anterior"
              className="rounded-lg border border-[#c4c6d4] p-2 text-[#747683]"
              disabled
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Próxima página"
              className="rounded-lg border border-[#c4c6d4] p-2 text-[#747683]"
              disabled
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </footer>
      </section>
      {funcionarioParaExcluir && (
        <ConfirmacaoExclusao
          funcionario={funcionarioParaExcluir}
          excluindo={excluindo}
          aoCancelar={() => setFuncionarioParaExcluir(null)}
          aoConfirmar={() => void excluirFuncionario()}
        />
      )}
    </div>
  );
}

function FormularioFuncionario({
  dados,
  editando,
  erro,
  salvando,
  aoCancelar,
  aoMudar,
  aoSalvar,
}: {
  dados: DadosFormulario;
  editando: boolean;
  erro: string;
  salvando: boolean;
  aoCancelar: () => void;
  aoMudar: (dados: DadosFormulario) => void;
  aoSalvar: (evento: FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useTranslation(['funcionarios', 'common']);
  function alterar(campo: keyof DadosFormulario, valor: string) {
    aoMudar({ ...dados, [campo]: valor });
  }
  const classeInput =
    'mt-2 w-full rounded-lg border border-[#c4c6d4] bg-white px-4 py-3 text-sm text-[#181c23] outline-none transition placeholder:text-[#747683] focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20';
  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1000px] px-5 py-7 sm:px-8 md:px-16">
      <button
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#444652] transition hover:text-[#002c7c]"
        onClick={aoCancelar}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('funcionarios:back')}
      </button>
      <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">
        {editando ? t('funcionarios:edit') : t('funcionarios:newRegistration')}
      </h1>
      <p className="mt-2 text-[#444652]">
        {editando
          ? t('funcionarios:editSubtitle')
          : t('funcionarios:newSubtitle')}
      </p>
      <form
        className="mt-7 rounded-xl border border-[#c4c6d4]/70 bg-white p-5 shadow-sm sm:p-8"
        onSubmit={aoSalvar}
      >
        {erro && (
          <div className="mb-6">
            <Aviso tipo="erro">{erro}</Aviso>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('funcionarios:fullName')} *
            </span>
            <input
              className={classeInput}
              onChange={event => alterar('nome', event.target.value)}
              placeholder={t('funcionarios:nameExample')}
              required
              type="text"
              value={dados.nome}
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              CPF *
            </span>
            <input
              className={classeInput}
              inputMode="numeric"
              maxLength={14}
              onChange={event =>
                alterar('cpf', formatarCpf(event.target.value))
              }
              placeholder="000.000.000-00"
              required
              type="text"
              value={dados.cpf}
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('funcionarios:phone')} *
            </span>
            <input
              className={classeInput}
              inputMode="numeric"
              maxLength={15}
              onChange={event =>
                alterar('telefone', formatarTelefone(event.target.value))
              }
              placeholder="(00) 00000-0000"
              required
              type="tel"
              value={dados.telefone}
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('funcionarios:gender')}
            </span>
            <select
              className={classeInput}
              onChange={event => alterar('genero', event.target.value)}
              required
              value={dados.genero ?? ''}
            >
              <option value="">{t('funcionarios:selectOption')}</option>
              {GENEROS.map(genero => (
                <option key={genero} value={genero}>
                  {genero}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('funcionarios:role')} *
            </span>
            <select
              className={classeInput}
              onChange={event => alterar('cargo', event.target.value)}
              required
              value={dados.cargo}
            >
              <option value="">{t('funcionarios:selectOption')}</option>
              {CARGOS.map(cargo => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('common:status')}
            </span>
            <select
              className={classeInput}
              onChange={event => alterar('status', event.target.value)}
              value={dados.status}
            >
              <option value="Ativo">{t('funcionarios:active')}</option>
              <option value="Inativo">{t('funcionarios:inactive')}</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              {t('funcionarios:admissionDate')}
            </span>
            <input
              className={classeInput}
              onChange={event => alterar('data_admissao', event.target.value)}
              type="date"
              value={dados.data_admissao}
            />
          </label>
        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#c4c6d4]/60 pt-6 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg px-5 py-3 text-sm font-semibold text-[#444652] transition hover:bg-[#f1f3fe]"
            onClick={aoCancelar}
            type="button"
          >
            {t('common:cancel')}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d439c] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={salvando}
            type="submit"
          >
            {salvando && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            )}
            {editando ? t('funcionarios:saveChanges') : t('funcionarios:saveEmployee')}
          </button>
        </div>
      </form>
    </div>
  );
}

function PerfilFuncionario({
  funcionario,
  ordens,
  carregandoOrdens,
  aviso,
  aoEditar,
  aoVoltar,
}: {
  funcionario: Funcionario;
  ordens: OrdemDoFuncionario[];
  carregandoOrdens: boolean;
  aviso: string;
  aoEditar: () => void;
  aoVoltar: () => void;
}) {
  const concluidas = ordens.filter(
    ordem =>
      ordem.status.toLowerCase() === 'concluído' ||
      ordem.status.toLowerCase() === 'concluido'
  ).length;
  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1200px] px-5 py-7 sm:px-8 md:px-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#444652] transition hover:text-[#002c7c]"
            onClick={aoVoltar}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Funcionários
          </button>
          <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">
            {funcionario.nome}
          </h1>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#002c7c] px-5 py-3 text-sm font-semibold text-[#002c7c] transition hover:bg-[#f1f3fe]"
          onClick={aoEditar}
          type="button"
        >
          <Pencil aria-hidden="true" className="size-4" />
          Editar perfil
        </button>
      </div>
      {aviso && (
        <div className="mt-5">
          <Aviso tipo="erro">{aviso}</Aviso>
        </div>
      )}
      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-[#c4c6d4]/70 bg-[#f1f3fe] p-6 text-center">
          <span className="mx-auto flex size-24 items-center justify-center rounded-full border-4 border-white bg-[#d7e2ff] text-2xl font-bold text-[#002c7c] shadow-sm">
            {iniciais(funcionario.nome)}
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-[#181c23]">
            {funcionario.nome}
          </h2>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classeCargo(funcionario.cargo)}`}
          >
            {funcionario.cargo}
          </span>
          <div className="mt-7 grid grid-cols-2 divide-x divide-[#c4c6d4]">
            <div>
              <strong className="block text-2xl text-[#002c7c]">
                {concluidas}
              </strong>
              <span className="mt-1 block text-xs text-[#444652]">
                OS concluídas
              </span>
            </div>
            <div>
              <strong className="block text-2xl text-[#002c7c]">
                {ordens.length}
              </strong>
              <span className="mt-1 block text-xs text-[#444652]">
                OS atribuídas
              </span>
            </div>
          </div>
        </aside>
        <div className="space-y-5">
          <InfoCard icone={UserRound} titulo="Informações pessoais">
            <Dado label="Nome completo" valor={funcionario.nome} />
            <Dado label="CPF" valor={funcionario.cpf} />
            <Dado label="Telefone" valor={funcionario.telefone} />
            <Dado
              label="Gênero"
              valor={funcionario.genero || 'Não informado'}
            />
          </InfoCard>
          <InfoCard
            icone={BriefcaseBusiness}
            titulo="Informações profissionais"
          >
            <Dado label="Cargo atual" valor={funcionario.cargo} />
            <Dado
              label="Data de admissão"
              valor={formatarData(funcionario.data_admissao)}
            />
            <Dado
              label="Status"
              valor={
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeStatus(funcionario.status)}`}
                >
                  {funcionario.status}
                </span>
              }
            />
            <Dado
              label="Registro"
              valor={
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Ativo no sistema
                </span>
              }
            />
          </InfoCard>
        </div>
      </div>
      <section className="mt-6 overflow-hidden rounded-xl border border-[#c4c6d4]/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6d4]/60 px-6 py-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#181c23]">
            <BriefcaseBusiness
              aria-hidden="true"
              className="size-5 text-[#002c7c]"
            />
            Ordens de Serviço Recentes
          </h2>
        </div>
        {carregandoOrdens ? (
          <Carregando texto="Carregando ordens de serviço..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#f1f3fe] text-xs uppercase tracking-wide text-[#444652]">
                <tr>
                  <th className="px-6 py-4">OS #</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Criada em</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map(ordem => (
                  <tr className="border-t border-[#c4c6d4]/55" key={ordem.id}>
                    <td className="px-6 py-4 font-semibold text-[#002c7c]">
                      #{ordem.id}
                    </td>
                    <td className="px-6 py-4 text-[#181c23]">
                      {ordem.clienteNome}
                    </td>
                    <td className="px-6 py-4 text-[#181c23]">
                      {ordem.descricao_item}
                    </td>
                    <td className="px-6 py-4 text-[#444652]">
                      {formatarData(ordem.criado_em ?? undefined)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeStatusOrdem(ordem.status)}`}
                      >
                        {ordem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        aria-label={`Ver ordem de serviço #${ordem.id}`}
                        className="inline-flex rounded-md p-2 text-[#605e59] transition hover:bg-[#e5e8f3] hover:text-[#002c7c]"
                        to={`/ordens-servico/${ordem.id}`}
                      >
                        <Eye aria-hidden="true" className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {ordens.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-[#444652]"
                      colSpan={6}
                    >
                      Nenhuma ordem de serviço atribuída a este funcionário.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof UserRound;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#c4c6d4]/70 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-[#181c23]">
        <Icone aria-hidden="true" className="size-5 text-[#002c7c]" />
        {titulo}
      </h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}
function Dado({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#747683]">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-[#181c23]">{valor}</dd>
    </div>
  );
}
function Carregando({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#444652]">
      <LoaderCircle
        aria-hidden="true"
        className="size-5 animate-spin text-[#002c7c]"
      />
      {texto}
    </div>
  );
}
function Aviso({
  tipo,
  children,
}: {
  tipo: 'erro' | 'sucesso';
  children: ReactNode;
}) {
  const erro = tipo === 'erro';
  const Icone = erro ? XCircle : CheckCircle2;
  return (
    <div
      aria-live="polite"
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${erro ? 'border-[#f1b8b3] bg-[#ffefed] text-[#93000a]' : 'border-[#a8ddb9] bg-[#ebf9ee] text-[#256b43]'}`}
    >
      <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  );
}

function NotificacaoTemporaria({
  mensagem,
  aoFechar,
}: {
  mensagem: string;
  aoFechar: () => void;
}) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const iniciarSaida = window.setTimeout(() => setSaindo(true), 4500);
    const remover = window.setTimeout(aoFechar, 5000);
    return () => {
      window.clearTimeout(iniciarSaida);
      window.clearTimeout(remover);
    };
  }, [aoFechar]);

  return (
    <div
      aria-live="polite"
      className={`relative overflow-hidden rounded-lg border border-[#a8ddb9] bg-[#ebf9ee] px-4 py-3 text-sm text-[#256b43] shadow-sm ${saindo ? 'animate-notificacao-saida' : 'animate-notificacao-entrada'}`}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {mensagem}
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 origin-left bg-[#256b43]/55 animate-progresso-notificacao"
      />
    </div>
  );
}

function ConfirmacaoExclusao({
  funcionario,
  excluindo,
  aoCancelar,
  aoConfirmar,
}: {
  funcionario: Funcionario;
  excluindo: boolean;
  aoCancelar: () => void;
  aoConfirmar: () => void;
}) {
  const { t } = useTranslation(['funcionarios', 'common']);
  return (
    <div
      aria-labelledby="titulo-confirmacao-exclusao"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181c23]/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#ffefed] text-[#a22929]">
          <Trash2 aria-hidden="true" className="size-5" />
        </div>
        <h2
          className="mt-4 text-xl font-semibold text-[#181c23]"
          id="titulo-confirmacao-exclusao"
        >
          {t('funcionarios:deleteTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#444652]">
          {t('funcionarios:deleteConfirm', { name: funcionario.nome })}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#444652] transition hover:bg-[#f1f3fe]"
            disabled={excluindo}
            onClick={aoCancelar}
            type="button"
          >
            {t('common:cancel')}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ba1a1a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#93000a] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={excluindo}
            onClick={aoConfirmar}
            type="button"
          >
            {excluindo && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            )}
            {t('funcionarios:deleteEmployee')}
          </button>
        </div>
      </div>
    </div>
  );
}
