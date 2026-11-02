import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import TextareaField from '../components/TextareaField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { buscarCliente } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import {
  buscarOrdem,
  listarMateriaisDisponiveis,
  listarUsosOrdem,
  mudarStatusOrdem,
  registrarDevolucaoMaterial,
  registrarUsoMaterial,
  removerMaterialPlanejado,
} from '../services/ordensServico'
import type {
  MaterialDisponivel,
  OrdemDetalhada,
  UsoMaterial,
} from '../services/ordensServico'
import { formatarTelefone } from '../utils/clientes'
import {
  data,
  dinheiro,
  proximoStatus,
  statusAnterior,
} from '../utils/ordensServico'

export default function DetalhesOrdemServico() {
  const { id = '' } = useParams()
  return <Conteudo key={id} id={id} />
}

function Conteudo({ id }: { id: string }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [ordem, setOrdem] = useState<OrdemDetalhada | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [usos, setUsos] = useState<UsoMaterial[]>([])
  const [materiais, setMateriais] = useState<MaterialDisponivel[]>([])
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [erroPdf, setErroPdf] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [materialId, setMaterialId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [cancelamentoAberto, setCancelamentoAberto] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [usoParaDevolver, setUsoParaDevolver] = useState<number | null>(null)
  const [quantidadeDevolucao, setQuantidadeDevolucao] = useState('')
  const [motivoDevolucao, setMotivoDevolucao] = useState('')
  const emCurso = useRef(false)
  useEffect(() => {
    let ativo = true
    buscarOrdem(id)
      .then(async (os) => {
        const [pessoa, lista, catalogo] = await Promise.all([
          buscarCliente(String(os.cliente_id)),
          listarUsosOrdem(os.id),
          listarMateriaisDisponiveis(),
        ])
        if (ativo) {
          setOrdem(os)
          setCliente(pessoa)
          setUsos(lista)
          setMateriais(catalogo)
        }
      })
      .catch((error: unknown) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErro(
            error instanceof ErroApi && error.status === 404
              ? 'Ordem de serviço não encontrada.'
              : error instanceof Error
                ? error.message
                : 'Não foi possível carregar a ordem.',
          )
      })
    return () => {
      ativo = false
    }
  }, [id, navigate, tentativa])

  async function mudarStatus(status: string, motivo?: string) {
    if (!ordem || emCurso.current || incerto) return
    emCurso.current = true
    setOcupado(true)
    setErroAcao('')
    try {
      const atualizada = await mudarStatusOrdem(ordem.id, status, motivo)
      setOrdem({ ...ordem, ...atualizada })
      setCancelamentoAberto(false)
      setMotivoCancelamento('')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else {
        setErroAcao(
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a OS.',
        )
        if (error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally {
      emCurso.current = false
      setOcupado(false)
    }
  }

  async function removerPlanejado(planejadoId: number) {
    if (!ordem || emCurso.current || incerto) return
    emCurso.current = true
    setOcupado(true)
    setErroAcao('')
    let removido = false
    try {
      await removerMaterialPlanejado(ordem.id, planejadoId)
      removido = true
      setOrdem(await buscarOrdem(id))
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else {
        setErroAcao(
          removido
            ? 'O material foi removido do planejamento, mas não foi possível atualizar a tela. Consulte a OS antes de repetir.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível remover o material planejado.',
        )
        if (removido || error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally {
      emCurso.current = false
      setOcupado(false)
    }
  }

  async function devolver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || usoParaDevolver === null || emCurso.current || incerto) return
    if (
      !/^\d+(?:[.,]\d+)?$/.test(quantidadeDevolucao.trim()) ||
      Number(quantidadeDevolucao.replace(',', '.')) <= 0 ||
      !motivoDevolucao.trim()
    ) {
      setErroAcao('Informe uma quantidade positiva e o motivo da devolução.')
      return
    }
    emCurso.current = true
    setOcupado(true)
    setErroAcao('')
    let registrado = false
    try {
      await registrarDevolucaoMaterial(
        ordem.id,
        usoParaDevolver,
        quantidadeDevolucao.trim().replace(',', '.'),
        motivoDevolucao.trim(),
      )
      registrado = true
      const [lista, catalogo] = await Promise.all([
        listarUsosOrdem(ordem.id),
        listarMateriaisDisponiveis(),
      ])
      setUsos(lista)
      setMateriais(catalogo)
      setUsoParaDevolver(null)
      setQuantidadeDevolucao('')
      setMotivoDevolucao('')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else {
        setErroAcao(
          registrado
            ? 'A devolução foi registrada, mas não foi possível atualizar a tela. Consulte a OS antes de repetir.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível registrar a devolução.',
        )
        if (registrado || error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally {
      emCurso.current = false
      setOcupado(false)
    }
  }

  async function imprimir() {
    if (!ordem || !cliente || imprimindo) return
    setImprimindo(true)
    setErroPdf('')
    try {
      const { gerarPdfOrdemServico } = await import('../utils/pdfOrdemServico')
      gerarPdfOrdemServico(ordem, cliente, usos, materiais)
    } catch {
      setErroPdf('Não foi possível gerar o PDF da OS. Tente novamente.')
    } finally {
      setImprimindo(false)
    }
  }

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ordem || emCurso.current || incerto) return
    if (
      !materialId ||
      !/^\d+(?:[.,]\d+)?$/.test(quantidade.trim()) ||
      Number(quantidade.replace(',', '.')) <= 0
    ) {
      setErroAcao('Selecione um material e informe uma quantidade positiva.')
      return
    }
    emCurso.current = true
    setOcupado(true)
    setErroAcao('')
    let registrado = false
    try {
      await registrarUsoMaterial(
        ordem.id,
        Number(materialId),
        quantidade.trim().replace(',', '.'),
      )
      registrado = true
      const [lista, catalogo] = await Promise.all([
        listarUsosOrdem(ordem.id),
        listarMateriaisDisponiveis(),
      ])
      setUsos(lista)
      setMateriais(catalogo)
      setMaterialId('')
      setQuantidade('')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else {
        setErroAcao(
          registrado
            ? 'O uso foi registrado, mas não foi possível atualizar a tela. Consulte a OS antes de repetir.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível registrar o uso.',
        )
        if (registrado || error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally {
      emCurso.current = false
      setOcupado(false)
    }
  }

  const proximo = ordem ? proximoStatus(ordem.status) : null
  const nomes = new Map(materiais.map((material) => [material.id, material]))
  return (
    <div className="mx-auto max-w-container-max space-y-7">
      <Link
        to="/ordens-servico"
        className="text-label-md text-primary hover:underline"
      >
        ← Voltar para Ordens de Serviço
      </Link>
      {erro ? (
        <div className="space-y-3">
          <p
            role="alert"
            className="rounded-default bg-error-container p-4 text-on-error-container"
          >
            {erro}
          </p>
          <Button
            onClick={() => {
              setErro('')
              setTentativa((v) => v + 1)
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !ordem || !cliente ? (
        <p role="status">Carregando ordem de serviço…</p>
      ) : (
        <>
          {state?.ordemCadastrada && (
            <Alerta
              mensagem="Ordem de serviço cadastrada com sucesso."
              onFechar={() =>
                navigate(`/ordens-servico/${id}`, { replace: true, state: {} })
              }
            />
          )}
          {state?.ordemEditada && (
            <Alerta
              mensagem="Ordem de serviço atualizada com sucesso."
              onFechar={() =>
                navigate(`/ordens-servico/${id}`, { replace: true, state: {} })
              }
            />
          )}
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-headline-lg-mobile md:text-headline-lg">
                  Ordem #{ordem.id}
                </h1>
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-on-primary-fixed">
                  {ordem.status}
                </span>
              </div>
              <p className="mt-2 text-on-surface-variant">
                Entrada em {data(ordem.data_entrada)}
              </p>
              <p className="mt-2 text-on-surface-variant">
                Responsável atual: {ordem.responsavel_nome}
                {!ordem.responsavel_ativo && ' (inativo)'}
              </p>
              <p className="mt-1 text-on-surface-variant">
                Criada por: {ordem.criado_por_nome ?? 'Não registrado'}
              </p>
            </div>
            <div className="mobile-action-group">
              <Button
                variant="secondary"
                size="compact"
                disabled={imprimindo}
                onClick={imprimir}
              >
                {imprimindo ? 'Gerando PDF…' : 'Imprimir'}
              </Button>
              {['Aberta', 'Em andamento'].includes(ordem.status) && (
                <Link
                  to={`/ordens-servico/${ordem.id}/editar`}
                  className="inline-flex min-h-11 items-center justify-center rounded-default bg-primary px-4 py-3 text-label-md text-on-primary hover:bg-primary-container"
                >
                  Editar OS
                </Link>
              )}
            </div>
          </header>
          {erroPdf && (
            <p
              role="alert"
              className="rounded-default bg-error-container p-4 text-on-error-container"
            >
              {erroPdf}
            </p>
          )}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="space-y-6">
              <section className="rounded-xl bg-surface-container-low p-6">
                <h2 className="mb-6 text-label-md uppercase text-on-surface-variant">
                  Informações do cliente
                </h2>
                <Link
                  to={`/clientes/${cliente.id}`}
                  className="text-headline-md text-primary hover:underline"
                >
                  {cliente.nome}
                </Link>
                <p className="mt-2 text-on-surface-variant">
                  {/^\d{11}$/.test(cliente.telefone)
                    ? formatarTelefone(cliente.telefone)
                    : cliente.telefone}
                </p>
              </section>
              <section className="rounded-xl bg-surface-container-low p-6">
                <h2 className="mb-6 text-label-md uppercase text-on-surface-variant">
                  Detalhes do serviço
                </h2>
                <div className="mb-6 space-y-3">
                  {ordem.itens.map((item, indice) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-default border border-outline-variant bg-surface-container-lowest p-4 sm:grid-cols-2"
                    >
                      <div>
                        <p className="text-label-sm text-on-surface-variant">
                          Item {indice + 1}
                        </p>
                        <p className="mt-1 break-words">{item.descricao_item}</p>
                      </div>
                      <div>
                        <p className="text-label-sm text-on-surface-variant">
                          Serviço
                        </p>
                        <p className="mt-1 break-words">{item.servico}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <dl className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-label-md text-on-surface-variant">
                      Data de entrada
                    </dt>
                    <dd className="mt-2">{data(ordem.data_entrada)}</dd>
                  </div>
                  <div>
                    <dt className="text-label-md text-on-surface-variant">
                      Previsão de entrega
                    </dt>
                    <dd className="mt-2">
                      {ordem.prazo_entrega
                        ? data(ordem.prazo_entrega)
                        : 'Não informada'}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl bg-surface-container-low p-6">
                <h2 className="mb-5 text-label-md uppercase text-on-surface-variant">
                  Notas técnicas e materiais
                </h2>
                <p className="mb-5 whitespace-pre-wrap">
                  {ordem.observacoes || 'Nenhuma observação registrada.'}
                </p>
                <h3 className="mb-2 text-label-md">Materiais previstos</h3>
                {ordem.materiais_planejados.length === 0 ? (
                  <p className="mb-5 text-on-surface-variant">
                    Nenhum material planejado nesta OS.
                  </p>
                ) : (
                  <ul className="mb-5 space-y-2">
                    {ordem.materiais_planejados.map((material) => (
                      <li
                        key={material.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-default border border-outline-variant bg-surface-container-lowest px-4 py-3"
                      >
                        <span>
                          {nomes.get(material.material_id)?.nome ??
                            `Material #${material.material_id}`}{' '}
                          · {material.quantidade}{' '}
                          {nomes.get(material.material_id)?.unidade ?? ''}
                        </span>
                        {['Aberta', 'Em andamento'].includes(ordem.status) && (
                          <Button
                            variant="secondary"
                            size="compact"
                            disabled={ocupado || incerto}
                            onClick={() => void removerPlanejado(material.id)}
                          >
                            Remover planejamento
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="mb-2 text-label-md">Materiais utilizados</h3>
                {usos.length === 0 ? (
                  <p className="text-on-surface-variant">
                    Nenhum uso registrado.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {usos.map((uso) => (
                      <li
                        key={uso.id}
                        className="space-y-3 rounded-default border border-outline-variant bg-surface-container-lowest px-4 py-3"
                      >
                        <p>
                          {nomes.get(uso.material_id)?.nome ??
                            `Material #${uso.material_id}`}{' '}
                          · usado {uso.quantidade_usada}{' '}
                          {nomes.get(uso.material_id)?.unidade ?? ''}
                          {Number(uso.quantidade_devolvida) > 0 &&
                            ` · devolvido ${uso.quantidade_devolvida}`}
                          {Number(uso.quantidade_restante) > 0 &&
                            ` · disponível para devolução ${uso.quantidade_restante}`}
                        </p>
                        {Number(uso.quantidade_restante) > 0 && (
                          usoParaDevolver === uso.id ? (
                            <form onSubmit={devolver} className="grid gap-3">
                              <InputField
                                id={`quantidade-devolucao-${uso.id}`}
                                label={`Quantidade não utilizada (até ${uso.quantidade_restante} ${nomes.get(uso.material_id)?.unidade ?? ''})`}
                                inputMode="decimal"
                                required
                                value={quantidadeDevolucao}
                                onChange={(event) =>
                                  setQuantidadeDevolucao(event.target.value)
                                }
                              />
                              <TextareaField
                                id={`motivo-devolucao-${uso.id}`}
                                label="Motivo da devolução *"
                                required
                                value={motivoDevolucao}
                                onChange={(event) =>
                                  setMotivoDevolucao(event.target.value)
                                }
                                rows={2}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="submit"
                                  size="compact"
                                  disabled={ocupado || incerto}
                                >
                                  Registrar devolução
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="compact"
                                  onClick={() => setUsoParaDevolver(null)}
                                >
                                  Voltar
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <Button
                              variant="secondary"
                              size="compact"
                              disabled={ocupado || incerto}
                              onClick={() => {
                                setUsoParaDevolver(uso.id)
                                setQuantidadeDevolucao(uso.quantidade_restante)
                              }}
                            >
                              Remover quantidade não utilizada
                            </Button>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {['Aberta', 'Em andamento'].includes(ordem.status) && (
                  <form
                    onSubmit={registrar}
                    className="mt-6 grid gap-3 border-t border-outline-variant pt-5 sm:grid-cols-[1fr_140px_auto]"
                  >
                    <SelectField
                      id="material-uso"
                      label="Material"
                      value={materialId}
                      onChange={(event) => setMaterialId(event.target.value)}
                      required
                    >
                      <option value="">Selecione</option>
                      {materiais.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.nome} ({material.quantidade}{' '}
                          {material.unidade})
                        </option>
                      ))}
                    </SelectField>
                    <InputField
                      id="quantidade-uso"
                      label="Quantidade"
                      inputMode="decimal"
                      value={quantidade}
                      onChange={(event) => setQuantidade(event.target.value)}
                      required
                    />
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        size="compact"
                        disabled={ocupado || incerto}
                      >
                        Registrar uso
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            </div>
            <aside className="space-y-6">
              {ordem.motivo_cancelamento && (
                <section className="rounded-xl bg-surface-container-low p-6">
                  <h2 className="mb-3 text-label-md uppercase text-on-surface-variant">
                    Motivo do cancelamento
                  </h2>
                  <p className="whitespace-pre-wrap">{ordem.motivo_cancelamento}</p>
                </section>
              )}
              <section className="rounded-xl bg-surface-container-low p-6">
                <h2 className="mb-5 text-label-md uppercase text-on-surface-variant">
                  Valor da OS
                </h2>
                <p className="text-headline-md text-primary">
                  {dinheiro(ordem.valor)}
                </p>
                <p className="mt-3 text-label-md text-on-surface-variant">
                  Forma de pagamento:{' '}
                  {(
                    {
                      pix: 'PIX',
                      credito: 'Crédito',
                      debito: 'Débito',
                      dinheiro: 'Dinheiro',
                    } as Record<string, string>
                  )[ordem.forma_pagamento ?? ''] ?? 'Não informada'}
                </p>
              </section>
              <section className="rounded-xl bg-surface-container-low p-6">
                <h2 className="mb-5 text-label-md uppercase text-on-surface-variant">
                  Fluxo de trabalho
                </h2>
                {proximo ? (
                  <Button
                    className="w-full"
                    disabled={ocupado || incerto}
                    onClick={() => void mudarStatus(proximo)}
                  >
                    Avançar para {proximo}
                  </Button>
                ) : (
                  <p className="text-on-surface-variant">
                    {ordem.status === 'Cancelada'
                      ? 'Cancelada — estado final da OS.'
                      : 'Etapa final do fluxo; é possível voltar uma etapa.'}
                  </p>
                )}
                {statusAnterior(ordem.status) && (
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    disabled={ocupado || incerto}
                    onClick={() =>
                      void mudarStatus(statusAnterior(ordem.status)!)
                    }
                  >
                    Voltar para {statusAnterior(ordem.status)}
                  </Button>
                )}
                {['Aberta', 'Em andamento', 'Pronta'].includes(
                  ordem.status,
                ) && (
                  <Button
                    variant="dangerOutline"
                    className="mt-3 w-full"
                    disabled={ocupado || incerto}
                    onClick={() => setCancelamentoAberto(true)}
                  >
                    Cancelar OS
                  </Button>
                )}
                {cancelamentoAberto && (
                  <form
                    className="mt-4 space-y-3 border-t border-outline-variant pt-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void mudarStatus('Cancelada', motivoCancelamento.trim())
                    }}
                  >
                    <TextareaField
                      id="motivo-cancelamento-os"
                      label="Motivo do cancelamento *"
                      required
                      value={motivoCancelamento}
                      onChange={(event) =>
                        setMotivoCancelamento(event.target.value)
                      }
                      placeholder="Informe por que a OS está sendo cancelada"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        variant="dangerOutline"
                        disabled={ocupado || incerto}
                      >
                        Confirmar cancelamento
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setCancelamentoAberto(false)}
                      >
                        Voltar
                      </Button>
                    </div>
                  </form>
                )}
                {incerto && (
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => window.location.reload()}
                  >
                    Consultar situação atual
                  </Button>
                )}
                {erroAcao && (
                  <p
                    role="alert"
                    className="mt-4 rounded-default bg-error-container p-3 text-on-error-container"
                  >
                    {erroAcao}
                  </p>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
