import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  FileText,
  LoaderCircle,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { ApiError, api } from '../services/api';

type OrdemServico = {
  id: number;
  cliente_id: number;
  descricao_item: string;
  valor_servico: number | string;
  status?: string | null;
  criado_em?: string | null;
};
type Cliente = { id: number; nome: string };
type Transacao = OrdemServico & { clienteNome: string; valor: number };

function moeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
function formatarData(data?: string | null) {
  if (!data) return 'Data não informada';
  const valor = new Date(data);
  return Number.isNaN(valor.getTime())
    ? 'Data não informada'
    : new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
        .format(valor)
        .replace('.', '');
}
function statusConcluido(status?: string | null) {
  return status?.toLocaleLowerCase('pt-BR').includes('conclu') ?? false;
}
function statusCancelado(status?: string | null) {
  return status?.toLocaleLowerCase('pt-BR').includes('cancel') ?? false;
}
function mensagemErro(erro: unknown) {
  return erro instanceof ApiError
    ? erro.message
    : 'Não foi possível carregar os dados financeiros. Verifique se o back-end está em execução.';
}

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let ativo = true;
    async function carregarFinanceiro() {
      setCarregando(true);
      setErro('');
      try {
        const [ordens, clientes] = await Promise.all([
          api.get<OrdemServico[]>('/ordens-servico'),
          api.get<Cliente[]>('/clientes'),
        ]);
        const clientesPorId = new Map(
          clientes.map(cliente => [cliente.id, cliente.nome])
        );
        const dados = ordens
          .map(ordem => ({
            ...ordem,
            clienteNome:
              clientesPorId.get(ordem.cliente_id) ?? 'Cliente não encontrado',
            valor: Number(ordem.valor_servico) || 0,
          }))
          .sort((primeira, segunda) => {
            const dataPrimeira = primeira.criado_em
              ? new Date(primeira.criado_em).getTime()
              : 0;
            const dataSegunda = segunda.criado_em
              ? new Date(segunda.criado_em).getTime()
              : 0;
            return dataSegunda - dataPrimeira || segunda.id - primeira.id;
          });
        if (ativo) setTransacoes(dados);
      } catch (erroAtual) {
        if (ativo) setErro(mensagemErro(erroAtual));
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    const carregamentoInicial = window.setTimeout(() => {
      void carregarFinanceiro();
    }, 0);
    return () => {
      ativo = false;
      window.clearTimeout(carregamentoInicial);
    };
  }, []);

  const resumo = useMemo(() => {
    const faturadas = transacoes.filter(transacao =>
      statusConcluido(transacao.status)
    );
    const pendentes = transacoes.filter(
      transacao =>
        !statusConcluido(transacao.status) && !statusCancelado(transacao.status)
    );
    return {
      saldo: faturadas.reduce((total, transacao) => total + transacao.valor, 0),
      pendente: pendentes.reduce(
        (total, transacao) => total + transacao.valor,
        0
      ),
      notas: faturadas,
      pendentes,
    };
  }, [transacoes]);

  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-300 px-5 py-7 sm:px-8 md:px-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">
            Financeiro e Faturamento
          </h1>
          <p className="mt-2 text-base text-[#444652] sm:text-lg">
            Visão geral de contas, transações recentes e geração de documentos fiscais.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#194099]"
          onClick={() =>
            setAviso(
              'A emissão de nota fiscal será disponibilizada quando a integração fiscal for adicionada ao sistema.'
            )
          }
          type="button"
        >
          <ReceiptText aria-hidden="true" className="size-4" />
          Gerar nota fiscal
        </button>
      </div>

      {aviso && (
        <div className="mt-6 flex items-start justify-between gap-3 rounded-lg border border-[#b4c5ff] bg-[#edf1ff] px-4 py-3 text-sm text-[#18325c]">
          <span>{aviso}</span>
          <button
            aria-label="Fechar aviso"
            className="text-[#18325c] hover:text-[#002c7c]"
            onClick={() => setAviso('')}
            type="button"
          >
            ×
          </button>
        </div>
      )}
      {erro && (
        <div className="mt-6 rounded-lg border border-[#ffb4ab] bg-[#ffe9e6] px-4 py-3 text-sm text-[#a22929]">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex min-h-80 items-center justify-center gap-3 text-[#444652]">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          Carregando informações financeiras...
        </div>
      ) : (
        <>
          <section className="mt-7 grid gap-5 lg:grid-cols-3">
            <CardResumo
              descricao="Saldo mensal"
              icone={WalletCards}
              iconeClasse="bg-[#e0e8ff] text-[#002c7c]"
              valor={moeda(resumo.saldo)}
              rodape={
                resumo.saldo > 0
                  ? 'Valores de ordens concluídas'
                  : 'Nenhuma ordem concluída ainda'
              }
              rodapeClasse="text-[#256b43]"
            />
            <CardResumo
              descricao="Pagamentos pendentes"
              icone={CalendarClock}
              iconeClasse="bg-[#ffe0df] text-[#ba1a1a]"
              valor={moeda(resumo.pendente)}
              rodape={`${resumo.pendentes.length} ${resumo.pendentes.length === 1 ? 'ordem aguardando' : 'ordens aguardando'} conclusão`}
              rodapeClasse="text-[#444652]"
            />
            <CardResumo
              descricao="NFs geradas (mês)"
              icone={FileText}
              iconeClasse="bg-[#e0e8ff] text-[#002c7c]"
              valor={String(resumo.notas.length)}
              rodape={
                resumo.notas.length
                  ? `Totalizando ${moeda(resumo.saldo)}`
                  : 'Nenhuma nota disponível'
              }
              rodapeClasse="text-[#444652]"
            />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,.85fr)]">
            <div className="overflow-hidden rounded-xl border border-[#c4c6d4]/70 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#c4c6d4]/60 px-6 py-5">
                <h2 className="text-xl font-semibold text-[#181c23]">
                  Transações Recentes
                </h2>
                <a
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#002c7c] hover:text-[#194099]"
                  href="/ordens-servico"
                >
                  Ver tudo <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left text-sm">
                  <thead className="bg-[#f1f3fe] text-xs uppercase tracking-wide text-[#444652]">
                    <tr>
                      <th className="px-4 py-4">Data</th>
                      <th className="px-4 py-4">Descrição</th>
                      <th className="px-4 py-4">Cliente</th>
                      <th className="px-4 py-4">Valor</th>
                      <th className="px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.slice(0, 5).map(transacao => (
                      <tr
                        className="border-t border-[#c4c6d4]/55"
                        key={transacao.id}
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-[#444652]">
                          {formatarData(transacao.criado_em)}
                        </td>
                        <td className="max-w-48 px-4 py-4 font-medium text-[#181c23]">
                          {transacao.descricao_item}
                        </td>
                        <td className="px-4 py-4 text-[#444652]">
                          {transacao.clienteNome}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#181c23]">
                          {moeda(transacao.valor)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusTransacao status={transacao.status} />
                        </td>
                      </tr>
                    ))}
                    {transacoes.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-10 text-center text-[#444652]"
                          colSpan={5}
                        >
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="overflow-hidden rounded-xl border border-[#c4c6d4]/70 bg-white shadow-sm">
              <div className="border-b border-[#c4c6d4]/60 px-6 py-5">
                <h2 className="text-xl font-semibold text-[#181c23]">
                  Notas Fiscais Recentes (NF-e)
                </h2>
              </div>
              <div className="divide-y divide-[#c4c6d4]/55">
                {resumo.notas.slice(0, 3).map(nota => (
                  <div className="flex items-center gap-3 px-5 py-4" key={nota.id}>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f3fe] text-[#002c7c]">
                      <FileText aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#181c23]">
                        NF-e #{String(nota.id).padStart(6, '0')}
                      </p>
                      <p className="truncate text-sm text-[#444652]">
                        {nota.clienteNome} · {formatarData(nota.criado_em)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#181c23]">
                      {moeda(nota.valor)}
                    </span>
                  </div>
                ))}
                {resumo.notas.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-[#444652]">
                    Nenhuma nota fiscal disponível.
                  </div>
                )}
                {resumo.pendentes.length > 0 && (
                  <div className="m-4 flex items-start gap-3 rounded-lg bg-[#ffe9e6] px-4 py-4 text-sm text-[#a22929]">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <p>
                      {resumo.pendentes.length}{' '}
                      {resumo.pendentes.length === 1 ? 'ordem está' : 'ordens estão'}
                      {' '}aguardando conclusão para faturamento.
                    </p>
                  </div>
                )}
              </div>
              <a
                className="flex items-center justify-center gap-2 border-t border-[#c4c6d4]/60 px-5 py-4 text-sm font-semibold text-[#002c7c] hover:bg-[#f1f3fe]"
                href="/ordens-servico"
              >
                Ver arquivo de documentos
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function CardResumo({
  descricao,
  icone: Icone,
  iconeClasse,
  valor,
  rodape,
  rodapeClasse,
}: {
  descricao: string;
  icone: typeof WalletCards;
  iconeClasse: string;
  valor: string;
  rodape: string;
  rodapeClasse: string;
}) {
  return (
    <article className="rounded-xl border border-[#c4c6d4]/70 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#444652]">
          {descricao}
        </p>
        <span className={`flex size-10 items-center justify-center rounded-full ${iconeClasse}`}>
          <Icone aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#181c23]">
        {valor}
      </p>
      <p className={`mt-3 text-sm ${rodapeClasse}`}>{rodape}</p>
    </article>
  );
}

function StatusTransacao({ status }: { status?: string | null }) {
  const concluido = statusConcluido(status);
  const cancelado = statusCancelado(status);
  const texto = concluido ? 'Pago' : status || 'Pendente';
  const classe = concluido
    ? 'bg-[#d9f7e7] text-[#256b43]'
    : cancelado
      ? 'bg-[#ffe0df] text-[#a22929]'
      : 'bg-[#fff0c9] text-[#7a5200]';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classe}`}>
      {texto}
    </span>
  );
}
