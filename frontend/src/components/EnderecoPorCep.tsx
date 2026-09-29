import { useEffect, useState } from 'react'
import { formatarCep } from '../utils/clientes'
import Button from './Button'
import { consultarCep } from '../services/cep'
import type { EnderecoCep } from '../services/cep'

type Resultado = { cep: string; tentativa: number; endereco?: EnderecoCep; erro?: string }

export default function EnderecoPorCep({ cep, numero, perfil = false }: { cep: string; numero?: string | null; perfil?: boolean }) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    if (!/^\d{8}$/.test(cep)) return
    const controle = new AbortController()
    consultarCep(cep, controle.signal).then(endereco => {
      if (!controle.signal.aborted) setResultado({ cep, tentativa, endereco })
    }).catch((erro: unknown) => {
      if (!controle.signal.aborted) setResultado({ cep, tentativa, erro: erro instanceof Error && erro.name === 'Error' ? erro.message : 'Consulta indisponível. Tente novamente.' })
    })
    // Uma resposta de um CEP anterior nunca substitui o endereço atual.
    return () => controle.abort()
  }, [cep, tentativa])

  const dadosSalvos = perfil && <p className="text-label-sm text-on-surface-variant">CEP {formatarCep(cep)} · Número {numero || 'não informado'}</p>
  if (cep.length !== 8) return <p className="text-label-md text-on-surface-variant">Digite os 8 números do CEP para consultar o endereço.</p>
  if (resultado?.cep !== cep || resultado.tentativa !== tentativa) return <div className="space-y-3">{dadosSalvos}<p role="status">Consultando endereço…</p></div>
  if (resultado.erro) return <div className="space-y-3">{dadosSalvos}<p role="alert">{resultado.erro}</p><Button type="button" onClick={() => setTentativa(valor => valor + 1)}>Consultar novamente</Button></div>
  const endereco = resultado.endereco!
  const campos = perfil
    ? [['Rua', [endereco.logradouro || 'Rua não informada pelo ViaCEP', numero].filter(Boolean).join(', ')], ['Cidade / Estado', [endereco.localidade, endereco.uf].filter(Boolean).join(', ')], ['Bairro', endereco.bairro], ['CEP', formatarCep(cep)]]
    : [['Rua', endereco.logradouro], ['Bairro', endereco.bairro], ['Cidade', endereco.localidade], ['Estado', endereco.uf]]
  return <dl className={`grid gap-x-8 gap-y-5 sm:grid-cols-2 ${perfil ? '' : 'rounded-default bg-surface-container-low p-4'}`} aria-live="polite">
    {campos.map(([rotulo, valor]) => <div key={rotulo}><dt className="text-label-sm uppercase text-on-surface-variant">{rotulo}</dt><dd className="mt-1 break-words text-label-md font-normal">{valor || 'Não informado pelo ViaCEP'}</dd></div>)}
  </dl>
}
