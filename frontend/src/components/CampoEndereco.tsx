import { useEffect, useRef, useState } from 'react'
import InputField from './InputField'
import Button from './Button'
import { buscarCepPorEndereco, consultarCep } from '../services/cep'
import type { EnderecoCep } from '../services/cep'
import { listarMunicipios } from '../services/municipios'
import { digitos, formatarCep } from '../utils/clientes'

export type EnderecoFormulario = {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

const estados = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
  ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'],
  ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
] as const

export default function CampoEndereco({
  prefixo,
  cep,
  endereco,
  enderecoObrigatorio = true,
  localidadeObrigatoria = false,
  desabilitado = false,
  aoMudarCep,
  aoMudarEndereco,
}: {
  prefixo: string
  cep: string
  endereco: EnderecoFormulario
  enderecoObrigatorio?: boolean
  localidadeObrigatoria?: boolean
  desabilitado?: boolean
  aoMudarCep: (valor: string) => void
  aoMudarEndereco: (valor: EnderecoFormulario) => void
}) {
  const [aberto, setAberto] = useState(
    Boolean(cep || endereco.logradouro || endereco.bairro || endereco.cidade || endereco.uf),
  )
  const [listaCidades, setListaCidades] = useState<{ uf: string; valores: string[] } | null>(null)
  const [erroLista, setErroLista] = useState('')
  const [busca, setBusca] = useState<{
    chave: string
    sugestoes: Array<EnderecoCep & { cep: string }>
    erro: string
    carregando: boolean
  } | null>(null)
  const [statusCep, setStatusCep] = useState<{ cep: string; texto: string } | null>(null)
  const atualizarEnderecoRef = useRef(aoMudarEndereco)
  const cepAnteriorRef = useRef(cep && !endereco.logradouro ? '' : cep)
  const enderecoConfirmadoRef = useRef<string | null>(null)

  useEffect(() => {
    atualizarEnderecoRef.current = aoMudarEndereco
  }, [aoMudarEndereco])

  useEffect(() => {
    if (cepAnteriorRef.current === cep) return
    cepAnteriorRef.current = cep
    if (cep.length !== 8) return
    const controle = new AbortController()
    consultarCep(cep, controle.signal)
      .then((dados) => {
        if (controle.signal.aborted) return
        atualizarEnderecoRef.current({
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.localidade,
          uf: dados.uf,
        })
        setStatusCep({ cep, texto: 'Endereço preenchido pelo ViaCEP. Confira os dados.' })
      })
      .catch(() => {
        if (!controle.signal.aborted)
          setStatusCep({ cep, texto: 'CEP não localizado. Você pode preencher o endereço manualmente.' })
      })
    return () => controle.abort()
  }, [cep])

  useEffect(() => {
    if (!endereco.uf) return
    const controle = new AbortController()
    listarMunicipios(endereco.uf, controle.signal)
      .then((valores) => {
        setListaCidades({ uf: endereco.uf, valores })
        setErroLista('')
      })
      .catch(() => {
        if (!controle.signal.aborted)
          setErroLista('Não foi possível carregar as cidades deste estado.')
      })
    return () => controle.abort()
  }, [endereco.uf])

  useEffect(() => {
    if (!aberto || !endereco.uf || !endereco.cidade || endereco.logradouro.trim().length < 3) return
    const controle = new AbortController()
    const chave = `${endereco.uf}|${endereco.cidade}|${endereco.logradouro}`
    if (enderecoConfirmadoRef.current === chave) return
    const atraso = window.setTimeout(() => {
      setBusca({ chave, sugestoes: [], erro: '', carregando: true })
      buscarCepPorEndereco(
        endereco.uf,
        endereco.cidade,
        endereco.logradouro,
        controle.signal,
      )
        .then((dados) => {
          setBusca({ chave, sugestoes: dados, erro: '', carregando: false })
        })
        .catch(() => {
          if (!controle.signal.aborted) {
            setBusca({ chave, sugestoes: [], erro: 'A busca não respondeu. Você pode preencher o endereço manualmente.', carregando: false })
          }
        })
    }, 500)
    return () => {
      window.clearTimeout(atraso)
      controle.abort()
    }
  }, [aberto, endereco.uf, endereco.cidade, endereco.logradouro])

  function atualizar(campo: keyof EnderecoFormulario, valor: string) {
    aoMudarEndereco({ ...endereco, [campo]: valor })
  }

  function confirmar(sugestao: EnderecoCep & { cep: string }) {
    enderecoConfirmadoRef.current = `${sugestao.uf}|${sugestao.localidade}|${sugestao.logradouro}`
    aoMudarEndereco({
      logradouro: sugestao.logradouro,
      bairro: sugestao.bairro,
      cidade: sugestao.localidade,
      uf: sugestao.uf,
    })
    aoMudarCep(sugestao.cep)
    setBusca(null)
  }

  const chaveBusca = `${endereco.uf}|${endereco.cidade}|${endereco.logradouro}`
  const resultadoBusca = busca?.chave === chaveBusca ? busca : null

  return (
    <div className="space-y-4">
      <InputField
        id={`${prefixo}-cep`}
        label="CEP (opcional)"
        autoComplete="postal-code"
        inputMode="numeric"
        value={formatarCep(cep)}
        onChange={(event) => aoMudarCep(digitos(event.target.value, 8))}
        maxLength={9}
        disabled={desabilitado}
      />
      {statusCep?.cep === cep && <p role="status" className="text-label-sm text-on-surface-variant">{statusCep.texto}</p>}
      <button
        type="button"
        className="text-label-md text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-2"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
        disabled={desabilitado}
      >
        {aberto ? 'Fechar busca de endereço' : 'Não sabe o CEP?'}
      </button>
      {aberto && (
        <div className="space-y-4 rounded-default border border-outline-variant p-4">
          {erroLista && (
            <p role="status" className="text-label-sm text-on-surface-variant">
              {erroLista} Se a lista de cidades estiver indisponível, informe a cidade manualmente.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-label-sm">
              Estado (opcional)
              <select
                className="min-h-11 rounded-default border border-outline bg-surface px-3 text-label-md"
                value={endereco.uf}
                onChange={(event) => {
                  aoMudarEndereco({ ...endereco, uf: event.target.value, cidade: '' })
                  setBusca(null)
                }}
                required={localidadeObrigatoria}
                disabled={desabilitado}
              >
                <option value="">Selecione o estado</option>
                {estados.map(([sigla, nome]) => (
                  <option key={sigla} value={sigla}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            {(listaCidades?.uf === endereco.uf ? listaCidades.valores : []).length ? (
              <label className="grid gap-2 text-label-sm">
                Cidade (opcional)
                <select
                  className="min-h-11 rounded-default border border-outline bg-surface px-3 text-label-md"
                  value={endereco.cidade}
                  onChange={(event) => atualizar('cidade', event.target.value)}
                  required={localidadeObrigatoria}
                  disabled={desabilitado || !endereco.uf}
                >
                  <option value="">Selecione a cidade</option>
                  {endereco.cidade && !(listaCidades?.valores ?? []).includes(endereco.cidade) && (
                    <option value={endereco.cidade}>{endereco.cidade}</option>
                  )}
                {(listaCidades?.valores ?? []).map((cidade) => (
                    <option key={cidade} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <InputField
                id={`${prefixo}-cidade`}
                label="Cidade (opcional)"
                autoComplete="address-level2"
                value={endereco.cidade}
                onChange={(event) => atualizar('cidade', event.target.value)}
                required={localidadeObrigatoria}
                disabled={desabilitado || !endereco.uf}
              />
            )}
            <InputField
              id={`${prefixo}-logradouro`}
              label="Rua"
              autoComplete="address-line1"
              value={endereco.logradouro}
              onChange={(event) => atualizar('logradouro', event.target.value)}
              required={enderecoObrigatorio}
              disabled={desabilitado}
            />
            <InputField
              id={`${prefixo}-bairro`}
              label="Bairro"
              autoComplete="address-level3"
              value={endereco.bairro}
              onChange={(event) => atualizar('bairro', event.target.value)}
              required={enderecoObrigatorio}
              disabled={desabilitado}
            />
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Se souber a cidade e o estado, selecione-os para receber sugestões de CEP. Você pode deixar as listas em branco e informar rua e bairro manualmente.
          </p>
          {endereco.logradouro.trim().length >= 3 && (
            <div className="space-y-3" aria-live="polite">
              {resultadoBusca?.carregando && <p role="status">Buscando endereços no ViaCEP…</p>}
              {resultadoBusca && resultadoBusca.sugestoes.length === 0 && !resultadoBusca.carregando && !resultadoBusca.erro && (
                <p role="status">Nenhum resultado encontrado. Você pode salvar o endereço preenchido manualmente.</p>
              )}
              {resultadoBusca?.erro && <p role="status">{resultadoBusca.erro}</p>}
              {(resultadoBusca?.sugestoes ?? []).map((sugestao) => (
                <div
                  key={`${sugestao.cep}-${sugestao.logradouro}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-default bg-surface-container p-3"
                >
                  <p className="text-label-sm">
                    {sugestao.logradouro} · {sugestao.bairro || 'Bairro não informado'} · CEP {formatarCep(sugestao.cep)}
                  </p>
                  <Button
                    type="button"
                    size="compact"
                    variant="secondary"
                    onClick={() => confirmar(sugestao)}
                    disabled={desabilitado}
                  >
                    Confirmar endereço
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
