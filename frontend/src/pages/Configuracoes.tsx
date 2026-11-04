import { useEffect, useState } from 'react'
import type { ComponentProps, ReactNode, SubmitEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import CampoEndereco from '../components/CampoEndereco'
import type { EnderecoFormulario } from '../components/CampoEndereco'
import InputField from '../components/InputField'
import Icon from '../components/Icon'
import PasswordField from '../components/PasswordField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import type { Usuario } from '../services/auth'
import {
  atualizarEnderecoLoja,
  atualizarSenha,
  consultarDadosLoja,
} from '../services/configuracoes'
import { buscarFuncionario } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import {
  aplicarTemaEscuro,
  lerPreferencias,
  salvarPreferencias,
} from '../services/preferencias'
import type { PreferenciasUsuario } from '../services/preferencias'
import { formatarCep } from '../utils/clientes'

function formatarEnderecoLoja(
  endereco: EnderecoFormulario,
  cep: string,
  numero: string,
): string {
  const rua = endereco.logradouro ? `${endereco.logradouro}, ${numero}` : ''
  const localidade = [endereco.cidade, endereco.uf]
    .filter(Boolean)
    .join(' - ')
  return [rua, endereco.bairro, localidade, cep ? `CEP ${formatarCep(cep)}` : '']
    .filter(Boolean)
    .join(', ')
}

function Interruptor({
  id,
  texto,
  descricao,
  marcado,
  aoAlterar,
}: {
  id: string
  texto: string
  descricao: string
  marcado: boolean
  aoAlterar: (valor: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-3">
      <div>
        <label htmlFor={id} className="text-label-md text-on-surface">
          {texto}
        </label>
        <p className="text-label-sm text-on-surface-variant">{descricao}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={marcado}
        aria-label={texto}
        onClick={() => aoAlterar(!marcado)}
        className={`relative h-11 w-14 shrink-0 rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${marcado ? 'bg-primary' : 'bg-outline-variant'}`}
      >
        <span
          aria-hidden="true"
          className={`block h-5 w-5 rounded-full bg-surface transition-transform ${marcado ? 'translate-x-7' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

function Cartao({
  titulo,
  children,
  icone,
}: {
  titulo: string
  children: ReactNode
  icone: ComponentProps<typeof Icon>['name']
}) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-low p-5 md:p-6">
      <h2 className="mb-5 flex items-center gap-3 border-b border-outline-variant/60 pb-4 text-headline-md text-on-surface">
        <Icon name={icone} />
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default function Configuracoes() {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const administrador = usuario.perfil === 'administrador'
  const [pessoa, setPessoa] = useState<Funcionario | null>(null)
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario>(() =>
    lerPreferencias(usuario.id),
  )
  const [endereco, setEndereco] = useState('')
  const [cep, setCep] = useState('')
  const [numero, setNumero] = useState('')
  const [enderecoCampos, setEnderecoCampos] = useState<EnderecoFormulario>({
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: '',
  })
  const [carregandoEndereco, setCarregandoEndereco] = useState(true)
  const [editarEndereco, setEditarEndereco] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [senhaNova, setSenhaNova] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true
    buscarFuncionario(String(usuario.id))
      .then((dados) => {
        if (ativo) setPessoa(dados)
      })
      .catch((error) => {
        if (!ativo) return
        if (error instanceof ErroApi && error.status === 401)
          navigate('/login', { replace: true })
        else
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar seus dados.',
          )
      })
    consultarDadosLoja()
      .then((dados) => {
        if (ativo) setEndereco(dados.endereco)
      })
      .catch((error) => {
        if (ativo)
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados da loja.',
          )
      })
      .finally(() => {
        if (ativo) setCarregandoEndereco(false)
      })
    return () => {
      ativo = false
    }
  }, [navigate, usuario.id])

  function mudarPreferencias(alteracoes: Partial<PreferenciasUsuario>) {
    const novas = { ...preferencias, ...alteracoes }
    setPreferencias(novas)
    salvarPreferencias(usuario.id, novas)
    if ('modoEscuro' in alteracoes) aplicarTemaEscuro(novas.modoEscuro)
  }

  async function submeterSenha(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando) return
    const formulario = event.currentTarget
    const dados = new FormData(formulario)
    const atual = String(dados.get('senha_atual') ?? '')
    const nova = String(dados.get('senha_nova') ?? '')
    const confirmacao = String(dados.get('confirmar_senha_nova') ?? '')
    if (nova !== confirmacao) {
      setErro('A confirmação precisa ser igual à nova senha.')
      return
    }
    setEnviando(true)
    setErro('')
    setSucesso('')
    try {
      await atualizarSenha(atual, nova, confirmacao)
      formulario.reset()
      navigate('/login', { replace: true, state: { senhaAlterada: true } })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar a senha.',
        )
    } finally {
      setEnviando(false)
    }
  }

  async function submeterEndereco(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando) return
    const cepLimpo = cep
    const numeroLimpo = numero.trim()
    let enderecoSalvo = ''
    const algumEndereco = Object.values(enderecoCampos).some((valor) => valor.trim())
    if (cepLimpo || numeroLimpo || algumEndereco) {
      if (
        (cepLimpo && cepLimpo.length !== 8) ||
        !numeroLimpo ||
        !enderecoCampos.logradouro.trim() ||
        !enderecoCampos.bairro.trim()
      ) {
        setErro('Preencha rua, bairro e número. CEP, cidade e estado são opcionais.')
        return
      }
      enderecoSalvo = formatarEnderecoLoja(enderecoCampos, cepLimpo, numeroLimpo)
    }
    setEnviando(true)
    setErro('')
    setSucesso('')
    try {
      const dados = await atualizarEnderecoLoja(enderecoSalvo)
      setEndereco(dados.endereco)
      setEditarEndereco(false)
      setCep('')
      setNumero('')
      setEnderecoCampos({ logradouro: '', bairro: '', cidade: '', uf: '' })
      setSucesso(enderecoSalvo ? 'Endereço da loja atualizado.' : 'Endereço da loja removido.')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401)
        navigate('/login', { replace: true })
      else if (error instanceof ResultadoIncerto)
        setErro(
          `${error.message} Consulte novamente antes de tentar salvar outra vez.`,
        )
      else
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o endereço.',
        )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-container-max space-y-6">
      <header>
        <h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">
          Configurações
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Gerencie suas preferências e os dados da sapataria.
        </p>
      </header>
      {erro && (
        <p
          role="alert"
          className="rounded-default bg-error-container p-4 text-on-error-container"
        >
          {erro}
        </p>
      )}
      {sucesso && <Alerta mensagem={sucesso} onFechar={() => setSucesso('')} />}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div className="space-y-6">
          <Cartao titulo="Conta do usuário" icone="clientes">
            {!pessoa ? (
              <p role="status">Carregando seus dados…</p>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-label-sm text-on-surface-variant">
                    Nome de usuário
                  </dt>
                  <dd className="mt-1 break-words text-body-md">
                    {pessoa.usuario}
                  </dd>
                </div>
                <div>
                  <dt className="text-label-sm text-on-surface-variant">
                    E-mail
                  </dt>
                  <dd className="mt-1 break-words text-body-md">
                    {pessoa.email}
                  </dd>
                </div>
              </dl>
            )}
            <div className="mt-5 border-t border-outline-variant/60 pt-4">
              <Button
                variant="secondary"
                size="compact"
                aria-expanded={mostrarSenha}
                aria-controls="formulario-senha"
                onClick={() => {
                  setMostrarSenha((valor) => !valor)
                  setErro('')
                }}
              >
                {mostrarSenha ? 'Fechar alteração de senha' : 'Alterar senha'}
              </Button>
              {mostrarSenha && (
                <form
                  id="formulario-senha"
                  onSubmit={submeterSenha}
                  className="mt-5 grid gap-4"
                  aria-busy={enviando}
                >
                  <PasswordField
                    id="senha_atual"
                    name="senha_atual"
                    label="Senha atual"
                    autoComplete="current-password"
                    required
                    disabled={enviando}
                  />
                  <PasswordField
                    id="senha_nova"
                    name="senha_nova"
                    label="Nova senha"
                    autoComplete="new-password"
                    minLength={8}
                    value={senhaNova}
                    onChange={(event) => setSenhaNova(event.target.value)}
                    required
                    disabled={enviando}
                    aria-describedby="regras-senha"
                  />
                  <ul
                    id="regras-senha"
                    className="grid gap-1 text-label-sm text-on-surface-variant"
                    aria-live="polite"
                  >
                    {[
                      {
                        texto: 'Pelo menos 8 caracteres',
                        ok: [...senhaNova].length >= 8,
                      },
                      {
                        texto: 'Pelo menos uma letra maiúscula',
                        ok: /\p{Lu}/u.test(senhaNova),
                      },
                      {
                        texto: 'Pelo menos uma letra minúscula',
                        ok: /\p{Ll}/u.test(senhaNova),
                      },
                      {
                        texto: 'Pelo menos um caractere especial',
                        ok: /[^\p{L}\p{N}]/u.test(senhaNova),
                      },
                    ].map((regra) => (
                      <li
                        key={regra.texto}
                        className={regra.ok ? 'text-success' : ''}
                      >
                        {regra.ok ? '✓' : '○'} {regra.texto}
                      </li>
                    ))}
                  </ul>
                  <PasswordField
                    id="confirmar_senha_nova"
                    name="confirmar_senha_nova"
                    label="Confirmar nova senha"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={enviando}
                  />
                  <p className="text-label-sm text-on-surface-variant">
                    Após salvar, será necessário entrar novamente.
                  </p>
                  <div>
                    <Button type="submit" disabled={enviando}>
                      {enviando ? 'Atualizando…' : 'Atualizar senha'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Cartao>
          <Cartao titulo="Preferências pessoais" icone="configuracoes">
            <Interruptor
              id="notificacoes"
              texto="Notificações"
              descricao="Preferência pessoal para alertas de ordens de serviço e estoque."
              marcado={preferencias.notificacoes}
              aoAlterar={(valor) => mudarPreferencias({ notificacoes: valor })}
            />
            <Interruptor
              id="modo-escuro"
              texto="Modo escuro"
              descricao="Muda a aparência das telas do sistema neste navegador."
              marcado={preferencias.modoEscuro}
              aoAlterar={(valor) => mudarPreferencias({ modoEscuro: valor })}
            />
            <p className="mt-2 text-label-sm text-on-surface-variant">
              As notificações ainda não enviam alertas. As preferências ficam
              salvas neste navegador, separadas por usuário.
            </p>
          </Cartao>
        </div>
        <Cartao titulo="Dados da sapataria" icone="endereco">
          {carregandoEndereco ? (
            <p role="status">Carregando dados da loja…</p>
          ) : administrador && editarEndereco ? (
            <form
              onSubmit={submeterEndereco}
              className="space-y-4"
              aria-busy={enviando}
            >
              <p className="text-label-sm text-on-surface-variant">
                Endereço salvo: {endereco || 'ainda não informado'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  id="numero-loja"
                  label="Número"
                  placeholder="Ex.: 123, 123A ou S/N"
                  autoComplete="address-line2"
                  value={numero}
                  onChange={(event) => setNumero(event.target.value)}
                  maxLength={30}
                  disabled={enviando}
                />
              </div>
              <CampoEndereco
                prefixo="loja"
                cep={cep}
                endereco={enderecoCampos}
                aoMudarCep={(valor) => {
                  setCep(valor)
                  setErro('')
                }}
                aoMudarEndereco={(valor) => {
                  setEnderecoCampos(valor)
                  setErro('')
                }}
                desabilitado={enviando}
              />
              <p className="text-label-sm text-on-surface-variant">
                O endereço formatado poderá ser usado pela Landing Page. Deixe
                rua, bairro, número, cidade, estado e CEP vazios para removê-lo.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={enviando}
                >
                  {enviando ? 'Salvando…' : 'Salvar endereço'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={enviando}
                  onClick={() => {
                    setEditarEndereco(false)
                    setCep('')
                    setNumero('')
                    setEnderecoCampos({ logradouro: '', bairro: '', cidade: '', uf: '' })
                    setErro('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="whitespace-pre-line text-body-md">
                {endereco || 'Endereço ainda não informado.'}
              </p>
              {administrador && (
                <Button
                  variant="secondary"
                  size="compact"
                  className="mt-5 w-full"
                  onClick={() => setEditarEndereco(true)}
                >
                  Editar endereço
                </Button>
              )}
            </>
          )}
        </Cartao>
      </div>
    </div>
  )
}
