import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from './Button'
import InputField from './InputField'
import SelectField from './SelectField'
import ConfirmarSenhaDialog from './ConfirmarSenhaDialog'
import { ErroApi, ResultadoIncerto } from '../services/api'
import { atualizarFuncionario, cadastrarFuncionario } from '../services/funcionarios'
import type { DadosPessoaisFuncionario, Funcionario } from '../services/funcionarios'
import { cpfValido, digitos, formatarCpf, formatarTelefone } from '../utils/clientes'

type Props = { inicial?: Funcionario; destino: string; onSalvo: () => void }

export default function FormularioFuncionario({ inicial, destino, onSalvo }: Props) {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState(inicial?.cpf ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [pendentes, setPendentes] = useState<DadosPessoaisFuncionario | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [incerto, setIncerto] = useState(false)
  const envioEmCurso = useRef(false)

  function redirecionar(error: unknown) {
    if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
    else if (error instanceof ErroApi && error.codigo === 'ACESSO_NEGADO') navigate('/dashboard', { replace: true })
  }

  async function salvar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEmCurso.current || incerto || pendentes) return
    const form = event.currentTarget
    const campos = new FormData(form)
    const nome = String(campos.get('nome') ?? '').trim()
    const email = String(campos.get('email') ?? '').trim()
    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErro('Preencha nome e um e-mail válido.'); return }
    if (!cpfValido(cpf)) { setErro('Informe um CPF válido.'); return }
    if (!/^\d{11}$/.test(telefone)) { setErro('Informe um telefone com 11 números.'); return }
    const pessoais = { nome, email, cpf, telefone }
    setErro('')
    if (inicial) { setPendentes(pessoais); return }
    const usuario = String(campos.get('usuario') ?? '').trim()
    const senha = String(campos.get('senha') ?? '')
    const confirmacao = String(campos.get('confirmacao') ?? '')
    const perfil = campos.get('perfil')
    if (!usuario) { setErro('Preencha o usuário de login.'); return }
    if ([...senha].length < 15 || [...senha].length > 128) { setErro('A senha deve conter entre 15 e 128 caracteres.'); return }
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return }
    if (perfil !== 'administrador' && perfil !== 'funcionario') { setErro('Selecione o perfil de acesso.'); return }
    envioEmCurso.current = true
    setEnviando(true)
    try {
      await cadastrarFuncionario({ ...pessoais, usuario, senha, perfil })
      form.reset()
      onSalvo()
    } catch (error) {
      redirecionar(error)
      setErro(error instanceof Error ? error.message : 'Não foi possível cadastrar o funcionário.')
      if (error instanceof ResultadoIncerto) {
        setIncerto(true)
        for (const campo of form.querySelectorAll<HTMLInputElement>('input[type="password"]')) campo.value = ''
      }
    } finally { envioEmCurso.current = false; setEnviando(false) }
  }

  async function confirmarEdicao(senha: string) {
    if (!inicial || !pendentes) return
    try {
      await atualizarFuncionario(inicial.id, pendentes, senha)
      onSalvo()
    } catch (error) { redirecionar(error); throw error }
  }

  return <>
    <form onSubmit={salvar} aria-busy={enviando} aria-describedby={erro ? 'erro-funcionario' : undefined} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-8">
      <p className="mb-6 text-label-sm text-on-surface-variant">Todos os campos são obrigatórios.{!inicial && ' A conta será criada ativa.'}</p>
      {inicial && (!inicial.cpf || !inicial.telefone) && <p className="mb-6 rounded-default bg-secondary-container p-4">Complete CPF e telefone para atualizar este cadastro antigo.</p>}
      <fieldset disabled={enviando || incerto || !!pendentes} className="space-y-6">
        <legend className="sr-only">Dados do funcionário</legend>
        <InputField id="nome" name="nome" label="Nome completo" autoComplete="name" defaultValue={inicial?.nome} required />
        <div className="grid gap-6 sm:grid-cols-2">
          <InputField id="cpf" name="cpf" label="CPF" inputMode="numeric" value={formatarCpf(cpf)} onChange={e => setCpf(digitos(e.target.value, 11))} maxLength={14} required />
          <InputField id="telefone" name="telefone" label="Telefone" type="tel" autoComplete="tel" inputMode="numeric" value={formatarTelefone(telefone)} onChange={e => setTelefone(digitos(e.target.value, 11))} maxLength={15} required />
        </div>
        <InputField id="email" name="email" label="E-mail de contato" type="email" autoComplete="email" defaultValue={inicial?.email} required />
        {!inicial && <>
          <InputField id="usuario" name="usuario" label="Usuário de login" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
          <SelectField id="perfil" name="perfil" label="Perfil de acesso" defaultValue="" required><option value="" disabled>Selecione o perfil</option><option value="funcionario">Funcionário</option><option value="administrador">Administrador</option></SelectField>
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField id="senha" name="senha" label="Senha" type="password" autoComplete="new-password" aria-describedby="orientacao-senha" required />
            <InputField id="confirmacao" name="confirmacao" label="Confirmar senha" type="password" autoComplete="new-password" required />
          </div>
          <p id="orientacao-senha" className="text-label-sm text-on-surface-variant">Use de 15 a 128 caracteres. A senha não será exibida na listagem.</p>
        </>}
      </fieldset>
      {erro && <p id="erro-funcionario" role="alert" className="mt-6 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-outline-variant/50 pt-6">
        {!enviando && <Link to={destino} className="px-4 py-3 text-label-md text-primary hover:underline">{incerto ? 'Consultar lista antes de tentar novamente' : 'Cancelar'}</Link>}
        <Button type="submit" disabled={enviando || incerto || !!pendentes}>{enviando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Salvar funcionário'}</Button>
      </div>
    </form>
    {pendentes && <ConfirmarSenhaDialog titulo="Confirmar edição" descricao={<p>Confirme com sua senha de Administrador para salvar os dados de <strong>{pendentes.nome}</strong>.</p>} acao="Confirmar edição" variante="primary" textoRevisar="Fechar e conferir perfil" onConfirmar={confirmarEdicao} onCancelar={() => setPendentes(null)} onRevisar={() => navigate(destino, { replace: true })} />}
  </>
}
