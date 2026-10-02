import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import CartaoInformacoes from '../components/CartaoInformacoes'
import Dialog from '../components/Dialog'
import Icon from '../components/Icon'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import GraficoEvolucao from '../components/financeiro/GraficoEvolucao'
import DetalhesCategoriaFinanceira from '../components/financeiro/DetalhesCategoriaFinanceira'
import type { CategoriaFinanceira } from '../components/financeiro/DetalhesCategoriaFinanceira'
import { agruparEvolucao, dataReferencia, formatarData, formatarDinheiro, movimentosDemonstracao, periodoDemonstracao, resumirMovimentos } from '../data/financeiroDemonstracao'
import type { MovimentoDemonstracao } from '../data/financeiroDemonstracao'

export default function Financeiro() {
  const navigate = useNavigate()
  const [opcao, setOpcao] = useState('mes')
  const [periodo, setPeriodo] = useState(periodoDemonstracao('mes'))
  const [rascunho, setRascunho] = useState(periodo)
  const [erro, setErro] = useState('')
  const [todos, setTodos] = useState(false)
  const [detalhe, setDetalhe] = useState<MovimentoDemonstracao | null>(null)
  const [categoria, setCategoria] = useState<CategoriaFinanceira | null>(null)
  const movimentos = movimentosDemonstracao.filter(item => item.data >= periodo.inicio && item.data <= periodo.fim)
  const resumo = resumirMovimentos(movimentos)
  const recentes = [...movimentos].sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
  const grupos = agruparEvolucao(movimentos, periodo.inicio, periodo.fim)

  function selecionarPeriodo(valor: string) {
    setOpcao(valor)
    setErro('')
    setTodos(false)
    if (valor !== 'personalizado') {
      const novo = periodoDemonstracao(valor)
      setPeriodo(novo)
      setRascunho(novo)
    }
  }

  function aplicarPeriodo(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rascunho.inicio || !rascunho.fim || rascunho.inicio > rascunho.fim) {
      setErro('Informe as duas datas, com o início anterior ou igual ao fim.')
      return
    }
    const dias = (Date.parse(`${rascunho.fim}T00:00:00Z`) - Date.parse(`${rascunho.inicio}T00:00:00Z`)) / 86400000
    if (!Number.isFinite(dias) || dias > 365) {
      setErro('Para esta demonstração, escolha um intervalo de até 366 dias.')
      return
    }
    setErro('')
    setTodos(false)
    setPeriodo(rascunho)
  }

  return (
    <div className="mx-auto max-w-container-max space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-label-md text-primary">SEDA E COURO · GESTÃO INTERNA</p><h1 className="text-headline-lg-mobile md:text-headline-lg">Financeiro</h1><p className="mt-2 text-body-md text-on-surface-variant">Uma visão clara das entradas e saídas da sapataria.</p></div>
        <Button variant="secondary" size="compact" onClick={() => navigate('/dashboard')}>Voltar</Button>
      </header>

      <aside aria-label="Sobre a demonstração" className="rounded-default border border-outline-variant bg-secondary-container p-4 text-body-md">
        <strong>Dados fictícios, sem conexão com o financeiro real.</strong> A referência dos atalhos é {formatarData(dataReferencia)}. Valores ilustram a tela enquanto a integração financeira e os critérios de apuração são preparados.
      </aside>

      <section aria-label="Filtro de período" className="rounded-default border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:w-60"><SelectField id="periodo-financeiro" label="Período" value={opcao} onChange={event => selecionarPeriodo(event.target.value)}><option value="hoje">Hoje</option><option value="semana">Esta semana</option><option value="mes">Este mês</option><option value="personalizado">Personalizado</option></SelectField></div>
          <p className="text-body-md text-on-surface-variant" aria-live="polite">Exibindo {formatarData(periodo.inicio)} a {formatarData(periodo.fim)}</p>
        </div>
        {opcao === 'personalizado' && <form onSubmit={aplicarPeriodo} className="mt-5 flex flex-wrap items-end gap-4">
          <InputField id="financeiro-inicio" label="Data inicial" type="date" required value={rascunho.inicio} onChange={event => setRascunho({ ...rascunho, inicio: event.target.value })} />
          <InputField id="financeiro-fim" label="Data final" type="date" required value={rascunho.fim} onChange={event => setRascunho({ ...rascunho, fim: event.target.value })} />
          <Button type="submit" size="compact">Aplicar período</Button>
          {erro && <p role="alert" className="w-full text-error">{erro}</p>}
        </form>}
      </section>

      <section aria-label="Resumo demonstrativo do período" className="grid gap-4 lg:grid-cols-3">
        <CartaoInformacoes titulo="Recebimentos no período" icone="financeiro"><p className="break-words text-headline-lg tabular-nums text-primary">{formatarDinheiro(resumo.entradas)}</p><p className="mt-2 text-label-sm text-on-surface-variant">Entradas registradas na demonstração</p><Button className="mt-4" variant="secondary" size="compact" onClick={() => setCategoria('recebimentos')}>Detalhes de recebimentos</Button></CartaoInformacoes>
        <CartaoInformacoes titulo="Pagamentos no período" icone="observacoes"><p className="break-words text-headline-lg tabular-nums">{formatarDinheiro(resumo.saidas)}</p><p className="mt-2 text-label-sm text-on-surface-variant">Saídas registradas na demonstração</p><Button className="mt-4" variant="secondary" size="compact" onClick={() => setCategoria('pagamentos')}>Detalhes de pagamentos</Button></CartaoInformacoes>
        <CartaoInformacoes titulo="Resultado de caixa no período" icone="dashboard" destaque><p className={`break-words text-headline-lg tabular-nums ${resumo.resultado < 0 ? 'text-error' : 'text-primary'}`}>{formatarDinheiro(resumo.resultado)}</p><p className="mt-2 text-label-sm text-on-surface-variant">Entradas menos saídas; não representa lucro ou saldo disponível.</p><Button className="mt-4" variant="secondary" size="compact" onClick={() => setCategoria('caixa')}>Detalhes do resultado de caixa</Button></CartaoInformacoes>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CartaoInformacoes titulo="Evolução no período" icone="calendario">{movimentos.length ? <GraficoEvolucao grupos={grupos} /> : <p className="text-on-surface-variant">Não há movimentações demonstrativas neste período.</p>}</CartaoInformacoes>
        <CartaoInformacoes titulo="Indicadores previstos" icone="dashboard"><ul className="space-y-5">{[
          { titulo: 'Faturamento', descricao: 'Critério de reconhecimento e datas a definir.', categoria: 'faturamento' },
          { titulo: 'Materiais', descricao: 'Método de apuração dos custos a definir.', categoria: 'materiais' },
          { titulo: 'Lucro e prejuízo', descricao: 'Receitas e custos incluídos no cálculo a definir.', categoria: 'lucro' },
          { titulo: 'Impostos', descricao: 'Regra e parâmetros de cálculo a definir.', categoria: 'impostos' },
        ].map(item => <li key={item.titulo}><p className="font-semibold">{item.titulo}</p><p className="mt-1 text-label-sm text-on-surface-variant">{item.descricao}</p><Button className="mt-2" variant="secondary" size="compact" onClick={() => setCategoria(item.categoria as CategoriaFinanceira)}>Detalhes de {item.titulo.toLowerCase()}</Button></li>)}</ul></CartaoInformacoes>
      </div>

      <section aria-labelledby="titulo-movimentos" className="overflow-hidden rounded-default border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6"><div><h2 id="titulo-movimentos" className="text-headline-md">Movimentações recentes</h2><p className="mt-1 text-label-sm text-on-surface-variant">{movimentos.length} registros demonstrativos no período</p></div>{movimentos.length > 5 && <Button variant="secondary" size="compact" onClick={() => setTodos(valor => !valor)}>{todos ? 'Mostrar recentes' : 'Ver todas'}</Button>}</div>
        {movimentos.length === 0 ? <p className="px-6 pb-6 text-on-surface-variant">Nenhuma movimentação demonstrativa encontrada. Selecione um período de setembro de 2026 para explorar os exemplos.</p> : <div className="overflow-x-auto" role="region" aria-label="Movimentações demonstrativas" tabIndex={0}>
          <table className="w-full text-left text-body-md"><caption className="sr-only">Entradas e saídas fictícias, ordenadas das mais recentes para as mais antigas</caption>
            <thead className="bg-surface-container-low text-label-md text-on-surface-variant"><tr>{['Data', 'Descrição', 'Origem', 'Tipo', 'Valor', 'Detalhes'].map(titulo => <th key={titulo} scope="col" className="px-5 py-4">{titulo}</th>)}</tr></thead>
            <tbody>{(todos ? recentes : recentes.slice(0, 5)).map(item => <tr key={item.id} className="border-t border-outline-variant/40"><td className="whitespace-nowrap px-5 py-4">{formatarData(item.data)}</td><td className="min-w-52 px-5 py-4 font-medium">{item.descricao}</td><td className="whitespace-nowrap px-5 py-4">{item.origem}</td><td className="px-5 py-4"><span className={`rounded-default px-3 py-1 text-label-sm ${item.tipo === 'entrada' ? 'bg-success-container text-on-success-container' : 'bg-secondary-container text-on-surface'}`}>{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td><td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">{formatarDinheiro(item.valorCentavos)}</td><td className="px-5 py-4"><Button variant="secondary" size="icon" aria-label={`Ver detalhes de ${item.descricao}`} onClick={() => setDetalhe(item)}><Icon name="busca" /></Button></td></tr>)}</tbody>
          </table>
        </div>}
      </section>
      {categoria && <DetalhesCategoriaFinanceira categoria={categoria} movimentos={movimentos} periodo={periodo} onFechar={() => setCategoria(null)} />}
      {detalhe && <Dialog titulo="Movimentação demonstrativa" onCancelar={() => setDetalhe(null)}><p className="mb-5 text-body-md text-on-surface-variant">Exemplo fictício. Nenhum registro real é consultado ou alterado.</p><dl className="space-y-4">{[['Descrição', detalhe.descricao], ['Referência de origem', detalhe.referencia], ['Data', formatarData(detalhe.data)], ['Tipo', detalhe.tipo === 'entrada' ? 'Entrada' : 'Saída'], ['Valor', formatarDinheiro(detalhe.valorCentavos)]].map(([titulo, valor]) => <div key={titulo}><dt className="text-label-sm text-on-surface-variant">{titulo}</dt><dd className="mt-1 font-medium">{valor}</dd></div>)}</dl><Button className="mt-6" onClick={() => setDetalhe(null)}>Fechar</Button></Dialog>}
    </div>
  )
}
