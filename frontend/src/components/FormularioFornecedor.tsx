import { useState } from 'react'
import type { FormEvent } from 'react'
import InputField from './InputField'
import Button from './Button'
import EnderecoPorCep from './EnderecoPorCep'
import { digitos, formatarCep } from '../utils/clientes'
import {
  limparCnpj,
  formatarCnpj,
  cnpjValido,
  formatarTelefoneFornecedor,
} from '../utils/fornecedores'
import type { DadosFornecedor, Fornecedor } from '../services/estoque'

export default function FormularioFornecedor({
  inicial,
  bloqueado,
  ocupado,
  onSalvar,
  onCancelar,
}: {
  inicial?: Fornecedor
  bloqueado: boolean
  ocupado: boolean
  onSalvar: (dados: DadosFornecedor) => void
  onCancelar: () => void
}) {
  const [dados, setDados] = useState({
    nome: inicial?.nome ?? '',
    cnpj: inicial?.cnpj ?? '',
    razao_social: inicial?.razao_social ?? '',
    nome_fantasia: inicial?.nome_fantasia ?? '',
    cep: inicial?.cep ?? '',
    numero: inicial?.numero ?? '',
    email: inicial?.email ?? '',
    telefone: inicial?.telefone ?? '',
    prazo_pagamento: inicial?.prazo_pagamento ?? '',
    meios_pagamento: inicial?.meios_pagamento ?? '',
    desconto: inicial?.desconto ?? '',
    moeda: inicial?.moeda ?? '',
  })
  const [erro, setErro] = useState('')
  const campo = (nome: keyof typeof dados, valor: string) => {
    setDados({ ...dados, [nome]: valor })
    setErro('')
  }
  function enviar(event: FormEvent) {
    event.preventDefault()
    if (bloqueado) return
    if (!dados.nome.trim()) {
      setErro('Informe o nome de exibição.')
      return
    }
    if (dados.cnpj && !cnpjValido(dados.cnpj)) {
      setErro('Informe um CNPJ com formato e dígitos verificadores válidos.')
      return
    }
    if (dados.cep && dados.cep.length !== 8) {
      setErro('Informe um CEP com 8 números.')
      return
    }
    if (dados.telefone && !/^\d{10,11}$/.test(dados.telefone)) {
      setErro('Informe telefone com DDD e 10 ou 11 números.')
      return
    }
    if (
      dados.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())
    ) {
      setErro('Informe um e-mail em formato válido.')
      return
    }
    onSalvar({
      nome: dados.nome.trim(),
      cnpj: dados.cnpj || null,
      razao_social: dados.razao_social.trim() || null,
      nome_fantasia: dados.nome_fantasia.trim() || null,
      cep: dados.cep || null,
      numero: dados.numero.trim() || null,
      email: dados.email.trim() || null,
      telefone: dados.telefone || null,
      prazo_pagamento: dados.prazo_pagamento.trim() || null,
      meios_pagamento: dados.meios_pagamento.trim() || null,
      desconto: dados.desconto.trim() || null,
      moeda: dados.moeda.trim() || null,
    })
  }
  return (
    <form onSubmit={enviar} className="mb-6 space-y-4" aria-busy={ocupado}>
      <p className="text-body-sm text-on-surface-variant">
        Somente o nome de exibição é obrigatório. Os demais dados são opcionais.
      </p>
      <fieldset disabled={bloqueado} className="space-y-4">
        <InputField
          id="fornecedor-nome"
          label="Nome de exibição"
          required
          value={dados.nome}
          onChange={(e) => campo('nome', e.target.value)}
        />
        <InputField
          id="fornecedor-cnpj"
          label="CNPJ (opcional)"
          autoCapitalize="characters"
          maxLength={18}
          value={formatarCnpj(dados.cnpj)}
          onChange={(e) => campo('cnpj', limparCnpj(e.target.value))}
        />
        <InputField
          id="fornecedor-razao"
          label="Razão social (opcional)"
          value={dados.razao_social}
          onChange={(e) => campo('razao_social', e.target.value)}
        />
        <InputField
          id="fornecedor-fantasia"
          label="Nome fantasia (opcional)"
          value={dados.nome_fantasia}
          onChange={(e) => campo('nome_fantasia', e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="fornecedor-email"
            label="E-mail (opcional)"
            type="email"
            value={dados.email}
            onChange={(e) => campo('email', e.target.value)}
          />
          <InputField
            id="fornecedor-telefone"
            label="Telefone com DDD (opcional)"
            type="tel"
            maxLength={15}
            value={formatarTelefoneFornecedor(dados.telefone)}
            onChange={(e) => campo('telefone', digitos(e.target.value, 11))}
          />
          <InputField
            id="fornecedor-cep"
            label="CEP (opcional)"
            inputMode="numeric"
            maxLength={9}
            value={formatarCep(dados.cep)}
            onChange={(e) => campo('cep', digitos(e.target.value, 8))}
          />
          <InputField
            id="fornecedor-numero"
            label="Número (opcional)"
            placeholder="Ex.: 123, 123A ou S/N"
            value={dados.numero}
            onChange={(e) => campo('numero', e.target.value)}
          />
        </div>
        {dados.cep && <EnderecoPorCep cep={dados.cep} numero={dados.numero} />}
        <p className="text-body-sm text-on-surface-variant">
          O cadastro salva CEP e número. A consulta de endereço pode falhar sem
          impedir o salvamento.
        </p>
        <fieldset className="space-y-4 border-t border-outline-variant pt-4">
          <legend className="px-2 text-label-md">
            Condições comerciais (opcional)
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              id="fornecedor-prazo"
              label="Prazo de pagamento (opcional)"
              placeholder="Ex.: à vista ou 30 dias"
              value={dados.prazo_pagamento}
              onChange={(e) => campo('prazo_pagamento', e.target.value)}
            />
            <InputField
              id="fornecedor-meios"
              label="Meios de pagamento (opcional)"
              placeholder="Ex.: Pix, boleto"
              value={dados.meios_pagamento}
              onChange={(e) => campo('meios_pagamento', e.target.value)}
            />
            <InputField
              id="fornecedor-desconto"
              label="Desconto (opcional)"
              placeholder="Ex.: 2% para pagamento à vista"
              value={dados.desconto}
              onChange={(e) => campo('desconto', e.target.value)}
            />
            <InputField
              id="fornecedor-moeda"
              label="Moeda (opcional)"
              placeholder="Ex.: BRL"
              value={dados.moeda}
              onChange={(e) => campo('moeda', e.target.value)}
            />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Estas informações registram o acordo com o fornecedor. Não alteram
            automaticamente preços, compras ou movimentações.
          </p>
        </fieldset>
        {erro && (
          <p
            role="alert"
            className="rounded-default bg-error-container p-4 text-on-error-container"
          >
            {erro}
          </p>
        )}
        <Button type="submit" disabled={bloqueado}>
          {ocupado
            ? 'Salvando…'
            : inicial
              ? 'Salvar edição'
              : 'Cadastrar fornecedor'}
        </Button>
      </fieldset>
      {inicial && (
        <Button variant="secondary" disabled={ocupado} onClick={onCancelar}>
          Cancelar edição
        </Button>
      )}
    </form>
  )
}
