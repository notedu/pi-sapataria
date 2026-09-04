import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ApiError, api } from '../services/api';

type Tipo = 'materia-prima' | 'produtos';
type Materia = {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  unidade_medida: string;
  quantidade: number | string;
  quantidade_minima?: number | string | null;
  valor_unitario?: number | string | null;
  fornecedor?: string | null;
};
type Produto = {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  quantidade: number | string;
  valor_custo?: number | string | null;
  valor_venda: number | string;
};
type Formulario = {
  nome: string;
  descricao: string;
  categoria: string;
  quantidade: string;
  unidade: string;
  minimo: string;
  custo: string;
  fornecedor: string;
  venda: string;
};
const novoForm = (): Formulario => ({
  nome: '',
  descricao: '',
  categoria: '',
  quantidade: '0',
  unidade: 'unidade',
  minimo: '',
  custo: '0,00',
  fornecedor: '',
  venda: '0,00',
});
const UNIDADES_MEDIDA = [
  { valor: 'unidade', texto: 'Unidade' },
  { valor: 'par', texto: 'Par' },
  { valor: 'metro', texto: 'Metro (m)' },
  { valor: 'm2', texto: 'Metro quadrado (m²)' },
  { valor: 'cm2', texto: 'Centímetro quadrado (cm²)' },
  { valor: 'litro', texto: 'Litro (L)' },
  { valor: 'mililitro', texto: 'Mililitro (mL)' },
  { valor: 'quilograma', texto: 'Quilograma (kg)' },
  { valor: 'grama', texto: 'Grama (g)' },
  { valor: 'rolo', texto: 'Rolo' },
  { valor: 'caixa', texto: 'Caixa' },
  { valor: 'pacote', texto: 'Pacote' },
];
const UNIDADES_POR_CATEGORIA: Record<string, string[]> = {
  Couros: ['m2', 'cm2'],
  Solados: ['par', 'unidade'],
  Ferragens: ['unidade', 'pacote', 'caixa'],
  'Colas e adesivos': ['litro', 'mililitro', 'quilograma'],
  'Linhas e costura': ['rolo', 'metro', 'unidade'],
  Tintas: ['litro', 'mililitro'],
  'Tintas e acabamentos': ['litro', 'mililitro'],
  'Palmilhas e espumas': ['par', 'unidade', 'm2', 'cm2'],
  'Materiais de limpeza': ['litro', 'mililitro', 'unidade'],
  Embalagens: ['unidade', 'pacote', 'caixa', 'rolo'],
  Outros: UNIDADES_MEDIDA.map(unidade => unidade.valor),
};
const CATEGORIAS_MATERIA_PRIMA = [
  'Couros',
  'Solados',
  'Ferragens',
  'Colas e adesivos',
  'Linhas e costura',
  'Tintas',
  'Tintas e acabamentos',
  'Palmilhas e espumas',
  'Materiais de limpeza',
  'Embalagens',
  'Outros',
];
const CATEGORIAS_PRODUTOS = [
  'Calçados',
  'Acessórios',
  'Palmilhas',
  'Produtos para cuidado',
  'Bolsas',
  'Outros',
];
const numero = (valor: string) => (valor === '' ? undefined : Number(valor));
const moedaFormatada = (valor: number | string | null | undefined) =>
  Number(valor ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const moedaDigitada = (valor: string) =>
  (Number(valor.replace(/\D/g, '') || '0') / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const valorMonetario = (valor: string) =>
  Number(valor.replace(/\./g, '').replace(',', '.'));
const dinheiro = (valor: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor ?? 0)
  );
function quantidadeFormatada(
  valor: number | string | null | undefined,
  unidade: string
) {
  const quantidade = Number(valor ?? 0);
  const numeroFormatado = Number.isInteger(quantidade)
    ? String(quantidade)
    : quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const unidadeFormatada = unidade === 'unidade'
    ? (quantidade === 1 ? 'unidade' : 'unidades')
    : unidade;
  return `${numeroFormatado} ${unidadeFormatada}`;
}
const erroApi = (erro: unknown) =>
  erro instanceof ApiError
    ? erro.message
    : 'Não foi possível comunicar com a API. Verifique se o back-end está em execução.';

export default function Estoque() {
  const [tipo, setTipo] = useState<Tipo>('materia-prima');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [notificacaoTemporaria, setNotificacaoTemporaria] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Materia | Produto | null>(null);
  const [form, setForm] = useState<Formulario>(novoForm);
  const [excluir, setExcluir] = useState<Materia | Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const itens = tipo === 'materia-prima' ? materias : produtos;
  const categorias = useMemo(
    () => [
      'Todos',
      ...Array.from(
        new Set(
          itens
            .map(item => item.categoria)
            .filter((item): item is string => Boolean(item))
        )
      ),
    ],
    [itens]
  );
  const filtrados = useMemo(
    () =>
      itens.filter(
        item =>
          `${item.nome} ${item.categoria ?? ''}`
            .toLowerCase()
            .includes(busca.toLowerCase()) &&
          (filtro === 'Todos' || item.categoria === filtro)
      ),
    [itens, busca, filtro]
  );
  const baixos =
    tipo === 'materia-prima'
      ? materias.filter(
          item =>
            Number(item.quantidade_minima ?? 0) > 0 &&
            Number(item.quantidade) <= Number(item.quantidade_minima)
        ).length
      : 0;
  const valorTotal = itens.reduce(
    (total, item) =>
      total +
      Number(item.quantidade) *
        Number(
          tipo === 'materia-prima'
            ? ((item as Materia).valor_unitario ?? 0)
            : (item as Produto).valor_venda
        ),
    0
  );
  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [m, p] = await Promise.all([
        api.get<Materia[]>('/estoque-materia-prima'),
        api.get<Produto[]>('/estoque-produtos-venda'),
      ]);
      setMaterias(m);
      setProdutos(p);
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  function trocar(novo: Tipo) {
    setTipo(novo);
    setBusca('');
    setFiltro('Todos');
    setFormAberto(false);
    setErro('');
  }
  function cadastrar() {
    setForm(novoForm());
    setEditando(null);
    setErro('');
    setFormAberto(true);
  }
  function editar(item: Materia | Produto) {
    setEditando(item);
    setForm({
      nome: item.nome,
      descricao: (item.descricao ?? '').slice(0, 200),
      categoria: item.categoria ?? '',
      quantidade: String(item.quantidade),
      unidade: 'unidade_medida' in item ? item.unidade_medida : 'unidade',
      minimo:
        'quantidade_minima' in item ? String(item.quantidade_minima ?? '') : '',
      custo:
        'valor_unitario' in item
          ? moedaFormatada(item.valor_unitario)
          : moedaFormatada((item as Produto).valor_custo),
      fornecedor: 'fornecedor' in item ? (item.fornecedor ?? '') : '',
      venda: 'valor_venda' in item ? moedaFormatada(item.valor_venda) : '0,00',
    });
    setErro('');
    setFormAberto(true);
  }
  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (
      !form.nome.trim() ||
      !form.categoria ||
      (tipo === 'materia-prima' && !form.unidade) ||
      (tipo === 'materia-prima' &&
        (!form.fornecedor.trim() ||
          form.minimo === '' ||
          valorMonetario(form.custo) <= 0)) ||
      (tipo === 'produtos' &&
        (valorMonetario(form.custo) <= 0 ||
          valorMonetario(form.venda) <= 0))
    ) {
      setErro(
        tipo === 'materia-prima'
          ? 'Preencha nome, categoria, fornecedor, unidade, estoque mínimo e preço de custo.'
          : 'Preencha nome, categoria, quantidade, valor de custo e valor de venda.'
      );
      return;
    }
    setSalvando(true);
    try {
      const rota =
        tipo === 'materia-prima'
          ? '/estoque-materia-prima'
          : '/estoque-produtos-venda';
      const dados =
        tipo === 'materia-prima'
          ? {
              nome: form.nome,
              descricao: form.descricao || undefined,
              categoria: form.categoria || undefined,
              unidade_medida: form.unidade,
              quantidade: numero(form.quantidade),
              quantidade_minima: numero(form.minimo),
              valor_unitario: valorMonetario(form.custo),
              fornecedor: form.fornecedor || undefined,
            }
          : {
              nome: form.nome,
              descricao: form.descricao || undefined,
              categoria: form.categoria || undefined,
              quantidade: numero(form.quantidade),
              valor_custo: valorMonetario(form.custo),
              valor_venda: valorMonetario(form.venda),
            };
      if (editando) await api.put(`${rota}/${editando.id}`, dados);
      else await api.post(rota, dados);
      setNotificacaoTemporaria(
        editando ? 'Item atualizado com sucesso.' : 'Item cadastrado com sucesso.'
      );
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
    } finally {
      setSalvando(false);
    }
  }
  async function confirmarExclusao() {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await api.delete(
        `${tipo === 'materia-prima' ? '/estoque-materia-prima' : '/estoque-produtos-venda'}/${excluir.id}`
      );
      setNotificacaoTemporaria(
        `${excluir.nome} foi removido(a) do estoque.`
      );
      setExcluir(null);
      await carregar();
    } catch (e) {
      setErro(erroApi(e));
      setExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }
  if (formAberto)
    return (
      <TelaFormulario
        tipo={tipo}
        form={form}
        editando={Boolean(editando)}
        erro={erro}
        salvando={salvando}
        aoAlterar={(campo, valor) =>
          setForm(atual => ({ ...atual, [campo]: valor }))
        }
        aoCancelar={() => {
          setFormAberto(false);
          setErro('');
        }}
        aoSalvar={salvar}
      />
    );
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1200px] flex-col gap-6 px-5 py-7 sm:px-8 md:px-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#181c23] sm:text-4xl">
            Controle de Estoque
          </h1>
          <p className="mt-2 text-base text-[#444652]">
            Acompanhe materiais e produtos disponíveis na sapataria.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1d439c]"
          onClick={cadastrar}
          type="button"
        >
          <Plus className="size-4" />
          Adicionar {tipo === 'materia-prima' ? 'matéria-prima' : 'produto'}
        </button>
      </div>
      <div className="flex rounded-xl border border-[#c4c6d4]/70 bg-white p-1 sm:w-fit">
        <button
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${tipo === 'materia-prima' ? 'bg-[#002c7c] text-white' : 'text-[#444652] hover:bg-[#f1f3fe]'}`}
          onClick={() => trocar('materia-prima')}
          type="button"
        >
          <Boxes className="mr-2 inline size-4" />
          Matéria-prima
        </button>
        <button
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${tipo === 'produtos' ? 'bg-[#002c7c] text-white' : 'text-[#444652] hover:bg-[#f1f3fe]'}`}
          onClick={() => trocar('produtos')}
          type="button"
        >
          <ShoppingBag className="mr-2 inline size-4" />
          Produtos para venda
        </button>
      </div>
      {notificacaoTemporaria && (
        <NotificacaoTemporaria
          aoFechar={() => setNotificacaoTemporaria('')}
          mensagem={notificacaoTemporaria}
        />
      )}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          icone={Boxes}
          texto={
            tipo === 'materia-prima'
              ? 'Itens de matéria-prima'
              : 'Produtos cadastrados'
          }
          valor={String(itens.length)}
        />
        <Card
          alerta={baixos > 0}
          icone={AlertTriangle}
          texto={
            tipo === 'materia-prima'
              ? 'Itens com estoque baixo'
              : 'Itens em catálogo'
          }
          valor={String(tipo === 'materia-prima' ? baixos : itens.length)}
        />
        <Card
          icone={ShoppingBag}
          texto={
            tipo === 'materia-prima'
              ? 'Valor em matéria-prima'
              : 'Valor potencial de venda'
          }
          valor={dinheiro(valorTotal)}
        />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <label className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#444652]" />
          <input
            className="w-full rounded-lg border border-[#c4c6d4] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#002c7c]"
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar item..."
            type="search"
            value={busca}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {categorias.map(c => (
            <button
              className={`rounded-full px-3 py-2 text-xs font-semibold ${filtro === c ? 'bg-[#002c7c] text-white' : 'border border-[#c4c6d4] bg-white text-[#444652]'}`}
              key={c}
              onClick={() => setFiltro(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#c4c6d4]/70 bg-white shadow-sm">
        {carregando ? (
          <Carregando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#f1f3fe] text-xs uppercase tracking-wide text-[#444652]">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Quantidade</th>
                  {tipo === 'materia-prima' ? (
                    <>
                      <th className="px-6 py-4">Mínimo</th>
                      <th className="px-6 py-4">Custo</th>
                      <th className="px-6 py-4">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">Custo</th>
                      <th className="px-6 py-4">Venda</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(item => (
                  <Linha
                    item={item}
                    key={item.id}
                    tipo={tipo}
                    aoEditar={() => editar(item)}
                    aoExcluir={() => setExcluir(item)}
                  />
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-14 text-center text-[#444652]"
                      colSpan={7}
                    >
                      Nenhum item encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="mt-auto border-t border-[#c4c6d4]/60 px-6 py-4 text-sm text-[#444652]">
          Mostrando {filtrados.length} de {itens.length} itens
        </footer>
      </section>
      {excluir && (
        <Confirmacao
          item={excluir}
          excluindo={excluindo}
          aoCancelar={() => setExcluir(null)}
          aoConfirmar={() => void confirmarExclusao()}
        />
      )}
    </div>
  );
}

function Linha({
  item,
  tipo,
  aoEditar,
  aoExcluir,
}: {
  item: Materia | Produto;
  tipo: Tipo;
  aoEditar: () => void;
  aoExcluir: () => void;
}) {
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);
  const materia = item as Materia;
  const baixo =
    tipo === 'materia-prima' &&
    Number(materia.quantidade_minima ?? 0) > 0 &&
    Number(item.quantidade) <= Number(materia.quantidade_minima);
  return (
    <tr className="border-t border-[#c4c6d4]/55 hover:bg-[#f1f3fe]/45">
      <td className="px-6 py-4">
        <strong>{item.nome}</strong>
        {item.descricao && <div className="mt-1 text-xs text-[#747683]"><p className="break-words">{descricaoExpandida || item.descricao.length <= 140 ? item.descricao : `${item.descricao.slice(0, 140)}…`}</p>{item.descricao.length > 140 && <button aria-expanded={descricaoExpandida} className="mt-1 inline-flex items-center gap-1 font-semibold text-[#002c7c] hover:underline" onClick={() => setDescricaoExpandida(atual => !atual)} type="button">{descricaoExpandida ? <>Mostrar menos <ChevronUp className="size-3.5" /></> : <>Ver descrição completa <ChevronDown className="size-3.5" /></>}</button>}</div>}
      </td>
      <td className="px-6 py-4 text-[#444652]">
        {item.categoria || 'Sem categoria'}
      </td>
      <td
        className={
          baixo
            ? 'px-6 py-4 font-semibold text-[#ba1a1a]'
            : 'px-6 py-4 font-semibold'
        }
      >
        {quantidadeFormatada(
          item.quantidade,
          tipo === 'materia-prima' ? materia.unidade_medida : 'unidade'
        )}
      </td>
      {tipo === 'materia-prima' ? (
        <>
          <td className="px-6 py-4">
            {materia.quantidade_minima === null ||
            materia.quantidade_minima === undefined
              ? '—'
              : quantidadeFormatada(
                  materia.quantidade_minima,
                  materia.unidade_medida
                )}
          </td>
          <td className="px-6 py-4">{dinheiro(materia.valor_unitario)}</td>
          <td className="px-6 py-4">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${baixo ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#d9f7e7] text-[#256b43]'}`}
            >
              {baixo ? 'Estoque baixo' : 'Em dia'}
            </span>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4">
            {dinheiro((item as Produto).valor_custo)}
          </td>
          <td className="px-6 py-4 font-semibold">
            {dinheiro((item as Produto).valor_venda)}
          </td>
        </>
      )}
      <td className="px-6 py-4">
        <div className="flex justify-end gap-1">
          <button
            aria-label={`Editar ${item.nome}`}
            className="rounded-md p-2 text-[#605e59] hover:bg-[#e5e8f3]"
            onClick={aoEditar}
            type="button"
          >
            <Pencil className="size-4" />
          </button>
          <button
            aria-label={`Excluir ${item.nome}`}
            className="rounded-md p-2 text-[#a22929] hover:bg-[#ffefed]"
            onClick={aoExcluir}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
function Card({
  icone: Icone,
  texto,
  valor,
  alerta = false,
}: {
  icone: typeof Boxes;
  texto: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-5 ${alerta ? 'border-[#f1b8b3] bg-[#ffefed]' : 'border-[#c4c6d4]/70 bg-white'}`}
    >
      <Icone
        className={alerta ? 'size-5 text-[#ba1a1a]' : 'size-5 text-[#002c7c]'}
      />
      <p className="mt-4 text-sm text-[#444652]">{texto}</p>
      <strong
        className={
          alerta ? 'mt-1 block text-2xl text-[#ba1a1a]' : 'mt-1 block text-2xl'
        }
      >
        {valor}
      </strong>
    </article>
  );
}
function TelaFormulario({
  tipo,
  form,
  editando,
  erro,
  salvando,
  aoAlterar,
  aoCancelar,
  aoSalvar,
}: {
  tipo: Tipo;
  form: Formulario;
  editando: boolean;
  erro: string;
  salvando: boolean;
  aoAlterar: (campo: keyof Formulario, valor: string) => void;
  aoCancelar: () => void;
  aoSalvar: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const unidadesCompativeis =
    tipo === 'materia-prima'
      ? UNIDADES_MEDIDA.filter(unidade =>
          (
            UNIDADES_POR_CATEGORIA[form.categoria] ??
            UNIDADES_MEDIDA.map(item => item.valor)
          ).includes(unidade.valor)
        )
      : [];
  const aceitaDecimal =
    tipo === 'materia-prima' &&
    !['unidade', 'par', 'rolo', 'caixa', 'pacote'].includes(form.unidade);
  const campo = (
    rotulo: string,
    nome: keyof Formulario,
    type = 'text',
    req = false
  ) => (
    <label>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
        {rotulo}
        {req ? ' *' : ''}
      </span>
      <input
        className="mt-2 w-full rounded-lg border border-[#c4c6d4] px-4 py-3 text-sm outline-none focus:border-[#002c7c]"
        min={type === 'number' ? '0' : undefined}
        onChange={e => aoAlterar(nome, e.target.value)}
        required={req}
        step={type === 'number' ? '0.01' : undefined}
        type={type}
        value={form[nome]}
      />
    </label>
  );
  const lista = (
    rotulo: string,
    nome: keyof Formulario,
    opcoes: Array<{ valor: string; texto: string }>,
    req = false
  ) => (
    <label>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
        {rotulo}
        {req ? ' *' : ''}
      </span>
      <select
        className="mt-2 w-full rounded-lg border border-[#c4c6d4] bg-white px-4 py-3 text-sm outline-none focus:border-[#002c7c]"
        onChange={e => {
          const valor = e.target.value;
          aoAlterar(nome, valor);
          let unidadeSelecionada = valor;
          if (nome === 'categoria' && tipo === 'materia-prima') {
            const primeiraUnidade =
              UNIDADES_POR_CATEGORIA[valor]?.[0] ?? UNIDADES_MEDIDA[0].valor;
            aoAlterar('unidade', primeiraUnidade);
            unidadeSelecionada = primeiraUnidade;
          }
          if (
            tipo === 'materia-prima' &&
            (nome === 'categoria' || nome === 'unidade') &&
            ['unidade', 'par', 'rolo', 'caixa', 'pacote'].includes(
              unidadeSelecionada
            )
          ) {
            aoAlterar('quantidade', String(Math.trunc(Number(form.quantidade)) || 0));
            aoAlterar('minimo', String(Math.trunc(Number(form.minimo)) || 0));
          }
        }}
        required={req}
        value={form[nome]}
      >
        <option value="">Selecione uma opção</option>
        {opcoes.map(opcao => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.texto}
          </option>
        ))}
      </select>
    </label>
  );
  const campoMoeda = (rotulo: string, nome: 'custo' | 'venda', req = false) => (
    <label>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
        {rotulo}
        {req ? ' *' : ''}
      </span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#747683]">R$</span>
        <input
          className="w-full rounded-lg border border-[#c4c6d4] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#002c7c]"
          inputMode="numeric"
          onChange={e => aoAlterar(nome, moedaDigitada(e.target.value))}
          required={req}
          type="text"
          value={form[nome]}
        />
      </div>
    </label>
  );
  const campoQuantidade = (
    rotulo: string,
    nome: 'quantidade' | 'minimo',
    req = false
  ) => (
    <label>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
        {rotulo}
        {req ? ' *' : ''}
      </span>
      <input
        className="mt-2 w-full rounded-lg border border-[#c4c6d4] px-4 py-3 text-sm outline-none focus:border-[#002c7c]"
        inputMode={aceitaDecimal ? 'decimal' : 'numeric'}
        min="0"
        onChange={e =>
          aoAlterar(
            nome,
            aceitaDecimal ? e.target.value : e.target.value.replace(/\D/g, '')
          )
        }
        required={req}
        step={aceitaDecimal ? '0.01' : '1'}
        type={aceitaDecimal ? 'number' : 'text'}
        value={form[nome]}
      />
    </label>
  );
  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-[1000px] px-5 py-7 sm:px-8 md:px-16">
      <button
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#444652]"
        onClick={aoCancelar}
        type="button"
      >
        <ArrowLeft className="size-4" />
        Voltar para o estoque
      </button>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {editando
          ? 'Editar item'
          : `Novo item de ${tipo === 'materia-prima' ? 'matéria-prima' : 'produto'}`}
      </h1>
      <p className="mt-2 text-[#444652]">
        {tipo === 'materia-prima'
          ? 'Cadastre materiais usados nos serviços da sapataria.'
          : 'Cadastre produtos para venda direta.'}
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
          <div className="sm:col-span-2">
            {campo('Nome do item', 'nome', 'text', true)}
          </div>
          {lista(
            'Categoria',
            'categoria',
            (tipo === 'materia-prima'
              ? CATEGORIAS_MATERIA_PRIMA
              : CATEGORIAS_PRODUTOS
            ).map(valor => ({ valor, texto: valor })),
            true
          )}
          {tipo === 'materia-prima' ? (
            <>
              {campo('Fornecedor', 'fornecedor', 'text', true)}
              {lista(
                'Unidade de medida',
                'unidade',
                unidadesCompativeis,
                true
              )}
              {campoQuantidade('Quantidade atual', 'quantidade', true)}
              {campoQuantidade('Estoque mínimo', 'minimo', true)}
              {campoMoeda('Preço de custo', 'custo', true)}
            </>
          ) : (
            <>
              {campoQuantidade('Quantidade', 'quantidade', true)}
              {campoMoeda('Valor de custo', 'custo', true)}
              {campoMoeda('Valor de venda', 'venda', true)}
            </>
          )}
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#444652]">
              Descrição
            </span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-lg border border-[#c4c6d4] px-4 py-3 text-sm outline-none focus:border-[#002c7c]"
              maxLength={200}
              onChange={e => aoAlterar('descricao', e.target.value)}
              value={form.descricao}
            />
            <p className="mt-1 text-right text-xs text-[#747683]">
              {form.descricao.length}/200 caracteres
            </p>
          </label>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-[#c4c6d4]/60 pt-6">
          <button
            className="rounded-lg px-5 py-3 text-sm font-semibold text-[#444652]"
            onClick={aoCancelar}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#002c7c] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={salvando}
            type="submit"
          >
            {salvando ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <PackagePlus className="size-4" />
            )}
            {editando ? 'Salvar alterações' : 'Cadastrar item'}
          </button>
        </div>
      </form>
    </div>
  );
}
function Carregando() {
  return (
    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#444652]">
      <LoaderCircle className="size-5 animate-spin text-[#002c7c]" />
      Carregando estoque...
    </div>
  );
}
function Aviso({
  tipo,
  children,
}: {
  tipo: 'erro' | 'sucesso';
  children: string;
}) {
  const ruim = tipo === 'erro';
  const Icone = ruim ? XCircle : CheckCircle2;
  return (
    <div
      className={`flex gap-2 rounded-lg border px-4 py-3 text-sm ${ruim ? 'border-[#f1b8b3] bg-[#ffefed] text-[#93000a]' : 'border-[#a8ddb9] bg-[#ebf9ee] text-[#256b43]'}`}
    >
      <Icone className="size-4 shrink-0" />
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
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        {mensagem}
      </div>
      <span className="absolute inset-x-0 bottom-0 h-1 origin-left bg-[#256b43]/55 animate-progresso-notificacao" />
    </div>
  );
}
function Confirmacao({
  item,
  excluindo,
  aoCancelar,
  aoConfirmar,
}: {
  item: Materia | Produto;
  excluindo: boolean;
  aoCancelar: () => void;
  aoConfirmar: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181c23]/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <Trash2 className="size-6 text-[#ba1a1a]" />
        <h2 className="mt-4 text-xl font-semibold">Excluir item do estoque?</h2>
        <p className="mt-2 text-sm leading-6 text-[#444652]">
          Você tem certeza de que deseja excluir <strong>{item.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg px-4 py-2.5 text-sm font-semibold"
            disabled={excluindo}
            onClick={aoCancelar}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-lg bg-[#ba1a1a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={excluindo}
            onClick={aoConfirmar}
            type="button"
          >
            {excluindo ? 'Excluindo...' : 'Excluir item'}
          </button>
        </div>
      </div>
    </div>
  );
}
