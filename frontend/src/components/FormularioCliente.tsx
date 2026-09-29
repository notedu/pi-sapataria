import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EnderecoPorCep from './EnderecoPorCep'
import { cpfValido, digitos, formatarCpf, formatarCep, formatarTelefone } from '../utils/clientes'
import Button from './Button'
import InputField from './InputField'
import TextareaField from './TextareaField'
import { ErroApi, ResultadoIncerto } from '../services/api'
import type { Cliente, DadosCliente } from '../services/clientes'

type Props = {
  inicial?: Cliente
  onSalvar: (dados: DadosCliente) => Promise<Cliente>
  destino: string
  aoSalvar: () => void
}

// Cadastro e edição compartilham campos, máscaras e validação.
export default function FormularioCliente({ inicial, onSalvar, destino, aoSalvar }: Props) {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState(inicial?.cpf ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [cep, setCep] = useState(inicial?.cep ?? '')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [incerto, setIncerto] = useState(false)
  const envioEmCurso = useRef(false)

  async function salvar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEmCurso.current || incerto) return
    const formulario = event.currentTarget
    const campos = new FormData(formulario)
    const texto = (campo: string) => String(campos.get(campo) ?? '').trim()
    const nome = texto('nome'), numero = texto('numero')
    const email = texto('email'), observacoes = texto('observacoes')
    if (!nome || !numero) { setErro('Preencha nome e número do endereço.'); return }
    if (!cpfValido(cpf)) { setErro('Informe um CPF válido.'); return }
    if (telefone.length !== 11) { setErro('Informe um telefone com 11 números.'); return }
    if (cep.length !== 8) { setErro('Informe um CEP com 8 números.'); return }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErro('Informe um e-mail em formato válido ou deixe o campo vazio.'); return }

    envioEmCurso.current = true
    setEnviando(true)
    setErro('')
    try {
      // Opcionais vazios seguem como null. A API gera o id utilizado pela OS.
      await onSalvar({ nome, telefone, cpf, cep, numero, email: email || null, observacoes: observacoes || null })
      aoSalvar()
    } catch (error) {
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else {
        setErro(error instanceof ErroApi && error.status === 404 ? 'Cliente não encontrado. Volte à lista de clientes para conferir.' : error instanceof Error ? error.message : 'Não foi possível salvar o cliente.')
        if (error instanceof ResultadoIncerto) setIncerto(true)
      }
    } finally { envioEmCurso.current = false; setEnviando(false) }
  }

  return (
      <form onSubmit={salvar} aria-busy={enviando} aria-describedby={erro ? 'erro-cliente' : undefined} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-8">
        <p className="mb-6 text-label-sm text-on-surface-variant">Nome, CPF, telefone, CEP e número são obrigatórios.</p>
        {inicial && (!inicial.cpf || !inicial.cep || !inicial.numero) && <p className="mb-6 rounded-default bg-secondary-container p-4">Complete CPF, CEP e número para atualizar este cadastro antigo.{inicial.endereco && <span className="mt-2 block">Endereço anterior: {inicial.endereco}</span>}</p>}
        <fieldset disabled={enviando || incerto} className="space-y-6">
          <legend className="sr-only">Dados do cliente</legend>
          <InputField id="nome" name="nome" label="Nome completo" autoComplete="name" defaultValue={inicial?.nome} required />
          <InputField id="cpf" name="cpf" label="CPF" inputMode="numeric" value={formatarCpf(cpf)} onChange={event => setCpf(digitos(event.target.value, 11))} maxLength={14} required />
          <div className="grid gap-6 sm:grid-cols-2">
            <InputField id="telefone" name="telefone" label="Telefone" type="tel" autoComplete="tel" inputMode="numeric" value={formatarTelefone(telefone)} onChange={event => setTelefone(digitos(event.target.value, 11))} maxLength={15} required />
            <InputField id="email" name="email" label="E-mail (opcional)" type="email" autoComplete="email" defaultValue={inicial?.email ?? ''} />
          </div>
          <div className="border-t border-outline-variant/50 pt-6 space-y-6">
            <h2 className="text-body-lg font-semibold">Endereço</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField id="cep" name="cep" label="CEP" autoComplete="postal-code" inputMode="numeric" value={formatarCep(cep)} onChange={event => setCep(digitos(event.target.value, 8))} maxLength={9} required />
              <InputField id="numero" name="numero" label="Número" placeholder="Ex.: 123, 123A ou S/N" defaultValue={inicial?.numero ?? ''} required />
            </div>
            <EnderecoPorCep cep={cep} />
            <p className="text-label-md text-on-surface-variant">O endereço é consultado no ViaCEP. O cadastro salva o CEP e o número e pode ser concluído mesmo se a consulta estiver indisponível.</p>
          </div>
          <TextareaField id="observacoes" name="observacoes" label="Observações (opcional)" defaultValue={inicial?.observacoes ?? ''} />
        </fieldset>
        {erro && <p id="erro-cliente" role="alert" className="mt-6 rounded-default bg-error-container p-4 text-on-error-container">{erro}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-outline-variant/50 pt-6">
          {!enviando && <Link to={destino} className="rounded-default px-4 py-3 text-label-md text-primary underline-offset-4 hover:underline focus-visible:outline-2">{incerto ? 'Conferir dados antes de tentar novamente' : 'Cancelar'}</Link>}
          <Button type="submit" disabled={enviando || incerto}>{enviando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Salvar cliente'}</Button>
        </div>
      </form>
  )
}
