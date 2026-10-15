import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Dialog from './Dialog'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { importarItensEstoque } from '../services/estoque'
import type { ItemEstoque, LinhaImportacaoEstoque } from '../services/estoque'
import { analisarCsvEstoque } from '../utils/csvEstoque'

export default function ImportacaoEstoque({ produtos, materiais, onFechar, onConcluida }: {
  produtos: ItemEstoque[]; materiais: ItemEstoque[]; onFechar: () => void; onConcluida: () => void
}) {
  const navigate = useNavigate()
  const [linhas, setLinhas] = useState<Array<{ numero: number; dados?: LinhaImportacaoEstoque; erro?: string }>>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')
  async function selecionar(arquivo?: File) {
    setErro(''); setLinhas([]); setNomeArquivo(arquivo?.name ?? '')
    if (!arquivo) return
    if (arquivo.size > 1024 * 1024) { setErro('O arquivo deve ter no máximo 1 MB.'); return }
    try { setLinhas(analisarCsvEstoque(await arquivo.text(), produtos, materiais)) }
    catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível ler o CSV.') }
  }
  async function importar() {
    const validas = linhas.flatMap(linha => linha.dados ? [linha.dados] : [])
    if (!validas.length || linhas.some(linha => linha.erro)) return
    setOcupado(true); setErro('')
    try { await importarItensEstoque(validas); onConcluida() }
    catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      if (error instanceof ResultadoIncerto) setIncerto(true)
      setErro(error instanceof ErroApi && error.codigo === 'IMPORTACAO_DUPLICADA'
        ? error.message : error instanceof Error ? error.message : 'Não foi possível importar o arquivo.')
    } finally { setOcupado(false) }
  }
  return <Dialog titulo="Importar estoque por CSV" largura="ampla" ocupado={ocupado} onCancelar={onFechar}>
    <div className="space-y-4">
      <p className="text-body-sm text-on-surface-variant">Baixe o modelo, preencha quantidades e valores usando ponto decimal e envie o CSV. A prévia valida todas as linhas; a gravação inteira é confirmada ou cancelada em conjunto. Saldo inicial maior que zero gera uma entrada no histórico.</p>
      <a className="inline-flex min-h-11 items-center text-primary underline" href="/modelos/estoque-importacao.csv" download>Baixar modelo CSV</a>
      <label className="block text-label-md" htmlFor="arquivo-estoque">Arquivo CSV</label>
      <input id="arquivo-estoque" type="file" accept=".csv,text/csv" disabled={ocupado} onChange={event => void selecionar(event.target.files?.[0])} className="block w-full rounded-default border border-outline-variant p-3" />
      {nomeArquivo && <p className="text-body-sm">{nomeArquivo}: {linhas.length} linha(s)</p>}
      {erro && <p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}{incerto && ' Atualize o estoque antes de tentar novamente.'}</p>}
      {!!linhas.length && <div className="max-h-80 overflow-auto rounded-default border border-outline-variant">
        <table className="w-full text-left text-body-sm"><caption className="sr-only">Prévia da importação</caption>
          <thead><tr>{['Linha', 'Item', 'Tipo', 'Saldo inicial', 'Validação'].map(c => <th key={c} className="whitespace-nowrap p-3 text-label-sm">{c}</th>)}</tr></thead>
          <tbody>{linhas.map(linha => <tr key={linha.numero} className="border-t border-outline-variant/50">
            <td className="p-3">{linha.numero}</td><td className="p-3">{linha.dados?.nome ?? '—'}</td><td className="p-3">{linha.dados?.tipo ?? '—'}</td><td className="p-3">{linha.dados?.quantidade ?? '—'}</td>
            <td className={`min-w-52 p-3 ${linha.erro ? 'text-error' : 'text-primary'}`}>{linha.erro ?? 'Pronta para importar'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {incerto && <p role="alert" className="text-body-sm">O resultado da requisição é incerto; consulte o estoque atualizado antes de reenviar o arquivo.</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={ocupado || incerto || !linhas.length || linhas.some(linha => linha.erro)} onClick={() => void importar()}>{ocupado ? 'Importando…' : `Importar ${linhas.length} item(ns)`}</Button>
        <Button variant="secondary" disabled={ocupado} onClick={onFechar}>Fechar</Button>
      </div>
    </div>
  </Dialog>
}
