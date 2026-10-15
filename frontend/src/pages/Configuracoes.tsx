import { useEffect, useState } from 'react'
import type { ComponentProps, ReactNode, SubmitEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Alerta from '../components/Alerta'
import Button from '../components/Button'
import Icon from '../components/Icon'
import InputField from '../components/InputField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import type { Usuario } from '../services/auth'
import { atualizarEnderecoLoja, atualizarSenha, consultarDadosLoja } from '../services/configuracoes'
import { buscarFuncionario } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'
import { aplicarTemaEscuro, lerPreferencias, salvarPreferencias } from '../services/preferencias'
import type { PreferenciasUsuario } from '../services/preferencias'
import { consultarCep } from '../services/cep'
import type { EnderecoCep } from '../services/cep'
import { digitos, formatarCep } from '../utils/clientes'

type ResultadoCep = { cep: string; carregando: boolean; endereco?: EnderecoCep; erro?: string }

function formatarEnderecoLoja(endereco: EnderecoCep | undefined, cep: string, numero: string): string {
  const rua = endereco?.logradouro ? `${endereco.logradouro}, ${numero}` : `Número ${numero}`
  const localidade = [endereco?.localidade, endereco?.uf].filter(Boolean).join(' - ')
  return [rua, endereco?.bairro, localidade, `CEP ${formatarCep(cep)}`].filter(Boolean).join(', ')
}

function Interruptor({ id, texto, descricao, marcado, aoAlterar }: {
  id: string; texto: string; descricao: string; marcado: boolean; aoAlterar: (valor: boolean) => void
}) {
  return <div className="flex items-center justify-between gap-5 py-3">
    <div><label htmlFor={id} className="text-label-md text-on-surface">{texto}</label><p className="text-label-sm text-on-surface-variant">{descricao}</p></div>
    <button id={id} type="button" role="switch" aria-checked={marcado} aria-label={texto} onClick={() => aoAlterar(!marcado)}
      className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${marcado ? 'bg-primary' : 'bg-outline-variant'}`}>
      <span aria-hidden="true" className={`block h-5 w-5 rounded-full bg-surface transition-transform ${marcado ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
}

function Cartao({ titulo, children, icone }: { titulo: string; children: ReactNode; icone: ComponentProps<typeof Icon>['name'] }) {
  return <section className="rounded-lg border border-outline-variant bg-surface-container-low p-5 md:p-6">
    <h2 className="mb-5 flex items-center gap-3 border-b border-outline-variant/60 pb-4 text-headline-md text-on-surface"><Icon name={icone} />{titulo}</h2>
    {children}
  </section>
}

export default function Configuracoes() {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const administrador = usuario.perfil === 'administrador'
  const [pessoa, setPessoa] = useState<Funcionario | null>(null)
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario>(() => lerPreferencias(usuario.id))
  const [endereco, setEndereco] = useState('')
  const [cep, setCep] = useState('')
  const [numero, setNumero] = useState('')
  const [resultadoCep, setResultadoCep] = useState<ResultadoCep | null>(null)
  const [tentativaCep, setTentativaCep] = useState(0)
  const [carregandoEndereco, setCarregandoEndereco] = useState(administrador)
  const [editarEndereco, setEditarEndereco] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true
    buscarFuncionario(String(usuario.id)).then(dados => { if (ativo) setPessoa(dados) }).catch(error => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar seus dados.')
    })
    if (administrador) {
      consultarDadosLoja().then(dados => { if (ativo) setEndereco(dados.endereco) }).catch(error => {
        if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível carregar os dados da loja.')
      }).finally(() => { if (ativo) setCarregandoEndereco(false) })
    }
    return () => { ativo = false }
  }, [administrador, navigate, usuario.id])

  useEffect(() => {
    if (!editarEndereco || cep.length !== 8) return
    const controle = new AbortController()
    consultarCep(cep, controle.signal).then(dados => {
      if (!controle.signal.aborted) setResultadoCep({ cep, carregando: false, endereco: dados })
    }).catch(error => {
      if (!controle.signal.aborted) setResultadoCep({
        cep,
        carregando: false,
        erro: error instanceof Error ? error.message : 'Não foi possível consultar o CEP. Tente novamente.',
      })
    })
    return () => controle.abort()
  }, [cep, editarEndereco, tentativaCep])

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
    if (nova !== confirmacao) { setErro('A confirmação precisa ser igual à nova senha.'); return }
    setEnviando(true); setErro(''); setSucesso('')
    try {
      await atualizarSenha(atual, nova, confirmacao)
      formulario.reset()
      navigate('/login', { replace: true, state: { senhaAlterada: true } })
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível alterar a senha.')
    } finally { setEnviando(false) }
  }

  async function submeterEndereco(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando) return
    const cepLimpo = cep
    const numeroLimpo = numero.trim()
    const consultaAtual = resultadoCep?.cep === cepLimpo ? resultadoCep : null
    let enderecoSalvo = ''
    if (cepLimpo || numeroLimpo) {
      if (cepLimpo.length !== 8 || !numeroLimpo) {
        setErro('Informe os 8 números do CEP e o número do endereço.'); return
      }
      if (!consultaAtual || consultaAtual.carregando) {
        setErro('Aguarde a consulta do ViaCEP terminar antes de salvar.'); return
      }
      enderecoSalvo = formatarEnderecoLoja(consultaAtual.endereco, cepLimpo, numeroLimpo)
    }
    setEnviando(true); setErro(''); setSucesso('')
    try {
      const dados = await atualizarEnderecoLoja(enderecoSalvo)
      setEndereco(dados.endereco); setEditarEndereco(false)
      setCep(''); setNumero(''); setResultadoCep(null); setTentativaCep(0)
      setSucesso(consultaAtual?.erro
        ? 'Endereço salvo com CEP e número. Os detalhes do ViaCEP não foram incluídos.'
        : enderecoSalvo ? 'Endereço da loja atualizado.' : 'Endereço da loja removido.')
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else if (error instanceof ResultadoIncerto) setErro(`${error.message} Consulte novamente antes de tentar salvar outra vez.`)
      else setErro(error instanceof Error ? error.message : 'Não foi possível salvar o endereço.')
    } finally { setEnviando(false) }
  }

  return <div className="mx-auto max-w-container-max space-y-6">
    <header><h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">Configurações</h1><p className="mt-2 text-body-md text-on-surface-variant">Gerencie suas preferências e os dados da sapataria.</p></header>
    {erro && <p role="alert" className="rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
    {sucesso && <Alerta mensagem={sucesso} onFechar={() => setSucesso('')} />}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
      <div className="space-y-6">
        <Cartao titulo="Conta do usuário" icone="clientes">
          {!pessoa ? <p role="status">Carregando seus dados…</p> : <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-label-sm text-on-surface-variant">Nome de usuário</dt><dd className="mt-1 break-words text-body-md">{pessoa.usuario}</dd></div>
            <div><dt className="text-label-sm text-on-surface-variant">E-mail</dt><dd className="mt-1 break-words text-body-md">{pessoa.email}</dd></div>
          </dl>}
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Button variant="secondary" size="compact" aria-expanded={mostrarSenha} aria-controls="formulario-senha" onClick={() => { setMostrarSenha(valor => !valor); setErro('') }}>
              {mostrarSenha ? 'Fechar alteração de senha' : 'Alterar senha'}
            </Button>
            {mostrarSenha && <form id="formulario-senha" onSubmit={submeterSenha} className="mt-5 grid gap-4" aria-busy={enviando}>
              <InputField id="senha_atual" name="senha_atual" label="Senha atual" type="password" autoComplete="current-password" required disabled={enviando} />
              <InputField id="senha_nova" name="senha_nova" label="Nova senha" type="password" autoComplete="new-password" minLength={15} maxLength={128} required disabled={enviando} />
              <InputField id="confirmar_senha_nova" name="confirmar_senha_nova" label="Confirmar nova senha" type="password" autoComplete="new-password" minLength={15} maxLength={128} required disabled={enviando} />
              <p className="text-label-sm text-on-surface-variant">A senha precisa ter entre 15 e 128 caracteres. Após salvar, será necessário entrar novamente.</p>
              <div><Button type="submit" disabled={enviando}>{enviando ? 'Atualizando…' : 'Atualizar senha'}</Button></div>
            </form>}
          </div>
        </Cartao>
        <Cartao titulo="Preferências pessoais" icone="configuracoes">
          <Interruptor id="notificacoes" texto="Notificações" descricao="Preferência pessoal para alertas de ordens de serviço e estoque." marcado={preferencias.notificacoes} aoAlterar={valor => mudarPreferencias({ notificacoes: valor })} />
          <Interruptor id="modo-escuro" texto="Modo escuro" descricao="Muda a aparência das telas do sistema neste navegador." marcado={preferencias.modoEscuro} aoAlterar={valor => mudarPreferencias({ modoEscuro: valor })} />
          <p className="mt-2 text-label-sm text-on-surface-variant">As notificações ainda não enviam alertas. As preferências ficam salvas neste navegador, separadas por usuário.</p>
        </Cartao>
      </div>
      {administrador && <Cartao titulo="Dados da sapataria" icone="endereco">
        {carregandoEndereco ? <p role="status">Carregando dados da loja…</p> : editarEndereco ? <form onSubmit={submeterEndereco} className="space-y-4" aria-busy={enviando || resultadoCep?.carregando}>
          <p className="text-label-sm text-on-surface-variant">Endereço salvo: {endereco || 'ainda não informado'}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField id="cep-loja" label="CEP" autoComplete="postal-code" inputMode="numeric" value={formatarCep(cep)} onChange={event => { const novoCep = digitos(event.target.value, 8); setCep(novoCep); if (novoCep !== cep) setResultadoCep(novoCep.length === 8 ? { cep: novoCep, carregando: true } : null); setErro('') }} maxLength={9} disabled={enviando} />
            <InputField id="numero-loja" label="Número" placeholder="Ex.: 123, 123A ou S/N" autoComplete="address-line2" value={numero} onChange={event => setNumero(event.target.value)} maxLength={30} disabled={enviando} />
          </div>
          {cep.length !== 8 ? <p className="text-label-sm text-on-surface-variant">Digite os 8 números do CEP para consultar o endereço.</p>
            : resultadoCep?.cep !== cep || resultadoCep.carregando ? <p role="status" className="text-label-sm text-on-surface-variant">Consultando endereço no ViaCEP…</p>
            : resultadoCep.erro ? <div className="space-y-2"><p role="alert" className="text-label-sm text-error">{resultadoCep.erro} Você ainda pode salvar o CEP e o número.</p><Button type="button" variant="secondary" size="compact" onClick={() => { setResultadoCep({ cep, carregando: true }); setTentativaCep(valor => valor + 1) }} disabled={enviando}>Consultar novamente</Button></div>
                : <dl className="grid gap-3 rounded-default bg-surface-container p-4 sm:grid-cols-2" aria-live="polite">
                  <div><dt className="text-label-sm text-on-surface-variant">Rua</dt><dd className="text-label-md font-normal">{resultadoCep.endereco?.logradouro || 'Não informada pelo ViaCEP'}{numero.trim() && `, ${numero.trim()}`}</dd></div>
                  <div><dt className="text-label-sm text-on-surface-variant">Bairro</dt><dd className="text-label-md font-normal">{resultadoCep.endereco?.bairro || 'Não informado pelo ViaCEP'}</dd></div>
                  <div><dt className="text-label-sm text-on-surface-variant">Cidade / Estado</dt><dd className="text-label-md font-normal">{[resultadoCep.endereco?.localidade, resultadoCep.endereco?.uf].filter(Boolean).join(' - ') || 'Não informados pelo ViaCEP'}</dd></div>
                  <div><dt className="text-label-sm text-on-surface-variant">CEP</dt><dd className="text-label-md font-normal">{formatarCep(cep)}</dd></div>
                </dl>}
          <p className="text-label-sm text-on-surface-variant">O endereço formatado poderá ser usado pela Landing Page. Deixe CEP e número vazios para remover o endereço salvo.</p>
          <div className="flex flex-wrap gap-3"><Button type="submit" disabled={enviando || resultadoCep?.carregando}>{enviando ? 'Salvando…' : 'Salvar endereço'}</Button><Button variant="secondary" disabled={enviando} onClick={() => { setEditarEndereco(false); setCep(''); setNumero(''); setResultadoCep(null); setErro('') }}>Cancelar</Button></div>
        </form> : <>
          <p className="whitespace-pre-line text-body-md">{endereco || 'Endereço ainda não informado.'}</p>
          <Button variant="secondary" size="compact" className="mt-5 w-full" onClick={() => setEditarEndereco(true)}>Editar endereço</Button>
        </>}
      </Cartao>}
    </div>
  </div>
}
