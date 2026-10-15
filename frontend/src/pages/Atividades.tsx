import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/Button'
import { ErroApi } from '../services/api'
import type { Usuario } from '../services/auth'
import { listarAtividades } from '../services/atividades'
import type { Atividade } from '../services/atividades'
import { listarFuncionarios } from '../services/funcionarios'
import type { Funcionario } from '../services/funcionarios'

const nomes: Record<string, string> = {
  'ordem_servico.criada': 'criou a ordem de serviço', 'ordem_servico.atualizada': 'editou a ordem de serviço',
  'ordem_servico.status_alterado': 'alterou o status da ordem', 'ordem_servico.cancelada': 'cancelou a ordem de serviço',
  'ordem_servico.material_utilizado': 'registrou material utilizado na OS', 'ordem_servico.material_devolvido': 'registrou devolução de material da OS',
  'cliente.criado': 'cadastrou um cliente', 'cliente.atualizado': 'editou um cliente', 'cliente.excluido': 'excluiu um cliente',
  'funcionario.criado': 'cadastrou um funcionário', 'funcionario.dados_atualizados': 'editou os dados de um funcionário',
  'funcionario.acesso_alterado': 'alterou o perfil ou acesso de um funcionário', 'funcionario.desativado': 'desativou um funcionário',
  'material.criado': 'cadastrou um material', 'material.atualizado': 'editou um material', 'material.excluido': 'excluiu um material',
  'produto.criado': 'cadastrou um produto', 'produto.atualizado': 'editou um produto', 'produto.excluido': 'excluiu um produto',
  'fornecedor.criado': 'cadastrou um fornecedor', 'fornecedor.atualizado': 'editou um fornecedor', 'fornecedor.excluido': 'excluiu um fornecedor',
  'fornecedor.vinculos_atualizados': 'alterou fornecedores vinculados', 'estoque.entrada': 'registrou uma entrada no estoque',
  'estoque.saida': 'registrou uma saída no estoque', 'estoque.movimento_estornado': 'estornou uma movimentação de estoque',
  'venda.criada': 'registrou uma venda', 'venda.cancelada': 'cancelou uma venda', 'acesso.login': 'entrou no sistema', 'acesso.logout': 'saiu do sistema',
}
const nomesCampos: Record<string, string> = {
  cliente_id: 'cliente', responsavel_id: 'responsável', descricao_calcado: 'descrição do calçado', servico: 'serviço',
  valor: 'valor', prazo_entrega: 'prazo', forma_pagamento: 'forma de pagamento', observacoes: 'observações',
}

function dataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

export default function Atividades() {
  const usuario = useOutletContext<Usuario>()
  const navigate = useNavigate()
  const [lista, setLista] = useState<Atividade[] | null>(null)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [acao, setAcao] = useState('')
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    Promise.all([
      listarAtividades({ de: de || undefined, ate: ate || undefined, funcionario_id: funcionarioId ? Number(funcionarioId) : undefined, acao: acao || undefined }),
      usuario.perfil === 'administrador' ? listarFuncionarios() : Promise.resolve([] as Funcionario[]),
    ]).then(([eventos, equipe]) => {
      if (ativo) { setLista(eventos); setFuncionarios(equipe); setErro('') }
    }).catch((error: unknown) => {
      if (!ativo) return
      if (error instanceof ErroApi && error.status === 401) navigate('/login', { replace: true })
      else setErro(error instanceof Error ? error.message : 'Não foi possível carregar as atividades.')
    })
    return () => { ativo = false }
  }, [de, ate, funcionarioId, acao, usuario.perfil, navigate, tentativa])

  return <div className="mx-auto max-w-container-max space-y-6">
    <header><h1 className="text-headline-lg-mobile md:text-headline-lg">Registro de atividades</h1><p className="mt-2 text-on-surface-variant">Ações realizadas no sistema, com data, hora e responsável.</p></header>
    <section aria-label="Filtros de atividades" className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-label-sm">De<input type="date" value={de} onChange={event => setDe(event.target.value)} className="mt-1 block w-full rounded-default border border-outline-variant bg-surface p-3 text-body-md" /></label>
      <label className="text-label-sm">Até<input type="date" value={ate} onChange={event => setAte(event.target.value)} className="mt-1 block w-full rounded-default border border-outline-variant bg-surface p-3 text-body-md" /></label>
      <label className="text-label-sm">Tipo de atividade<select value={acao} onChange={event => setAcao(event.target.value)} className="mt-1 block w-full rounded-default border border-outline-variant bg-surface p-3 text-body-md"><option value="">Todas</option><option value="ordem_servico">Ordens de serviço</option><option value="acesso">Acessos</option><option value="cliente">Clientes</option><option value="funcionario">Funcionários</option><option value="material">Materiais</option><option value="produto">Produtos</option><option value="fornecedor">Fornecedores</option><option value="estoque">Movimentações de estoque</option><option value="venda">Vendas</option></select></label>
      {usuario.perfil === 'administrador' && <label className="text-label-sm">Funcionário<select value={funcionarioId} onChange={event => setFuncionarioId(event.target.value)} className="mt-1 block w-full rounded-default border border-outline-variant bg-surface p-3 text-body-md"><option value="">Todos</option>{funcionarios.map(pessoa => <option key={pessoa.id} value={pessoa.id}>{pessoa.nome}</option>)}</select></label>}
    </section>
    {erro ? <div className="space-y-3 rounded-xl bg-error-container p-5 text-on-error-container"><p role="alert">{erro}</p><Button onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</Button></div>
      : !lista ? <p role="status">Carregando atividades…</p>
      : lista.length === 0 ? <p className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">Nenhuma atividade encontrada para esses filtros.</p>
      : <ol aria-label="Atividades recentes" className="space-y-3">{lista.map(item => <li key={item.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5"><div className="flex flex-wrap items-start justify-between gap-2"><p><strong>{item.ator_nome}</strong> {nomes[item.acao] ?? 'realizou uma ação'}{item.entidade_id !== null && <> · {item.entidade_tipo === 'ordem_servico' ? <Link className="text-primary hover:underline" to={`/ordens-servico/${item.entidade_id}`}>OS #{item.entidade_id}</Link> : <span>{item.entidade_tipo.replaceAll('_', ' ')} #{item.entidade_id}</span>}</>}</p><time className="text-label-sm text-on-surface-variant" dateTime={item.criado_em}>{dataHora(item.criado_em)}</time></div>{typeof item.detalhes.statusAnterior === 'string' && typeof item.detalhes.statusNovo === 'string' && <p className="mt-2 text-label-sm text-on-surface-variant">Status: {item.detalhes.statusAnterior} → {item.detalhes.statusNovo}</p>}{Array.isArray(item.detalhes.camposAlterados) && item.detalhes.camposAlterados.length > 0 && <p className="mt-2 text-label-sm text-on-surface-variant">Campos alterados: {item.detalhes.camposAlterados.filter((campo): campo is string => typeof campo === 'string').map(campo => nomesCampos[campo] ?? campo).join(', ')}</p>}{typeof item.detalhes.quantidade === 'string' && <p className="mt-2 text-label-sm text-on-surface-variant">Quantidade: {item.detalhes.quantidade}</p>}</li>)}</ol>}
    {lista && lista.length === 250 && <p className="text-center text-label-sm text-on-surface-variant">Exibindo até 250 atividades. Use os filtros para encontrar registros anteriores.</p>}
  </div>
}
