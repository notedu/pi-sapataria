import { type FormEvent, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Store,
  SlidersHorizontal,
  UserRound,
  XCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/auth';
import { useTranslation } from 'react-i18next';

type DadosSapataria = {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
};
type Preferencias = {
  idioma: string;
  notificacoes: boolean;
};
type Notificacao = {
  mensagem: string;
  tipo: 'erro' | 'sucesso';
};

const CHAVE_CONFIGURACOES = 'seda-e-couro-configuracoes';
const sapatariaInicial: DadosSapataria = {
  nome: 'Seda e Couro',
  endereco: 'Rua dos Artesãos, 123\nBairro das Oficinas\nSão Paulo - SP, 01000-000',
  telefone: '(11) 98765-4321',
  email: 'contato@sedaecouro.com.br',
};
const preferenciasIniciais: Preferencias = {
  idioma: 'pt-BR',
  notificacoes: true,
};

function carregarConfiguracoes() {
  try {
    const salvas = window.localStorage.getItem(CHAVE_CONFIGURACOES);
    if (!salvas) {
      return {
        sapataria: sapatariaInicial,
        preferencias: preferenciasIniciais,
      };
    }
    const dados = JSON.parse(salvas) as Partial<{
      sapataria: DadosSapataria;
      preferencias: Preferencias;
    }>;
    return {
      sapataria: { ...sapatariaInicial, ...dados.sapataria },
      preferencias: { ...preferenciasIniciais, ...dados.preferencias },
    };
  } catch {
    return {
      sapataria: sapatariaInicial,
      preferencias: preferenciasIniciais,
    };
  }
}

export default function Configuracoes() {
  const { t, i18n } = useTranslation(['configuracoes', 'common']);
  const { usuario } = useAuth();
  const [sapataria, setSapataria] = useState<DadosSapataria>(sapatariaInicial);
  const [preferencias, setPreferencias] = useState<Preferencias>(
    preferenciasIniciais
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null);

  useEffect(() => {
    const configuracoes = carregarConfiguracoes();
    const carregamentoInicial = window.setTimeout(() => {
      setSapataria(configuracoes.sapataria);
      setPreferencias(configuracoes.preferencias);
    }, 0);
    return () => window.clearTimeout(carregamentoInicial);
  }, []);

  function salvarDados(
    proximaSapataria = sapataria,
    proximasPreferencias = preferencias
  ) {
    window.localStorage.setItem(
      CHAVE_CONFIGURACOES,
      JSON.stringify({
        sapataria: proximaSapataria,
        preferencias: proximasPreferencias,
      })
    );
  }

  function atualizarPreferencias(proximas: Preferencias) {
    setPreferencias(proximas);
    salvarDados(sapataria, proximas);
  }

  function atualizarDadosComerciais(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    salvarDados(sapataria, preferencias);
    setModalAberto(false);
    setNotificacao({
      mensagem: t('configuracoes:saved'),
      tipo: 'sucesso',
    });
  }

  function solicitarAlteracaoSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      setNotificacao({
        mensagem: t('configuracoes:passwordRequired'),
        tipo: 'erro',
      });
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setNotificacao({
        mensagem: t('configuracoes:passwordMismatch'),
        tipo: 'erro',
      });
      return;
    }
    setNotificacao({
      mensagem:
        t('configuracoes:passwordUnavailable'),
      tipo: 'erro',
    });
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacaoSenha('');
    setModalSenhaAberto(false);
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1120px] px-5 py-7 sm:px-8 md:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#002c7c] sm:text-4xl">
          {t('configuracoes:title')}
        </h1>
        <p className="mt-2 text-base text-[#444652] sm:text-lg">
          {t('configuracoes:subtitle')}
        </p>
      </div>

      {notificacao && (
        <div className="mb-6">
          <NotificacaoTemporaria
            mensagem={notificacao.mensagem}
            aoFechar={() => setNotificacao(null)}
            tipo={notificacao.tipo}
          />
        </div>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
        <div className="space-y-7">
          <section className="rounded-xl border border-[#c4c6d4] bg-[#f7f8ff] p-6">
            <CabecalhoSecao icone={UserRound} titulo={t('configuracoes:userAccount')} />
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <CampoSomenteLeitura
                  label={t('configuracoes:fullName')}
                  valor={usuario?.nome ?? t('configuracoes:unknownUser')}
                />
                <CampoSomenteLeitura
                  ajuda={
                    usuario?.usuario.includes('@')
                      ? undefined
                      : t('common:notInformed')
                  }
                  label={
                    usuario?.usuario.includes('@')
                      ? t('configuracoes:email')
                      : t('configuracoes:username')
                  }
                  valor={usuario?.usuario ?? t('common:notInformed')}
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-[#c4c6d4]/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#444652]">
                  {t('configuracoes:passwordHint')}
                </p>
                <button
                  className="shrink-0 rounded-lg border border-[#002c7c] px-4 py-2.5 text-sm font-semibold text-[#002c7c] transition hover:bg-[#edf1ff]"
                  onClick={() => setModalSenhaAberto(true)}
                  type="button"
                >
                  {t('configuracoes:password')}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#c4c6d4] bg-[#f7f8ff] p-6">
            <CabecalhoSecao
              icone={SlidersHorizontal}
              titulo={t('configuracoes:systemPreferences')}
            />
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <DescricaoPreferencia
                  descricao={t('configuracoes:languageDescription')}
                  titulo={t('configuracoes:language')}
                />
                <select
                  className="rounded-lg border border-[#c4c6d4] bg-white px-4 py-2.5 text-sm text-[#181c23] outline-none focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
                  onChange={evento => {
                    const idioma = evento.target.value;
                    void i18n.changeLanguage(idioma);
                    atualizarPreferencias({
                      ...preferencias,
                      idioma,
                    });
                  }}
                  value={i18n.resolvedLanguage ?? preferencias.idioma}
                >
                  <option value="pt-BR">{t('configuracoes:languagePt')}</option>
                  <option value="en">{t('configuracoes:languageEn')}</option>
                  <option value="es">{t('configuracoes:languageEs')}</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-5">
                <DescricaoPreferencia
                  descricao={t('configuracoes:notificationsDescription')}
                  titulo={t('configuracoes:notifications')}
                />
                <Alternador
                  ativo={preferencias.notificacoes}
                  aoAlternar={() =>
                    atualizarPreferencias({
                      ...preferencias,
                      notificacoes: !preferencias.notificacoes,
                    })
                  }
                  descricao="Ativar notificações"
                />
              </div>
              <div className="flex items-center justify-between gap-5 opacity-55">
                <DescricaoPreferencia
                  descricao="Aparência do sistema (atualmente apenas Light Mode)"
                  titulo="Modo escuro"
                />
                <Alternador ativo={false} desabilitado descricao="Modo escuro indisponível" />
              </div>
            </div>
          </section>
        </div>

        <aside>
          <section className="relative overflow-hidden rounded-xl border border-[#b9c6ec] bg-[#eef2ff] p-6">
            <Building2
              aria-hidden="true"
              className="absolute -right-7 -top-7 size-32 rotate-12 text-[#d7e2ff]"
            />
            <div className="relative">
              <CabecalhoSecao icone={Store} titulo={t('configuracoes:shopData')} />
              <dl className="mt-6 space-y-5">
                <DadoComercial titulo={t('configuracoes:shopName')} valor={sapataria.nome} />
                <DadoComercial titulo={t('configuracoes:address')} valor={sapataria.endereco} />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
                    Contato oficial
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-[#181c23]">
                    {sapataria.telefone}
                  </dd>
                  <dd className="mt-1 break-all text-sm text-[#002c7c]">
                    {sapataria.email}
                  </dd>
                </div>
              </dl>
              <button
                className="mt-6 w-full rounded-lg border border-[#002c7c] px-4 py-2.5 text-sm font-semibold text-[#002c7c] transition hover:bg-[#dfe7ff]"
                onClick={() => setModalAberto(true)}
                type="button"
              >
                {t('configuracoes:editShopData')}
              </button>
            </div>
          </section>
        </aside>
      </div>

      {modalSenhaAberto && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#181c23]/45 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onSubmit={solicitarAlteracaoSenha}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#181c23]">
                  Alterar senha
                </h2>
                <p className="mt-1 text-sm text-[#444652]">
                  {t('configuracoes:passwordModalHint')}
                </p>
              </div>
              <button
                aria-label="Fechar"
                className="rounded-md p-1 text-[#444652] hover:bg-[#e5e8f3]"
                onClick={() => setModalSenhaAberto(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <CampoSenha
                autoComplete="current-password"
                label="Senha atual"
                onChange={setSenhaAtual}
                value={senhaAtual}
              />
              <CampoSenha
                autoComplete="new-password"
                label="Nova senha"
                onChange={setNovaSenha}
                value={novaSenha}
              />
              <CampoSenha
                autoComplete="new-password"
                label="Confirmar nova senha"
                onChange={setConfirmacaoSenha}
                value={confirmacaoSenha}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#c4c6d4]/60 pt-5">
              <button
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#444652] hover:bg-[#f1f3fe]"
                onClick={() => setModalSenhaAberto(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-[#002c7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#194099]"
                type="submit"
              >
                Confirmar alteração
              </button>
            </div>
          </form>
        </div>
      )}

      {modalAberto && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#181c23]/45 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
            onSubmit={atualizarDadosComerciais}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#181c23]">
                  {t('configuracoes:commercialData')}
                </h2>
                <p className="mt-1 text-sm text-[#444652]">
                  {t('configuracoes:updateData')}
                </p>
              </div>
              <button
                aria-label="Fechar"
                className="rounded-md p-1 text-[#444652] hover:bg-[#e5e8f3]"
                onClick={() => setModalAberto(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo
                  label={t('configuracoes:shopName')}
                  onChange={nome =>
                    setSapataria(atual => ({ ...atual, nome }))
                  }
                  value={sapataria.nome}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-[#444652]">
                  {t('configuracoes:address')}
                </label>
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-[#c4c6d4] px-4 py-2.5 text-sm text-[#181c23] outline-none focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
                  onChange={evento =>
                    setSapataria(atual => ({
                      ...atual,
                      endereco: evento.target.value,
                    }))
                  }
                  value={sapataria.endereco}
                />
              </div>
              <Campo
                label={t('configuracoes:phone')}
                onChange={telefone =>
                  setSapataria(atual => ({ ...atual, telefone }))
                }
                value={sapataria.telefone}
              />
              <Campo
                label={t('configuracoes:email')}
                onChange={email =>
                  setSapataria(atual => ({ ...atual, email }))
                }
                tipo="email"
                value={sapataria.email}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#c4c6d4]/60 pt-5">
              <button
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#444652] hover:bg-[#f1f3fe]"
                onClick={() => setModalAberto(false)}
                type="button"
              >
                {t('common:cancel')}
              </button>
              <button
                className="rounded-lg bg-[#002c7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#194099]"
                type="submit"
              >
                {t('configuracoes:saveChanges')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CabecalhoSecao({
  icone: Icone,
  titulo,
}: {
  icone: typeof UserRound;
  titulo: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#c4c6d4]/60 pb-4">
      <Icone aria-hidden="true" className="size-6 text-[#002c7c]" />
      <h2 className="text-xl font-semibold text-[#181c23]">{titulo}</h2>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  tipo = 'text',
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  tipo?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#444652]">
      {label}
      <input
        className="mt-1.5 w-full rounded-lg border border-[#c4c6d4] bg-white px-4 py-2.5 font-normal text-[#181c23] outline-none transition focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
        onChange={evento => onChange(evento.target.value)}
        required
        type={tipo}
        value={value}
      />
    </label>
  );
}

function CampoSomenteLeitura({
  label,
  valor,
  ajuda,
}: {
  label: string;
  valor: string;
  ajuda?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#444652]">
      {label}
      <input
        className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-[#c4c6d4] bg-[#e9ebf4] px-4 py-2.5 font-normal text-[#444652]"
        disabled
        type="text"
        value={valor}
      />
      {ajuda && <span className="mt-1.5 block text-xs font-normal text-[#747683]">{ajuda}</span>}
    </label>
  );
}

function CampoSenha({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#444652]">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-lg border border-[#c4c6d4] bg-white px-4 py-2.5 font-normal text-[#181c23] outline-none transition focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
        onChange={evento => onChange(evento.target.value)}
        required
        type="password"
        value={value}
      />
    </label>
  );
}

function DescricaoPreferencia({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#181c23]">{titulo}</p>
      <p className="mt-0.5 text-sm text-[#444652]">{descricao}</p>
    </div>
  );
}

function Alternador({
  ativo,
  aoAlternar,
  descricao,
  desabilitado = false,
}: {
  ativo: boolean;
  aoAlternar?: () => void;
  descricao: string;
  desabilitado?: boolean;
}) {
  return (
    <button
      aria-checked={ativo}
      aria-label={descricao}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${ativo ? 'bg-[#002c7c]' : 'bg-[#dfe2ed]'} ${desabilitado ? 'cursor-not-allowed' : ''}`}
      disabled={desabilitado}
      onClick={aoAlternar}
      role="switch"
      type="button"
    >
      <span
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${ativo ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

function DadoComercial({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
        {titulo}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-[#181c23]">
        {valor}
      </dd>
    </div>
  );
}

function NotificacaoTemporaria({
  mensagem,
  tipo,
  aoFechar,
}: {
  mensagem: string;
  tipo: Notificacao['tipo'];
  aoFechar: () => void;
}) {
  const [saindo, setSaindo] = useState(false);
  const erro = tipo === 'erro';
  const Icone = erro ? XCircle : CheckCircle2;

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
      className={`relative overflow-hidden rounded-lg border px-4 py-3 text-sm shadow-sm ${erro ? 'border-[#f1b8b3] bg-[#ffefed] text-[#93000a]' : 'border-[#a8ddb9] bg-[#ebf9ee] text-[#256b43]'} ${saindo ? 'animate-notificacao-saida' : 'animate-notificacao-entrada'}`}
    >
      <div className="flex items-start gap-2">
        <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {mensagem}
      </div>
      <span
        className={`absolute inset-x-0 bottom-0 h-1 origin-left animate-progresso-notificacao ${erro ? 'bg-[#ba1a1a]/55' : 'bg-[#256b43]/55'}`}
      />
    </div>
  );
}
