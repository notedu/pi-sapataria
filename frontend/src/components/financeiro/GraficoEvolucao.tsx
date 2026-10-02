import { formatarData, formatarDinheiro } from '../../data/financeiroDemonstracao'
import type { agruparEvolucao } from '../../data/financeiroDemonstracao'

export default function GraficoEvolucao({ grupos }: { grupos: ReturnType<typeof agruparEvolucao> }) {
  const maximo = Math.max(1, ...grupos.flatMap(grupo => [grupo.entradas, grupo.saidas]))
  return (
    <figure>
      <figcaption className="mb-5 flex flex-wrap gap-4 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary" />Entradas</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-outline bg-secondary-container" />Saídas</span>
        <span>Valores demonstrativos em reais</span>
      </figcaption>
      <div className="overflow-x-auto" role="region" aria-label="Evolução de entradas e saídas" tabIndex={0}>
        <div className="flex min-w-72 gap-3 border-b border-outline-variant pb-3" aria-hidden="true">
          {grupos.map(grupo => <div key={grupo.de} className="min-w-0 flex-1">
            <div className="flex h-44 items-end justify-center gap-1 border-b border-outline-variant/40">
              <div title={`Entradas: ${formatarDinheiro(grupo.entradas)}`} className="w-5 rounded-t-sm bg-primary" style={{ height: `${grupo.entradas / maximo * 100}%` }} />
              <div title={`Saídas: ${formatarDinheiro(grupo.saidas)}`} className="w-5 rounded-t-sm border border-outline bg-secondary-container" style={{ height: `${grupo.saidas / maximo * 100}%` }} />
            </div>
            <p className="mt-3 text-center text-label-sm text-on-surface-variant">{formatarData(grupo.de).slice(0, 5)}{grupo.ate !== grupo.de && <><br />a {formatarData(grupo.ate).slice(0, 5)}</>}</p>
          </div>)}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-label-md text-primary">Ver valores do gráfico</summary>
          <table className="mt-3 w-full text-left text-label-sm">
            <caption className="sr-only">Valores por intervalo, correspondentes às barras</caption>
            <thead><tr><th scope="col" className="py-2">Intervalo</th><th scope="col">Entradas</th><th scope="col">Saídas</th></tr></thead>
            <tbody>{grupos.map(grupo => <tr key={grupo.de} className="border-t border-outline-variant/40"><th scope="row" className="py-2 font-normal">{formatarData(grupo.de)} a {formatarData(grupo.ate)}</th><td>{formatarDinheiro(grupo.entradas)}</td><td>{formatarDinheiro(grupo.saidas)}</td></tr>)}</tbody>
          </table>
        </details>
      </div>
    </figure>
  )
}
