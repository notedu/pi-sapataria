import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import CartaoInformacoes from '../components/CartaoInformacoes'
import Dialog from '../components/Dialog'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import { ErroApi } from '../services/api'
import {
  exportarFinanceiroCsv,
  exportarFinanceiroExcel,
} from '../utils/exportacaoFinanceiro'
import {
  consultarFechamento,
  consultarFinanceiro,
  fecharCaixa,
  listarFechamentos,
  consultarCategoriasDespesas,
  criarCategoriaDespesa,
  criarDespesa,
  registrarPagamento,
  corrigirFechamento as salvarCorrecaoFechamento,
  consultarCorrecoesFechamento,
} from '../services/financeiro'
import type {
  ContaFinanceira,
  DadosFinanceiros,
  FechamentoCaixa,
  ItemManualFechamento,
  MovimentoFinanceiro,
  PagamentoFechamento,
} from '../services/financeiro'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const dataHoje = () => {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
const inicioMes = (data: string) => `${data.slice(0, 7)}-01`
const inicioSemana = (data: string) => {
  const dia = new Date(`${data}T00:00:00Z`).getUTCDay()
  const deslocamento = (dia + 6) % 7
  const inicio = new Date(`${data}T00:00:00Z`)
  inicio.setUTCDate(inicio.getUTCDate() - deslocamento)
  return inicio.toISOString().slice(0, 10)
}
const formatarData = (data: string) =>
  data.slice(0, 10).split('-').reverse().join('/')
const formatarDinheiro = (valor: string | null | undefined) =>
  valor === null || valor === undefined
    ? 'Não disponível'
    : moeda.format(Number(valor))
const nomeCategoria = (categoria: string) =>
  ({
    venda: 'Venda',
    ordem_servico: 'Ordem de serviço',
    compra_materiais: 'Compra de materiais',
    compra_produtos: 'Compra de produtos',
    compra_estoque: 'Compra de estoque',
    aluguel: 'Aluguel',
    energia: 'Energia',
    agua: 'Água',
    funcionarios: 'Funcionários',
    estorno: 'Estorno',
  })[categoria] ?? categoria
const origemMovimento = (movimento: MovimentoFinanceiro) =>
  movimento.categoria.startsWith('compra_')
    ? 'compras'
    : movimento.categoria === 'estorno'
        ? 'estornos'
        : movimento.categoria === 'ordem_servico'
          ? 'os'
          : movimento.tipo==='saida'?'despesas':'vendas'
const statusLabel = (status: ContaFinanceira['status']) =>
  ({
    pendente: 'Pendente',
    pago: 'Pago',
    vencido: 'Vencido',
    parcial: 'Parcial',
  })[status]
type Periodo = { inicio: string; fim: string }
type ColunaConta =
  | 'descricao'
  | 'vencimento'
  | 'numero'
  | 'valor'
  | 'valor_pago'
  | 'status'
type Ordenacao = { coluna: ColunaConta; direcao: 'asc' | 'desc' }

function apurarFechamentoManual(
  pagamentos: PagamentoFechamento[],
  idsSelecionados: number[],
  itens: ItemManualFechamento[],
) {
  let entradasCentavos = 0
  let saidasCentavos = 0
  const formas: Record<string, number> = {}
  const origens: Record<string, number> = {
    ordem_servico: 0,
    venda: 0,
    outro: 0,
  }
  const categoriasSaida: Record<string, number> = {}
  const somar = (mapa: Record<string, number>, chave: string, centavos: number) => {
    mapa[chave] = (mapa[chave] ?? 0) + centavos
  }
  const selecionados = pagamentos.filter((item) => idsSelecionados.includes(item.id))
  for (const item of selecionados) {
    const centavos = Math.round(Number(item.valor) * 100)
    if (item.tipo === 'entrada') {
      entradasCentavos += centavos
      somar(formas, item.forma_pagamento, centavos)
      const origem =
        item.categoria === 'ordem_servico' || item.categoria === 'venda'
          ? item.categoria
          : 'outro'
      somar(origens, origem, centavos)
    } else {
      saidasCentavos += centavos
      somar(categoriasSaida, item.categoria, centavos)
    }
  }
  for (const item of itens) {
    const centavos = Math.round(Number(item.valor) * 100)
    if (item.tipo === 'entrada') {
      entradasCentavos += centavos
      if (item.forma_pagamento) somar(formas, item.forma_pagamento, centavos)
      somar(origens, item.origem, centavos)
    } else {
      saidasCentavos += centavos
      somar(categoriasSaida, 'manual', centavos)
    }
  }
  const mapaMoeda = (mapa: Record<string, number>) =>
    Object.fromEntries(
      Object.entries(mapa).map(([chave, valor]) => [chave, (valor / 100).toFixed(2)]),
    )
  return {
    recebimentos_brutos: (entradasCentavos / 100).toFixed(2),
    saidas: (saidasCentavos / 100).toFixed(2),
    total_liquido: ((entradasCentavos - saidasCentavos) / 100).toFixed(2),
    por_forma_pagamento: mapaMoeda(formas),
    por_origem: mapaMoeda(origens),
    saidas_por_categoria: mapaMoeda(categoriasSaida),
  }
}

export default function Financeiro() {
  const navigate = useNavigate()
  const hoje = dataHoje()
  const [opcao, setOpcao] = useState('mes')
  const [periodo, setPeriodo] = useState<Periodo>({
    inicio: inicioMes(hoje),
    fim: hoje,
  })
  const [rascunho, setRascunho] = useState(periodo)
  const [dados, setDados] = useState<DadosFinanceiros | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [exportandoExcel, setExportandoExcel] = useState(false)
  const [erroExportacao, setErroExportacao] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<
    'todos' | MovimentoFinanceiro['tipo']
  >('todos')
  const [origemFiltro, setOrigemFiltro] = useState<
    'todas' | 'vendas' | 'os' | 'compras' | 'despesas' | 'estornos'
  >('todas')
  const [detalhe, setDetalhe] = useState<
    MovimentoFinanceiro | ContaFinanceira | null
  >(null)
  const [ordenacao, setOrdenacao] = useState<Ordenacao | null>(null)
  const [mostrarFechamento, setMostrarFechamento] = useState(false)
  const [dataFechamento, setDataFechamento] = useState(hoje)
  const [fechamento, setFechamento] = useState<FechamentoCaixa | null>(null)
  const [pagamentosDisponiveis, setPagamentosDisponiveis] = useState<PagamentoFechamento[]>([])
  const [modoFechamento, setModoFechamento] = useState<'automatico' | 'manual'>('automatico')
  const [pagamentosSelecionados, setPagamentosSelecionados] = useState<number[]>([])
  const [itensManuais, setItensManuais] = useState<ItemManualFechamento[]>([])
  const [descricaoManual, setDescricaoManual] = useState('')
  const [tipoManual, setTipoManual] = useState<'entrada' | 'saida'>('entrada')
  const [valorManual, setValorManual] = useState('')
  const [formaManual, setFormaManual] = useState<'pix' | 'credito' | 'debito' | 'dinheiro'>('dinheiro')
  const [origemManual, setOrigemManual] = useState<'ordem_servico' | 'venda' | 'outro'>('outro')
  const [historicoFechamentos, setHistoricoFechamentos] = useState<FechamentoCaixa[]>([])
  const [paginaHistorico, setPaginaHistorico] = useState(1)
  const [filtroHistorico, setFiltroHistorico] = useState({inicio:'',fim:''})
  const [totalPaginasHistorico, setTotalPaginasHistorico] = useState(0)
  const [corrigindoFechamento, setCorrigindoFechamento] = useState(false)
  const [motivoCorrecao, setMotivoCorrecao] = useState('')
  const [fonteManual, setFonteManual] = useState<'pagamentos'|'valores'>('valores')
  const [formatoManual, setFormatoManual] = useState<'resumo'|'detalhado'>('resumo')
  const [valoresResumo, setValoresResumo] = useState({dinheiro:'0.00',pix:'0.00',credito:'0.00',debito:'0.00',servicos:'0.00',vendas:'0.00',saidas:'0.00'})
  const [dinheiroContado, setDinheiroContado] = useState('')
  const [categoriasDespesas, setCategoriasDespesas] = useState<Array<{id:number;nome:string}>>([])
  const [categoriaNova, setCategoriaNova] = useState('')
  const [despesaForm, setDespesaForm] = useState({categoria:'aluguel',descricao:'',valor:'',vencimento:hoje,total_parcelas:'1'})
  const [erroDespesa, setErroDespesa] = useState('')
  const [carregandoDespesa, setCarregandoDespesa] = useState(false)
  const [pagamentoConta, setPagamentoConta] = useState({valor:'',forma:'dinheiro'})
  const [correcoesFechamento,setCorrecoesFechamento]=useState<Array<{id:number;corrigido_em:string;motivo:string;corrigido_por:string|null;fechamento_anterior:Pick<FechamentoCaixa,'recebimentos_brutos'|'saidas'|'total_liquido'>}>>([])
  const [erroFechamento, setErroFechamento] = useState('')
  const [carregandoFechamento, setCarregandoFechamento] = useState(false)

  useEffect(() => {
    let ativo = true
    void consultarFinanceiro(periodo.inicio, periodo.fim)
      .then((resultado) => {
        if (!ativo) return
        setErro('')
        setDados(resultado)
      })
      .catch((error) => {
        if (!ativo) return
        setErro(
          error instanceof ErroApi && error.status === 403
            ? 'O Financeiro é exclusivo do Administrador.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível consultar o Financeiro.',
        )
        setDados(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [periodo])
  useEffect(() => { void consultarCategoriasDespesas().then(setCategoriasDespesas).catch(()=>setErroDespesa('Não foi possível consultar categorias de despesas.')) }, [])
  const movimentos = useMemo(
    () =>
      (dados?.movimentacoes ?? []).filter(
        (item) =>
          (tipoFiltro === 'todos' || item.tipo === tipoFiltro) &&
          (origemFiltro === 'todas' || origemMovimento(item) === origemFiltro),
      ),
    [dados, tipoFiltro, origemFiltro],
  )
  const contasOrdenadas = useMemo(() => {
    const contas = [...(dados?.contas ?? [])]
    if (!ordenacao) return contas
    const multiplicador = ordenacao.direcao === 'asc' ? 1 : -1
    return contas.sort((a, b) => {
      const coluna = ordenacao.coluna
      const comparacao =
        coluna === 'descricao' || coluna === 'status'
          ? (coluna === 'descricao' ? a.descricao : statusLabel(a.status)).localeCompare(
              coluna === 'descricao' ? b.descricao : statusLabel(b.status),
              'pt-BR',
            )
          : coluna === 'vencimento'
            ? a.vencimento.localeCompare(b.vencimento)
            : coluna === 'numero'
              ? a.numero - b.numero || a.total_parcelas - b.total_parcelas
              : Number(a[coluna]) - Number(b[coluna])
      return comparacao * multiplicador
    })
  }, [dados?.contas, ordenacao])

  function ordenarContas(coluna: ColunaConta) {
    setOrdenacao((atual) => ({
      coluna,
      direcao:
        atual?.coluna === coluna && atual.direcao === 'asc' ? 'desc' : 'asc',
    }))
  }

  function selecionarPeriodo(valor: string) {
    setOpcao(valor)
    if (valor === 'todo') {
      setCarregando(true)
      setErro('')
      setPeriodo({ inicio: '', fim: '' })
    }
    if (valor === 'hoje') {
      setCarregando(true)
      setPeriodo({ inicio: hoje, fim: hoje })
    }
    if (valor === 'semana') {
      setCarregando(true)
      setPeriodo({ inicio: inicioSemana(hoje), fim: hoje })
    }
    if (valor === 'mes') {
      setCarregando(true)
      setPeriodo({ inicio: inicioMes(hoje), fim: hoje })
    }
    if (valor !== 'personalizado') setRascunho(periodo)
  }
  function aplicarPeriodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rascunho.inicio || !rascunho.fim || rascunho.inicio > rascunho.fim) {
      setErro('Informe as duas datas, com o início anterior ou igual ao fim.')
      return
    }
    setErro('')
    setCarregando(true)
    setPeriodo(rascunho)
  }

  async function baixarExcel() {
    if (!dados) return
    setExportandoExcel(true)
    setErroExportacao('')
    try {
      await exportarFinanceiroExcel(dados, movimentos, contasOrdenadas, periodo)
    } catch (error) {
      setErroExportacao(
        error instanceof Error
          ? `Não foi possível gerar o Excel: ${error.message}`
          : 'Não foi possível gerar o arquivo Excel. Tente novamente.',
      )
    } finally {
      setExportandoExcel(false)
    }
  }

  function aplicarDadosFechamento(resultado: Awaited<ReturnType<typeof consultarFechamento>>) {
    setFechamento(resultado.fechamento)
    setPagamentosDisponiveis(resultado.pagamentos_disponiveis)
    const atual = resultado.fechamento
    if (atual.fechado) {
      setModoFechamento(atual.modo)
      setPagamentosSelecionados(atual.pagamentos_selecionados.map((item) => item.id))
      setItensManuais(atual.itens_manuais)
      setFonteManual(atual.fonte_manual)
      setFormatoManual(atual.formato_manual)
      if(atual.resumo_manual) setValoresResumo(atual.resumo_manual as typeof valoresResumo)
      setDinheiroContado(atual.dinheiro_contado ?? '')
    } else {
      setModoFechamento('automatico')
      setPagamentosSelecionados([])
      setItensManuais([])
      setFonteManual('valores'); setFormatoManual('resumo')
      setValoresResumo({dinheiro:'0.00',pix:'0.00',credito:'0.00',debito:'0.00',servicos:'0.00',vendas:'0.00',saidas:'0.00'})
      setDinheiroContado('')
    }
  }

  async function abrirFechamento() {
    setMostrarFechamento((atual) => !atual)
    if (mostrarFechamento) return
    setCarregandoFechamento(true)
    setErroFechamento('')
    try {
      const [atual, historico,correcoes] = await Promise.all([
        consultarFechamento(dataFechamento),
        listarFechamentos(filtroHistorico.inicio||undefined,filtroHistorico.fim||undefined,paginaHistorico),
        consultarCorrecoesFechamento(dataFechamento),
      ])
      aplicarDadosFechamento(atual)
      setHistoricoFechamentos(historico.itens); setTotalPaginasHistorico(historico.paginas)
      setCorrecoesFechamento(correcoes)
    } catch (error) {
      setErroFechamento(error instanceof Error ? error.message : 'Não foi possível consultar o fechamento.')
    } finally {
      setCarregandoFechamento(false)
    }
  }

  async function consultarDiaFechamento(data: string) {
    setDataFechamento(data)
    setFechamento(null); setPagamentosDisponiveis([]); setItensManuais([]); setPagamentosSelecionados([]); setCorrigindoFechamento(false)
    setCarregandoFechamento(true)
    setErroFechamento('')
    try {
      const [atual,correcoes]=await Promise.all([consultarFechamento(data),consultarCorrecoesFechamento(data)])
      aplicarDadosFechamento(atual);setCorrecoesFechamento(correcoes)
    } catch (error) {
      setErroFechamento(error instanceof Error ? error.message : 'Não foi possível consultar o dia.')
    } finally {
      setCarregandoFechamento(false)
    }
  }

  async function confirmarFechamento() {
    setCarregandoFechamento(true)
    setErroFechamento('')
    try {
      const dadosManual={modo:modoFechamento,pagamentos_ids:modoFechamento==='manual'&&fonteManual==='pagamentos'?pagamentosSelecionados:[],itens_manuais:modoFechamento==='manual'&&fonteManual==='valores'&&formatoManual==='detalhado'?itensManuais:[],formato_manual:formatoManual,resumo_manual:modoFechamento==='manual'&&fonteManual==='valores'&&formatoManual==='resumo'?Object.fromEntries(Object.entries(valoresResumo).map(([k,v])=>[k,Number(v||0).toFixed(2)])):null,dinheiro_contado:dinheiroContado||null,fonte_manual:fonteManual}
      const salvo = corrigindoFechamento ? await salvarCorrecaoFechamento(dataFechamento,{...dadosManual,motivo:motivoCorrecao}) : await fecharCaixa(
        dataFechamento,
        modoFechamento,
        dadosManual.pagamentos_ids as number[],
        dadosManual.itens_manuais as ItemManualFechamento[],
        formatoManual,dadosManual.resumo_manual as Record<string,string>|null,dinheiroContado||null,fonteManual,
      )
      setFechamento(salvo)
      setCorrigindoFechamento(false); setMotivoCorrecao('')
      setCorrecoesFechamento(await consultarCorrecoesFechamento(dataFechamento))
      const historico=await listarFechamentos(filtroHistorico.inicio||undefined,filtroHistorico.fim||undefined,paginaHistorico)
      setHistoricoFechamentos(historico.itens); setTotalPaginasHistorico(historico.paginas)
    } catch (error) {
      setErroFechamento(error instanceof Error ? error.message : 'Não foi possível fechar o caixa.')
    } finally {
      setCarregandoFechamento(false)
    }
  }

  async function atualizarHistorico(pagina=1) {
    try { const resultado=await listarFechamentos(filtroHistorico.inicio||undefined,filtroHistorico.fim||undefined,pagina); setHistoricoFechamentos(resultado.itens); setTotalPaginasHistorico(resultado.paginas); setPaginaHistorico(pagina) }
    catch(error){setErroFechamento(error instanceof Error?error.message:'Não foi possível consultar o histórico.')}
  }

  async function salvarDespesa(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCarregandoDespesa(true); setErroDespesa('')
    try { await criarDespesa({...despesaForm,valor:despesaForm.valor.replace(',','.'),total_parcelas:Number(despesaForm.total_parcelas)}); setDespesaForm(v=>({...v,descricao:'',valor:''})); setPeriodo({...periodo}) }
    catch(error){setErroDespesa(error instanceof Error?error.message:'Não foi possível cadastrar despesa.')}
    finally{setCarregandoDespesa(false)}
  }

  async function salvarCategoria() {
    if(!categoriaNova.trim()) return
    setCarregandoDespesa(true); setErroDespesa('')
    try { await criarCategoriaDespesa(categoriaNova.trim()); const lista=await consultarCategoriasDespesas(); setCategoriasDespesas(lista); setDespesaForm(v=>({...v,categoria:lista.find(c=>c.nome.toLowerCase()===categoriaNova.trim().toLowerCase())?.nome??v.categoria})); setCategoriaNova('') }
    catch(error){setErroDespesa(error instanceof Error?error.message:'Não foi possível criar categoria.')}
    finally{setCarregandoDespesa(false)}
  }

  async function pagarConta(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!detalhe||!('parcela_id' in detalhe)) return
    setCarregandoDespesa(true); setErroDespesa('')
    try { await registrarPagamento({parcela_id:detalhe.parcela_id,valor:pagamentoConta.valor.replace(',','.'),forma_pagamento:pagamentoConta.forma}); const atual=await consultarFinanceiro(periodo.inicio,periodo.fim); setDados(atual); setDetalhe(null); setPagamentoConta({valor:'',forma:'dinheiro'}) }
    catch(error){setErroDespesa(error instanceof Error?error.message:'Não foi possível registrar pagamento.')}
    finally{setCarregandoDespesa(false)}
  }

  function adicionarItemManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setItensManuais((atuais) => [
      ...atuais,
      {
        descricao: descricaoManual.trim(),
        tipo: tipoManual,
        valor: Number(valorManual).toFixed(2),
        forma_pagamento: tipoManual === 'entrada' ? formaManual : null,
        origem: tipoManual === 'entrada' ? origemManual : 'outro',
      },
    ])
    setDescricaoManual('')
    setValorManual('')
  }

  const resumoFechamento = useMemo(() => {
    if (!fechamento) return null
    if ((fechamento.fechado && !corrigindoFechamento) || modoFechamento === 'automatico')
      return fechamento
    if(fonteManual==='valores'&&formatoManual==='resumo') {
      const bruto=Number(valoresResumo.servicos||0)+Number(valoresResumo.vendas||0)
      const saida=Number(valoresResumo.saidas||0)
      return {...fechamento,recebimentos_brutos:bruto.toFixed(2),saidas:saida.toFixed(2),total_liquido:(bruto-saida).toFixed(2),por_forma_pagamento:Object.fromEntries(['dinheiro','pix','credito','debito'].map(k=>[k,Number(valoresResumo[k as keyof typeof valoresResumo]||0).toFixed(2)])),por_origem:{ordem_servico:Number(valoresResumo.servicos||0).toFixed(2),venda:Number(valoresResumo.vendas||0).toFixed(2),outro:'0.00'},saidas_por_categoria:saida?{manual:saida.toFixed(2)}:{}}
    }
    return {
      ...fechamento,
      ...apurarFechamentoManual(
        pagamentosDisponiveis,
        pagamentosSelecionados,
        fonteManual==='valores'?itensManuais:[],
      ),
    }
  }, [fechamento, modoFechamento, pagamentosDisponiveis, pagamentosSelecionados, itensManuais, fonteManual, formatoManual,valoresResumo,corrigindoFechamento])

  return (
    <div className="mx-auto max-w-container-max space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-label-md text-primary">
            SEDA E COURO · GESTÃO INTERNA
          </p>
          <h1 className="text-headline-lg-mobile md:text-headline-lg">
            Financeiro
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Receitas, pagamentos, custos e despesas registrados no regime de
            caixa.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="compact"
            disabled
            title="Emissão fiscal será habilitada após a definição da integração tributária"
          >
            Emitir nota fiscal (em breve)
          </Button>
          <Button
            variant="secondary"
            size="compact"
            className="mobile-action"
            onClick={() => navigate('/dashboard')}
          >
            Voltar
          </Button>
        </div>
      </header>
      <aside
        aria-label="Escopo do painel"
        className="rounded-default border border-outline-variant bg-secondary-container p-4 text-body-md"
      >
        <strong>Apuração baseada nos registros do sistema.</strong> Os indicadores
        consultam pagamentos e despesas existentes; o fechamento diário salva
        uma fotografia para conferência. Impostos, notas fiscais e lucro líquido
        aguardam suas regras específicas.
      </aside>
      <section className="rounded-default border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-headline-md">Fechamento diário de caixa</h2>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Escolha apuração automática ou monte o fechamento manualmente.
            </p>
          </div>
          <Button
            variant="secondary"
            size="compact"
            onClick={() => void abrirFechamento()}
          >
            {mostrarFechamento ? 'Ocultar fechamento' : 'Abrir fechamento'}
          </Button>
        </div>
        {mostrarFechamento && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-end gap-3">
              <InputField
                id="data-fechamento-caixa"
                label="Dia do caixa"
                type="date"
                required
                value={dataFechamento}
                onChange={(event) => void consultarDiaFechamento(event.target.value)}
              />
              <SelectField
                id="modo-fechamento-caixa"
                label="Modo de fechamento"
                value={fechamento?.fechado&&!corrigindoFechamento ? fechamento.modo : modoFechamento}
                disabled={Boolean(fechamento?.fechado&&!corrigindoFechamento)}
                onChange={(event) =>
                  setModoFechamento(event.target.value as typeof modoFechamento)
                }
              >
                <option value="automatico">Automático</option>
                <option value="manual">Manual</option>
              </SelectField>
              {fechamento?.fechado&&!corrigindoFechamento&&<Button variant="secondary" size="compact" onClick={()=>{setCorrigindoFechamento(true);setModoFechamento(fechamento.modo);setMotivoCorrecao('')}}>Corrigir fechamento</Button>}
              {corrigindoFechamento&&fechamento&&<Button variant="secondary" size="compact" onClick={()=>{setCorrigindoFechamento(false);setMotivoCorrecao('');aplicarDadosFechamento({fechamento,pagamentos_disponiveis:pagamentosDisponiveis})}}>Cancelar correção</Button>}
              {fechamento && (!fechamento.fechado||corrigindoFechamento) && (
                <Button
                  size="compact"
                  disabled={carregandoFechamento||(corrigindoFechamento&&!motivoCorrecao.trim())}
                  onClick={() => void confirmarFechamento()}
                >
                  {modoFechamento === 'manual'
                    ? corrigindoFechamento?'Salvar correção manual':'Confirmar fechamento manual'
                    : corrigindoFechamento?'Salvar correção automática':'Confirmar fechamento automático'}
                </Button>
              )}
            </div>
            {corrigindoFechamento&&<InputField id="motivo-correcao-fechamento" label="Motivo da correção" required value={motivoCorrecao} onChange={(e)=>setMotivoCorrecao(e.target.value)} maxLength={500}/>}
            {carregandoFechamento && <p role="status">Apurando o caixa…</p>}
            {erroFechamento && (
              <p role="alert" className="text-error">
                {erroFechamento}
              </p>
            )}
            {fechamento && modoFechamento === 'manual' && (!fechamento.fechado||corrigindoFechamento) && (
              <div className="space-y-5 rounded-default border border-outline-variant p-4">
                <div>
                  <h3 className="text-headline-sm">Escolha os pagamentos do dia</h3>
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Marque cada recebimento ou saída registrada que deve entrar neste fechamento.
                  </p>
                </div>
                <SelectField id="fonte-fechamento-manual" label="Como preencher" value={fonteManual} onChange={(e)=>{setFonteManual(e.target.value as typeof fonteManual);setPagamentosSelecionados([]);setItensManuais([])}}>
                  <option value="pagamentos">Selecionar pagamentos registrados</option><option value="valores">Preencher valores</option>
                </SelectField>
                {fonteManual==='pagamentos' && (pagamentosDisponiveis.length ? (
                  <ul className="max-h-72 divide-y divide-outline-variant overflow-y-auto">
                    {pagamentosDisponiveis.map((item) => (
                      <li key={item.id} className="py-2">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={pagamentosSelecionados.includes(item.id)}
                            onChange={(event) =>
                              setPagamentosSelecionados((ids) =>
                                event.target.checked
                                  ? [...ids, item.id]
                                  : ids.filter((id) => id !== item.id),
                              )
                            }
                          />
                          <span className="flex flex-1 flex-wrap justify-between gap-2">
                            <span>
                              {item.descricao} · {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              {' · '}
                              {item.tipo === 'entrada'
                                ? ({
                                    ordem_servico: 'Serviço',
                                    venda: 'Venda',
                                  } as Record<string, string>)[item.categoria] ?? item.categoria
                                : nomeCategoria(item.categoria)}
                              {item.tipo === 'entrada' && ` · ${item.forma_pagamento}`}
                            </span>
                            <strong className="tabular-nums">
                              {formatarDinheiro(item.valor)}
                            </strong>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-on-surface-variant">
                    Nenhum pagamento registrado nesta data. Você ainda pode incluir valores manuais.
                  </p>
                ))}
                {fonteManual==='valores'&&<SelectField id="formato-manual" label="Formato dos valores" value={formatoManual} onChange={(e)=>{setFormatoManual(e.target.value as typeof formatoManual);setItensManuais([])}}><option value="resumo">Resumo do caixa</option><option value="detalhado">Lista detalhada</option></SelectField>}
                {fonteManual==='valores'&&formatoManual==='resumo'&&<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{([['dinheiro','Dinheiro'],['pix','Pix'],['credito','Cartão de crédito'],['debito','Cartão de débito'],['servicos','Serviços'],['vendas','Vendas'],['saidas','Saídas']] as const).map(([campo,label])=><InputField key={campo} id={`resumo-${campo}`} label={`${label} (R$)`} type="number" min="0" step="0.01" value={valoresResumo[campo]} onChange={(e)=>setValoresResumo(v=>({...v,[campo]:e.target.value}))}/>)}</div>}
                {fonteManual==='valores'&&formatoManual==='detalhado'&&<form
                  onSubmit={adicionarItemManual}
                  className="space-y-4 border-t border-outline-variant pt-4"
                >
                  <h3 className="text-headline-sm">Adicionar valor manual</h3>
                  <p className="text-label-sm text-on-surface-variant">
                    Informe os movimentos do dia que ainda não foram registrados no sistema.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InputField
                      id="descricao-item-manual"
                      label="Descrição"
                      required
                      maxLength={200}
                      value={descricaoManual}
                      onChange={(event) => setDescricaoManual(event.target.value)}
                    />
                    <SelectField
                      id="tipo-item-manual"
                      label="Tipo"
                      value={tipoManual}
                      onChange={(event) =>
                        setTipoManual(event.target.value as typeof tipoManual)
                      }
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </SelectField>
                    <InputField
                      id="valor-item-manual"
                      label="Valor (R$)"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={valorManual}
                      onChange={(event) => setValorManual(event.target.value)}
                    />
                    {tipoManual === 'entrada' && (
                      <SelectField
                        id="forma-item-manual"
                        label="Forma de pagamento"
                        value={formaManual}
                        onChange={(event) =>
                          setFormaManual(event.target.value as typeof formaManual)
                        }
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">Pix</option>
                        <option value="credito">Cartão de crédito</option>
                        <option value="debito">Cartão de débito</option>
                      </SelectField>
                    )}
                    {tipoManual === 'entrada' && (
                      <SelectField
                        id="origem-item-manual"
                        label="Origem"
                        value={origemManual}
                        onChange={(event) =>
                          setOrigemManual(event.target.value as typeof origemManual)
                        }
                      >
                        <option value="outro">Outra entrada</option>
                        <option value="ordem_servico">Serviço</option>
                        <option value="venda">Venda</option>
                      </SelectField>
                    )}
                  </div>
                  <Button type="submit" variant="secondary" size="compact">
                    Adicionar ao fechamento
                  </Button>
                </form>}
                {fonteManual==='valores'&&formatoManual==='detalhado'&&itensManuais.length > 0 && (
                  <ul className="divide-y divide-outline-variant">
                    {itensManuais.map((item, indice) => (
                      <li
                        key={`${item.descricao}-${indice}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span>
                          {item.descricao} · {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          {item.forma_pagamento && ` · ${item.forma_pagamento}`}
                        </span>
                        <span className="flex items-center gap-3">
                          <strong>{formatarDinheiro(item.valor)}</strong>
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            onClick={() =>
                              setItensManuais((itens) =>
                                itens.filter((_, posicao) => posicao !== indice),
                              )
                            }
                          >
                            Remover
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {fechamento && resumoFechamento && (
              <>
                {(!fechamento.fechado||corrigindoFechamento)&&<InputField id="dinheiro-contado" label="Dinheiro contado no caixa (R$)" type="number" min="0" step="0.01" value={dinheiroContado} onChange={(e)=>setDinheiroContado(e.target.value)}/>}
                <p className="text-label-sm text-on-surface-variant">
                  {fechamento.fechado
                    ? `Fechamento ${fechamento.modo}. Os valores salvos são uma fotografia do dia.`
                    : modoFechamento === 'manual'
                      ? 'Prévia manual: considera somente os pagamentos selecionados e os valores avulsos adicionados.'
                      : 'Prévia automática calculada com todos os pagamentos e saídas registrados para este dia.'}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <CartaoInformacoes titulo="Recebimentos brutos" icone="financeiro">
                    <p className="text-headline-md tabular-nums">
                      {formatarDinheiro(resumoFechamento.recebimentos_brutos)}
                    </p>
                  </CartaoInformacoes>
                  <CartaoInformacoes titulo="Saídas" icone="observacoes">
                    <p className="text-headline-md tabular-nums">
                      {formatarDinheiro(resumoFechamento.saidas)}
                    </p>
                  </CartaoInformacoes>
                  <CartaoInformacoes titulo="Total líquido" icone="dashboard" destaque>
                    <p className="text-headline-md tabular-nums">
                      {formatarDinheiro(resumoFechamento.total_liquido)}
                    </p>
                  </CartaoInformacoes>
                </div>
                {(dinheiroContado!==''||fechamento.dinheiro_contado!==null)&&<p className="rounded-default bg-secondary-container p-3 text-body-md">Diferença do dinheiro: <strong>{formatarDinheiro((Number(dinheiroContado||fechamento.dinheiro_contado)-Number(resumoFechamento.por_forma_pagamento.dinheiro||0)).toFixed(2))}</strong> (contado menos registrado)</p>}
                {modoFechamento==='manual'&&fonteManual==='valores'&&formatoManual==='resumo'&&<p className="rounded-default bg-secondary-container p-3 text-body-md">Conferência das classificações: meios de pagamento {formatarDinheiro(Object.values(valoresResumo).slice(0,4).reduce((s,v)=>s+Number(v||0),0).toFixed(2))}; serviços + vendas {formatarDinheiro((Number(valoresResumo.servicos||0)+Number(valoresResumo.vendas||0)).toFixed(2))}. As duas somas devem corresponder.</p>}
                {correcoesFechamento.length>0&&<div className="rounded-default border border-outline-variant p-4"><h3 className="text-label-md">Correções anteriores</h3><ul className="mt-2 space-y-2">{correcoesFechamento.map(c=><li key={c.id}>{c.corrigido_em} · {c.corrigido_por??'Administrador'} · {c.motivo}<div className="text-label-sm text-on-surface-variant">Versão anterior — bruto {formatarDinheiro(c.fechamento_anterior.recebimentos_brutos)}, saídas {formatarDinheiro(c.fechamento_anterior.saidas)}, líquido {formatarDinheiro(c.fechamento_anterior.total_liquido)}</div></li>)}</ul></div>}
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <h3 className="text-label-md">Recebimentos por meio</h3>
                    <dl className="mt-2 space-y-1">
                      {(['dinheiro','pix','credito','debito'] as const).map(
                        (forma) => (
                          <div key={forma} className="flex justify-between gap-3">
                            <dt>
                              {({
                                pix: 'Pix',
                                credito: 'Cartão de crédito',
                                debito: 'Cartão de débito',
                                dinheiro: 'Dinheiro',
                              } as Record<string, string>)[forma] ?? forma}
                            </dt>
                            <dd className="tabular-nums">{formatarDinheiro(resumoFechamento.por_forma_pagamento[forma]??'0.00')}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-label-md">Recebimentos por origem</h3>
                    <dl className="mt-2 space-y-1">
                      {Object.entries(resumoFechamento.por_origem).map(
                        ([origem, valor]) => (
                          <div key={origem} className="flex justify-between gap-3">
                            <dt>
                              {{ ordem_servico: 'Serviços', venda: 'Vendas', outro: 'Outras entradas' }[origem] ?? origem}
                            </dt>
                            <dd className="tabular-nums">{formatarDinheiro(valor)}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-label-md">Saídas por categoria</h3>
                    <dl className="mt-2 space-y-1">
                      {Object.entries(resumoFechamento.saidas_por_categoria).length ? (
                        Object.entries(resumoFechamento.saidas_por_categoria).map(
                          ([categoria, valor]) => (
                            <div key={categoria} className="flex justify-between gap-3">
                              <dt>{categoria === 'manual' ? 'Saída manual' : nomeCategoria(categoria)}</dt>
                              <dd className="tabular-nums">{formatarDinheiro(valor)}</dd>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-on-surface-variant">Nenhuma saída registrada.</p>
                      )}
                    </dl>
                  </div>
                </div>
                {fechamento.fechado && fechamento.modo === 'manual' && (
                  <div className="grid gap-5 border-t border-outline-variant pt-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-label-md">Pagamentos selecionados</h3>
                      {fechamento.pagamentos_selecionados.length ? (
                        <ul className="mt-2 space-y-1">
                          {fechamento.pagamentos_selecionados.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span>{item.descricao} · {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                              <span className="tabular-nums">{formatarDinheiro(item.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-on-surface-variant">Nenhum pagamento selecionado.</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-label-md">Valores avulsos</h3>
                      {fechamento.itens_manuais.length ? (
                        <ul className="mt-2 space-y-1">
                          {fechamento.itens_manuais.map((item, indice) => (
                            <li key={`${item.descricao}-${indice}`} className="flex justify-between gap-3">
                              <span>{item.descricao} · {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                              <span className="tabular-nums">{formatarDinheiro(item.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-on-surface-variant">Nenhum valor avulso incluído.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div>
              <h3 className="text-headline-sm">Histórico de fechamentos</h3>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <InputField id="historico-inicio" label="De" type="date" value={filtroHistorico.inicio} onChange={(e)=>setFiltroHistorico(v=>({...v,inicio:e.target.value}))}/>
                <InputField id="historico-fim" label="Até" type="date" value={filtroHistorico.fim} onChange={(e)=>setFiltroHistorico(v=>({...v,fim:e.target.value}))}/>
                <Button size="compact" variant="secondary" onClick={()=>void atualizarHistorico(1)}>Filtrar histórico</Button>
              </div>
              {historicoFechamentos.length ? (
                <ul className="mt-2 divide-y divide-outline-variant">
                  {historicoFechamentos.map((item) => (
                    <li key={item.data} className="flex flex-wrap justify-between gap-2 py-2">
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => void consultarDiaFechamento(item.data)}
                      >
                        {formatarData(item.data)} · {item.modo}
                      </button>
                      <span>
                        Bruto: {formatarDinheiro(item.recebimentos_brutos)} · Saídas: {formatarDinheiro(item.saidas)} · Líquido: {formatarDinheiro(item.total_liquido)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-on-surface-variant">Ainda não há fechamentos salvos.</p>
              )}
              <div className="mt-3 flex items-center gap-3"><Button variant="secondary" size="compact" disabled={paginaHistorico<=1} onClick={()=>void atualizarHistorico(paginaHistorico-1)}>Anterior</Button><span>Página {paginaHistorico} de {Math.max(totalPaginasHistorico,1)}</span><Button variant="secondary" size="compact" disabled={paginaHistorico>=totalPaginasHistorico} onClick={()=>void atualizarHistorico(paginaHistorico+1)}>Próxima</Button></div>
            </div>
          </div>
        )}
      </section>
      <section className="rounded-default border border-outline-variant bg-surface-container-lowest p-5 space-y-4">
        <div><h2 className="text-headline-md">Cadastrar despesa</h2><p className="text-label-sm text-on-surface-variant">Registre despesas e parcelas; os pagamentos serão contabilizados no caixa somente quando registrados.</p></div>
        <form onSubmit={(e)=>void salvarDespesa(e)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectField id="categoria-despesa" label="Categoria" value={despesaForm.categoria} onChange={(e)=>setDespesaForm(v=>({...v,categoria:e.target.value}))}>{categoriasDespesas.map(c=><option key={c.id} value={c.nome}>{nomeCategoria(c.nome)}</option>)}</SelectField>
          <InputField id="descricao-despesa" label="Descrição" required value={despesaForm.descricao} onChange={(e)=>setDespesaForm(v=>({...v,descricao:e.target.value}))}/>
          <InputField id="valor-despesa" label="Valor total (R$)" type="number" min="0.01" step="0.01" required value={despesaForm.valor} onChange={(e)=>setDespesaForm(v=>({...v,valor:e.target.value}))}/>
          <InputField id="vencimento-despesa" label="Vencimento inicial" type="date" required value={despesaForm.vencimento} onChange={(e)=>setDespesaForm(v=>({...v,vencimento:e.target.value}))}/>
          <InputField id="parcelas-despesa" label="Parcelas" type="number" min="1" max="120" required value={despesaForm.total_parcelas} onChange={(e)=>setDespesaForm(v=>({...v,total_parcelas:e.target.value}))}/>
          <Button type="submit" disabled={carregandoDespesa}>Cadastrar despesa</Button>
        </form>
        <div className="flex flex-wrap items-end gap-3"><InputField id="categoria-personalizada" label="Nova categoria" maxLength={80} value={categoriaNova} onChange={(e)=>setCategoriaNova(e.target.value)}/><Button type="button" variant="secondary" size="compact" disabled={!categoriaNova.trim()||carregandoDespesa} onClick={()=>void salvarCategoria()}>Criar categoria</Button></div>
        {erroDespesa&&<p role="alert" className="text-error">{erroDespesa}</p>}
      </section>
      <section
        aria-label="Filtros financeiros"
        className="rounded-default border border-outline-variant bg-surface-container-lowest p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="periodo-financeiro"
            label="Período"
            value={opcao}
            onChange={(event) => selecionarPeriodo(event.target.value)}
          >
            <option value="todo">Todo</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="personalizado">Personalizado</option>
          </SelectField>
          <SelectField
            id="tipo-movimento-financeiro"
            label="Tipo de movimento"
            value={tipoFiltro}
            onChange={(event) =>
              setTipoFiltro(event.target.value as typeof tipoFiltro)
            }
          >
            <option value="todos">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </SelectField>
          <SelectField
            id="origem-movimento-financeiro"
            label="Origem"
            value={origemFiltro}
            onChange={(event) =>
              setOrigemFiltro(event.target.value as typeof origemFiltro)
            }
          >
            <option value="todas">Todas</option>
            <option value="vendas">Vendas</option>
            <option value="os">Ordens de serviço</option>
            <option value="compras">Compras</option>
            <option value="despesas">Despesas</option>
            <option value="estornos">Estornos</option>
          </SelectField>
        </div>
        {opcao === 'personalizado' && (
          <form
            onSubmit={aplicarPeriodo}
            className="mt-5 flex flex-wrap items-end gap-4"
          >
            <InputField
              id="financeiro-inicio"
              label="Data inicial"
              type="date"
              required
              value={rascunho.inicio}
              onChange={(event) =>
                setRascunho({ ...rascunho, inicio: event.target.value })
              }
            />
            <InputField
              id="financeiro-fim"
              label="Data final"
              type="date"
              required
              value={rascunho.fim}
              onChange={(event) =>
                setRascunho({ ...rascunho, fim: event.target.value })
              }
            />
            <Button type="submit" size="compact">
              Aplicar período
            </Button>
          </form>
        )}
        <p
          className="mt-4 text-body-md text-on-surface-variant"
          aria-live="polite"
        >
          Exibindo {formatarData(periodo.inicio)} a {formatarData(periodo.fim)}
        </p>
        {erro && (
          <p role="alert" className="mt-3 text-error">
            {erro}
          </p>
        )}
        {erroExportacao && (
          <p role="alert" className="mt-3 text-error">
            {erroExportacao}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-4">
          <Button
            variant="secondary"
            size="compact"
            disabled={carregando || !dados || Boolean(erro) || exportandoExcel}
            onClick={() => void baixarExcel()}
          >
            {exportandoExcel ? 'Carregando Excel…' : 'Exportar Excel'}
          </Button>
          <Button
            variant="secondary"
            size="compact"
            disabled={carregando || !dados || Boolean(erro)}
            onClick={() => {
              if (dados)
                exportarFinanceiroCsv(dados, movimentos, contasOrdenadas, periodo)
            }}
          >
            Exportar CSV
          </Button>
          <p className="text-label-sm text-on-surface-variant">
            Excel está pronto para leitura e impressão: resumo em A4 retrato e detalhes em paisagem. CSV gera um arquivo por conjunto; movimentações seguem os filtros selecionados.
          </p>
        </div>
        {exportandoExcel && (
          <p className="mt-3 text-label-sm text-on-surface-variant" role="status" aria-live="polite">
            Preparando o arquivo e iniciando o download…
          </p>
        )}
      </section>
      {carregando && (
        <p
          role="status"
          className="rounded-default border border-outline-variant bg-surface p-5"
        >
          Consultando os dados financeiros…
        </p>
      )}
      {!carregando && dados && (
        <>
          <section
            aria-label="Resumo financeiro"
            className="grid gap-4 lg:grid-cols-3"
          >
            <CartaoInformacoes
              titulo="Faturamento bruto recebido"
              icone="financeiro"
            >
              <p className="break-words text-headline-lg tabular-nums text-primary">
                {formatarDinheiro(dados.resumo.faturamento_bruto)}
              </p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Entradas efetivamente recebidas no regime de caixa.
              </p>
            </CartaoInformacoes>
            <CartaoInformacoes titulo="Saídas de caixa" icone="observacoes">
              <p className="break-words text-headline-lg tabular-nums">
                {formatarDinheiro(dados.resumo.saidas_caixa)}
              </p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Compras, despesas e estornos pagos no período.
              </p>
            </CartaoInformacoes>
            <CartaoInformacoes titulo="Lucro bruto" icone="dashboard" destaque>
              <p className="break-words text-headline-lg tabular-nums text-primary">
                {formatarDinheiro(dados.resumo.lucro_bruto)}
              </p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Receitas recebidas menos custos de produtos vendidos e materiais
                usados.
              </p>
            </CartaoInformacoes>
          </section>
          <section
            aria-label="Indicadores financeiros"
            className="grid gap-4 md:grid-cols-3"
          >
            <CartaoInformacoes
              titulo="Custo de produtos e materiais"
              icone="estoque"
            >
              <p className="text-headline-lg tabular-nums">
                {formatarDinheiro(dados.resumo.custo_mercadorias_e_materiais)}
              </p>
            </CartaoInformacoes>
            <CartaoInformacoes titulo="Lucro operacional" icone="dashboard">
              <p className="text-headline-lg tabular-nums">
                {formatarDinheiro(dados.resumo.lucro_operacional)}
              </p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Após despesas operacionais pagas.
              </p>
            </CartaoInformacoes>
            <CartaoInformacoes
              titulo="Lucro líquido e impostos"
              icone="observacoes"
            >
              <p className="text-headline-lg tabular-nums">Não disponível</p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                A regra de impostos ainda será definida.
              </p>
            </CartaoInformacoes>
          </section>
          <section
            aria-labelledby="titulo-movimentos"
            className="overflow-hidden rounded-default border border-outline-variant bg-surface-container-lowest"
          >
            <div className="p-5 md:p-6">
              <h2 id="titulo-movimentos" className="text-headline-md">
                Movimentações financeiras
              </h2>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                {movimentos.length} registros pagos no período e nos filtros
                aplicados.
              </p>
            </div>
            {movimentos.length === 0 ? (
              <p className="px-6 pb-6 text-on-surface-variant">
                Nenhuma movimentação financeira encontrada.
              </p>
            ) : (
              <div
                className="table-scroll"
                role="region"
                aria-label="Movimentações financeiras"
                tabIndex={0}
              >
                <table className="w-full min-w-[720px] text-left text-body-md">
                  <caption className="sr-only">
                    Movimentações financeiras pagas
                  </caption>
                  <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                    <tr>
                      {[
                        'Data',
                        'Descrição',
                        'Categoria',
                        'Tipo',
                        'Valor',
                        'Detalhes',
                      ].map((titulo) => (
                        <th key={titulo} scope="col" className="px-5 py-4">
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimentos.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatarData(item.pago_em)}
                        </td>
                        <td className="px-5 py-4 font-medium">
                          {item.descricao}
                        </td>
                        <td className="px-5 py-4">
                          {nomeCategoria(item.categoria)}
                        </td>
                        <td className="px-5 py-4">
                          {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">
                          {formatarDinheiro(item.valor)}
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="secondary"
                            size="compact"
                            onClick={() => setDetalhe(item)}
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section
            aria-labelledby="titulo-contas"
            className="overflow-hidden rounded-default border border-outline-variant bg-surface-container-lowest"
          >
            <div className="p-5 md:p-6">
              <h2 id="titulo-contas" className="text-headline-md">
                Contas e parcelas
              </h2>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Acompanhamento de valores pendentes, pagos, vencidos e parciais.
                Pago indica quitação; Parcial indica pagamento incompleto;
                Pendente ainda não foi pago; Vencido passou da data de vencimento.
                Selecione um cabeçalho para ordenar.
              </p>
            </div>
            {dados.contas.length === 0 ? (
              <p className="px-6 pb-6 text-on-surface-variant">
                Nenhuma conta financeira encontrada no período.
              </p>
            ) : (
              <div
                className="table-scroll"
                role="region"
                aria-label="Contas financeiras"
                tabIndex={0}
              >
                <table className="w-full min-w-[680px] text-left text-body-md">
                  <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                    <tr>
                      {([
                        ['Descrição', 'descricao'],
                        ['Vencimento', 'vencimento'],
                        ['Parcela', 'numero'],
                        ['Valor', 'valor'],
                        ['Pago', 'valor_pago'],
                        ['Situação', 'status'],
                      ] as const).map(([titulo, coluna]) => (
                        <th
                          key={titulo}
                          scope="col"
                          aria-sort={
                            ordenacao?.coluna === coluna
                              ? ordenacao.direcao === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                          className="px-5 py-4"
                        >
                          <button
                            type="button"
                            className="cursor-pointer text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                            onClick={() => ordenarContas(coluna)}
                          >
                            {titulo}
                            {ordenacao?.coluna === coluna
                              ? ordenacao.direcao === 'asc'
                                ? ' ↑'
                                : ' ↓'
                              : ''}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contasOrdenadas.map((item) => (
                      <tr
                        key={item.parcela_id}
                        className="border-t border-outline-variant/40"
                      >
                        <td className="px-5 py-4 font-medium">
                          {item.descricao}
                        </td>
                        <td className="px-5 py-4">
                          {formatarData(item.vencimento)}
                        </td>
                        <td className="px-5 py-4">
                          {item.numero}/{item.total_parcelas}
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {formatarDinheiro(item.valor)}
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {formatarDinheiro(item.valor_pago)}
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="secondary"
                            size="compact"
                            onClick={() => setDetalhe(item)}
                          >
                            {item.parcelado ? 'Parcelado · ' : ''}
                            {statusLabel(item.status)}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {detalhe && (
        <Dialog
          titulo="Detalhes financeiros"
          onCancelar={() => setDetalhe(null)}
        >
          {'parcela_id' in detalhe && detalhe.origem_tipo==='ordem_servico'&&Number(detalhe.valor_pago)<Number(detalhe.valor)&&<p className="mb-5 rounded-default bg-secondary-container p-4">O recebimento desta OS será registrado ao mudar o status para Entregue.</p>}
          {'parcela_id' in detalhe && detalhe.origem_tipo!=='ordem_servico' && Number(detalhe.valor_pago)<Number(detalhe.valor) && <form onSubmit={(e)=>void pagarConta(e)} className="mb-5 space-y-3 rounded-default border border-outline-variant p-4">
            <h3 className="text-headline-sm">Registrar pagamento</h3>
            <p className="text-label-sm">Pendente: {formatarDinheiro((Number(detalhe.valor)-Number(detalhe.valor_pago)).toFixed(2))}</p>
            <InputField id="valor-pagamento-conta" label="Valor pago (R$)" type="number" min="0.01" max={(Number(detalhe.valor)-Number(detalhe.valor_pago)).toFixed(2)} step="0.01" required value={pagamentoConta.valor} onChange={(e)=>setPagamentoConta(v=>({...v,valor:e.target.value}))}/>
            <SelectField id="forma-pagamento-conta" label="Forma de pagamento" value={pagamentoConta.forma} onChange={(e)=>setPagamentoConta(v=>({...v,forma:e.target.value}))}><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="credito">Cartão de crédito</option><option value="debito">Cartão de débito</option></SelectField>
            <Button type="submit" disabled={carregandoDespesa}>Registrar pagamento</Button>
            {erroDespesa&&<p role="alert" className="text-error">{erroDespesa}</p>}
          </form>}
          <dl className="space-y-4">
            {('forma_pagamento' in detalhe
              ? [
                  ['Descrição', detalhe.descricao],
                  ['Categoria', nomeCategoria(detalhe.categoria)],
                  ['Data do pagamento', formatarData(detalhe.pago_em)],
                  ['Forma de pagamento', detalhe.forma_pagamento],
                  ['Valor', formatarDinheiro(detalhe.valor)],
                  [
                    'Motivo do estorno',
                    detalhe.motivo_estorno ?? 'Não informado',
                  ],
                ]
              : [
                  ['Descrição', detalhe.descricao],
                  ['Categoria', nomeCategoria(detalhe.categoria)],
                  ['Vencimento', formatarData(detalhe.vencimento)],
                  ['Situação', statusLabel(detalhe.status)],
                  ['Valor previsto', formatarDinheiro(detalhe.valor)],
                  ['Valor pago', formatarDinheiro(detalhe.valor_pago)],
                ]
            ).map(([titulo, valor]) => (
              <div key={titulo}>
                <dt className="text-label-sm text-on-surface-variant">
                  {titulo}
                </dt>
                <dd className="mt-1 font-medium">{valor}</dd>
              </div>
            ))}
          </dl>
          <Button className="mt-6" onClick={() => setDetalhe(null)}>
            Fechar
          </Button>
        </Dialog>
      )}
    </div>
  )
}
