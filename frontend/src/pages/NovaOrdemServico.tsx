import { useEffect, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom'
import Button from '../components/Button'
import BuscaClienteOs from '../components/BuscaClienteOs'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import TextareaField from '../components/TextareaField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import type { Usuario } from '../services/auth'
import { listarClientes } from '../services/clientes'
import type { Cliente } from '../services/clientes'
import { listarFuncionarios } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import {
  atualizarOrdem,
  cadastrarOrdem,
  listarMateriaisDisponiveis,
  listarOrdens,
} from '../services/ordensServico'
import type {
  ItemOrdemServico,
  MaterialDisponivel,
  OrdemDetalhada,
} from '../services/ordensServico'
import { formatarValorOs, valorOsParaApi } from '../utils/ordensServico'

export default function NovaOrdemServico({
  inicial,
}: {
  inicial?: OrdemDetalhada
}) {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const rascunho = state?.rascunhoOs
  const editando = Boolean(inicial)
  const itensIniciais: ItemOrdemServico[] =
    inicial?.itens?.length
      ? inicial.itens
      : typeof rascunho?.itens === 'object' && Array.isArray(rascunho.itens)
        ? rascunho.itens
        : [
            {
              descricao_item:
                inicial?.descricao_calcado ??
                (typeof rascunho?.item === 'string' ? rascunho.item : ''),
              servico:
                inicial?.servico ??
                (typeof rascunho?.servico === 'string'
                  ? rascunho.servico
                  : ''),
            },
          ]
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [servicosDisponiveis, setServicosDisponiveis] = useState<string[]>([])
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<
    MaterialDisponivel[]
  >([])
  const [responsaveis, setResponsaveis] = useState<Funcionario[]>([])
  const [erroCarga, setErroCarga] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteId, setClienteId] = useState(
    inicial ? String(inicial.cliente_id) : '',
  )
  const [responsavelId, setResponsavelId] = useState(
    inicial
      ? String(inicial.responsavel_id)
      : typeof rascunho?.responsavelId === 'string'
        ? rascunho.responsavelId
        : String(usuario.id),
  )
  const [itens, setItens] = useState<ItemOrdemServico[]>(itensIniciais)
  const [materiaisPlanejados, setMateriaisPlanejados] = useState<
    Array<{ material_id: string; quantidade: string }>
  >(
    inicial?.materiais_planejados?.map((material) => ({
      material_id: String(material.material_id),
      quantidade: material.quantidade,
    })) ??
      (Array.isArray(rascunho?.materiais_planejados)
        ? rascunho.materiais_planejados
        : []),
  )
  const [prazo, setPrazo] = useState(
    inicial?.prazo_entrega ??
      (typeof rascunho?.prazo === 'string' ? rascunho.prazo : ''),
  )
  const [valor, setValor] = useState(() =>
    formatarValorOs(
      inicial?.valor ??
        (typeof rascunho?.valor === 'string' ? rascunho.valor : ''),
    ),
  )
  const [pagamento, setPagamento] = useState(
    inicial?.forma_pagamento ??
      (typeof rascunho?.pagamento === 'string' ? rascunho.pagamento : ''),
  )
  const [observacoes, setObservacoes] = useState(
    inicial?.observacoes ??
      (typeof rascunho?.observacoes === 'string' ? rascunho.observacoes : ''),
  )
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const erroRef = useRef<HTMLParagraphElement>(null)
  const envioEmCurso = useRef(false)

  useEffect(() => {
    if (erro) erroRef.current?.focus()
  }, [erro])

  useEffect(() => {
    let ativo = true
    Promise.all([
      listarClientes(),
      listarOrdens(),
      listarMateriaisDisponiveis(),
      editando && usuario.perfil === 'administrador'
        ? listarFuncionarios()
        : Promise.resolve([] as Funcionario[]),
    ])
      .then(([pessoas, ordens, materiais, equipe]) => {
        if (ativo) {
          setClientes(pessoas)
          setMateriaisDisponiveis(materiais)
          setResponsaveis(equipe.filter((pessoa) => pessoa.ativo))
          const opcoes = [
            ...new Set(
              ordens
                .flatMap((ordem) =>
                  ordem.itens?.map((item) => item.servico) ?? [ordem.servico],
                )
                .map((servico) => servico.trim())
                .filter(Boolean),
            ),
          ].sort((a, b) => a.localeCompare(b, 'pt-BR'))
          setServicosDisponiveis(opcoes)
          const selecionado = pessoas.find(
            (pessoa) =>
              pessoa.id ===
              (Number.isInteger(state?.clienteRecemCadastrado)
                ? state.clienteRecemCadastrado
                : inicial?.cliente_id),
          )
          if (selecionado) {
            setClienteId(String(selecionado.id))
            setBuscaCliente(selecionado.nome)
          }
        }
      })
      .catch((error: unknown) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErroCarga(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o formulário.',
          )
      })
    return () => {
      ativo = false
    }
  }, [
    navigate,
    tentativa,
    editando,
    usuario.perfil,
    state,
    inicial?.cliente_id,
    inicial?.itens,
  ])

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEmCurso.current || incerto) return
    if (
      !clientes?.some((cliente) => cliente.id === Number(clienteId)) ||
      (inicial && !responsavelId) ||
      !itens.length ||
      itens.some((item) => !item.descricao_item.trim() || !item.servico.trim()) ||
      materiaisPlanejados.some(
        (material) =>
          !material.material_id ||
          !/^\d+(?:[.,]\d+)?$/.test(material.quantidade.trim()) ||
          Number(material.quantidade.replace(',', '.')) <= 0,
      ) ||
      !valor
    ) {
      setErro(
        inicial
          ? 'Selecione cliente e responsável, preencha todos os itens e serviços, confira os materiais planejados e informe o valor da OS.'
          : 'Selecione cliente, preencha todos os itens e serviços e informe o valor da OS. Se adicionar materiais planejados, complete material e quantidade.',
      )
      return
    }
    if (prazo && Number.isNaN(Date.parse(prazo))) {
      setErro('Informe um prazo de entrega válido.')
      return
    }
    envioEmCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      const dados = {
        cliente_id: Number(clienteId),
        itens: itens.map((item) => ({
          descricao_item: item.descricao_item.trim(),
          servico: item.servico.trim(),
        })),
        materiais_planejados: materiaisPlanejados.map((material) => ({
          material_id: Number(material.material_id),
          quantidade: material.quantidade.trim().replace(',', '.'),
        })),
        valor: valorOsParaApi(valor),
        prazo_entrega: prazo || null,
        forma_pagamento: pagamento || null,
        observacoes: observacoes.trim() || null,
      }
      const ordem = inicial
        ? await atualizarOrdem(inicial.id, {
            ...dados,
            responsavel_id: Number(responsavelId),
          })
        : await cadastrarOrdem(dados)
      navigate(`/ordens-servico/${ordem.id}`, {
        replace: true,
        state: { [inicial ? 'ordemEditada' : 'ordemCadastrada']: true },
      })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else {
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a ordem.',
        )
        if (error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally {
      envioEmCurso.current = false
      setEnviando(false)
    }
  }

  const novoClienteState = {
    origemNovaOs: true,
    rascunhoOs: {
      responsavelId,
      itens,
      materiais_planejados: materiaisPlanejados,
      prazo,
      valor,
      pagamento,
      observacoes,
    },
  }
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <Link
          to="/ordens-servico"
          className="text-label-md text-primary hover:underline"
        >
          Ordens de Serviço
        </Link>
        <span className="mx-2 text-outline">›</span>
        <span className="text-label-md text-on-surface-variant">
          {inicial ? `Editar OS #${inicial.id}` : 'Nova ordem'}
        </span>
        <h1 className="mt-3 text-headline-lg-mobile text-primary md:text-headline-lg">
          {inicial
            ? `Editar Ordem de Serviço #${inicial.id}`
            : 'Novo cadastro de Ordem de Serviço'}
        </h1>
        <p className="mt-2 text-on-surface-variant">
          {inicial
            ? 'Atualize os dados da ordem de serviço.'
            : 'Preencha os dados para registrar um novo serviço.'}
        </p>
      </header>
      {erroCarga ? (
        <div className="space-y-3">
          <p
            role="alert"
            className="rounded-default bg-error-container p-4 text-on-error-container"
          >
            {erroCarga}
          </p>
          <Button
            onClick={() => {
              setErroCarga('')
              setTentativa((v) => v + 1)
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !clientes ? (
        <p role="status">Carregando formulário…</p>
      ) : (
        <form
          onSubmit={salvar}
          noValidate
          aria-describedby={erro ? 'erro-os' : undefined}
          className="space-y-5"
        >
          {erro && (
            <p
              ref={erroRef}
              id="erro-os"
              tabIndex={-1}
              role="alert"
              className="rounded-default bg-error-container p-4 text-on-error-container focus:outline-2 focus:outline-offset-2 focus:outline-error"
            >
              {erro}
            </p>
          )}
          <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8">
            <h2 className="mb-6 text-headline-md text-primary">
              Informações do cliente
            </h2>
            <BuscaClienteOs
              clientes={clientes}
              busca={buscaCliente}
              clienteId={clienteId}
              onBusca={(valor) => {
                setBuscaCliente(valor)
                setClienteId('')
              }}
              onSelecionar={(cliente) => {
                setBuscaCliente(cliente.nome)
                setClienteId(String(cliente.id))
              }}
            />
            {!inicial && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-label-md text-on-surface-variant">
                  Cliente ainda não cadastrado?
                </span>
                <Link
                  to="/clientes/novo"
                  state={novoClienteState}
                  className="inline-flex min-h-11 items-center rounded-default border border-primary/30 bg-surface px-4 py-2 text-label-md text-primary hover:bg-primary/5"
                >
                  Cadastrar cliente
                </Link>
              </div>
            )}
            {inicial && usuario.perfil === 'administrador' ? (
              <div className="mt-5 max-w-md">
                <SelectField
                  id="responsavel-os"
                  label="Responsável *"
                  required
                  value={responsavelId}
                  onChange={(event) => setResponsavelId(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {responsaveis.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : (
              <p className="mt-5 text-label-md text-on-surface-variant">
                Responsável:{' '}
                {inicial && inicial.responsavel_id !== usuario.id
                  ? `Funcionário #${inicial.responsavel_id}`
                  : usuario.nome}
              </p>
            )}
          </section>
          <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8">
            <h2 className="mb-6 text-headline-md text-primary">
              Detalhes do serviço
            </h2>
            <div className="space-y-5">
              {itens.map((item, indice) => (
                <div
                  key={indice}
                  role="group"
                  aria-labelledby={`titulo-item-servico-${indice}`}
                  className="rounded-default border border-outline-variant bg-surface p-4"
                >
                  <h3
                    id={`titulo-item-servico-${indice}`}
                    className="mb-4 border-b border-outline-variant/70 pb-2 text-label-md text-primary"
                  >
                    Item e serviço {indice + 1}
                  </h3>
                  <div className="space-y-4">
                    <InputField
                      id={`item-os-${indice}`}
                      label="Descrição do item *"
                      required
                      value={item.descricao_item}
                      onChange={(event) =>
                        setItens((atuais) =>
                          atuais.map((atual, i) =>
                            i === indice
                              ? { ...atual, descricao_item: event.target.value }
                              : atual,
                          ),
                        )
                      }
                      placeholder="Ex.: Botas de couro marrom"
                    />
                    <InputField
                      id={`servico-os-${indice}`}
                      label="Serviço solicitado *"
                      required
                      list="servicos-os-conhecidos"
                      value={item.servico}
                      onChange={(event) =>
                        setItens((atuais) =>
                          atuais.map((atual, i) =>
                            i === indice
                              ? { ...atual, servico: event.target.value }
                              : atual,
                          ),
                        )
                      }
                      placeholder="Ex.: Ressola completa"
                    />
                    {indice > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() =>
                          setItens((atuais) =>
                            atuais.filter((_, i) => i !== indice),
                          )
                        }
                      >
                        Remover item
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <datalist id="servicos-os-conhecidos">
                {servicosDisponiveis.map((opcao) => (
                  <option key={opcao} value={opcao} />
                ))}
              </datalist>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() =>
                  setItens((atuais) => [
                    ...atuais,
                    { descricao_item: '', servico: '' },
                  ])
                }
              >
                Adicionar item e serviço
              </Button>
              <TextareaField
                id="observacoes-os"
                label="Observações (opcional)"
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Informações adicionais da OS"
              />
            </div>
          </section>
          <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8">
            <h2 className="mb-2 text-headline-md text-primary">
              Materiais previstos
            </h2>
            <p className="mb-5 text-label-md text-on-surface-variant">
              O planejamento não altera o estoque. A baixa é registrada quando
              o material for efetivamente utilizado.
            </p>
            <div className="space-y-4">
              {materiaisPlanejados.map((material, indice) => (
                <div
                  key={indice}
                  className="grid gap-4 rounded-default border border-outline-variant bg-surface p-4 sm:grid-cols-[1fr_160px_auto]"
                >
                  <SelectField
                    id={`material-planejado-${indice}`}
                    label="Material"
                    required
                    value={material.material_id}
                    onChange={(event) =>
                      setMateriaisPlanejados((atuais) =>
                        atuais.map((atual, i) =>
                          i === indice
                            ? { ...atual, material_id: event.target.value }
                            : atual,
                        ),
                      )
                    }
                  >
                    <option value="">Selecione</option>
                    {materiaisDisponiveis.map((opcao) => (
                      <option key={opcao.id} value={opcao.id}>
                        {opcao.nome} ({opcao.unidade})
                      </option>
                    ))}
                  </SelectField>
                  <InputField
                    id={`quantidade-planejada-${indice}`}
                    label="Quantidade"
                    inputMode="decimal"
                    required
                    value={material.quantidade}
                    onChange={(event) =>
                      setMateriaisPlanejados((atuais) =>
                        atuais.map((atual, i) =>
                          i === indice
                            ? { ...atual, quantidade: event.target.value }
                            : atual,
                        ),
                      )
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      onClick={() =>
                        setMateriaisPlanejados((atuais) =>
                          atuais.filter((_, i) => i !== indice),
                        )
                      }
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() =>
                  setMateriaisPlanejados((atuais) => [
                    ...atuais,
                    { material_id: '', quantidade: '' },
                  ])
                }
              >
                Adicionar material
              </Button>
            </div>
          </section>
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8">
              <h2 className="mb-6 text-headline-md text-primary">Datas</h2>
              <p className="mb-5 text-label-md text-on-surface-variant">
                A entrada é registrada automaticamente.
              </p>
              <InputField
                id="prazo-os"
                label="Previsão de entrega (opcional)"
                type="date"
                value={prazo}
                onChange={(event) => setPrazo(event.target.value)}
              />
            </section>
            <section className="rounded-xl border border-outline-variant bg-secondary-container p-5 md:p-8">
              <h2 className="mb-6 text-headline-md text-primary">
                Valor e pagamento
              </h2>
              <div className="space-y-5">
                <InputField
                  id="valor-os"
                  label="Valor da OS (R$) *"
                  required
                  inputMode="numeric"
                  value={valor}
                  onChange={(event) =>
                    setValor(formatarValorOs(event.target.value))
                  }
                  placeholder="R$ 0,00"
                />
                <SelectField
                  id="pagamento-os"
                  label="Forma de pagamento (opcional)"
                  value={pagamento}
                  onChange={(event) => setPagamento(event.target.value)}
                >
                  <option value="">Não informada</option>
                  <option value="pix">PIX</option>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </SelectField>
                <p className="text-label-sm text-on-surface-variant">
                  Digite os números do valor, incluindo os centavos. Ex.: 123456
                  → R$ 1.234,56. O valor é manual, sem imposto automático.
                </p>
              </div>
            </section>
          </div>
          <div className="mobile-action-group justify-end border-t border-outline-variant pt-6">
            <Link
              to={inicial ? `/ordens-servico/${inicial.id}` : '/ordens-servico'}
              className="inline-flex min-h-11 items-center justify-center rounded-default border border-primary/30 bg-surface px-5 py-3 text-label-md text-primary"
            >
              Cancelar
            </Link>
            {incerto ? (
              <Link
                to={
                  inicial ? `/ordens-servico/${inicial.id}` : '/ordens-servico'
                }
                className="inline-flex min-h-11 items-center justify-center rounded-default bg-primary px-5 py-3 text-label-md text-on-primary"
              >
                Consultar {inicial ? 'OS' : 'lista'}
              </Link>
            ) : (
              <Button
                type="submit"
                disabled={enviando || clientes.length === 0}
              >
                {enviando
                  ? 'Salvando…'
                  : inicial
                    ? 'Salvar alterações'
                    : 'Cadastrar Ordem de Serviço'}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
