import type { RequestHandler } from 'express';
import { buscarAcesso } from '../models/funcionarioModel';
import { registrar, type NovaAtividade, type TipoEntidade } from '../models/atividadeModel';

type EventoRota = Pick<NovaAtividade, 'acao' | 'entidadeTipo' | 'notificarAdministradores' | 'mensagem'> & { entidadeId?: number; detalhes?: Record<string, unknown> };

function inteiro(texto: string | undefined): number | undefined {
  if (!texto || !/^\d+$/.test(texto)) return undefined;
  const numero = Number(texto);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : undefined;
}

function eventoDaRota(metodo: string, caminho: string, corpo: unknown): EventoRota | undefined {
  if (metodo === 'POST' && caminho === '/auth/login') return { acao: 'acesso.login', entidadeTipo: 'acesso' };
  if (metodo === 'POST' && caminho === '/auth/logout') return { acao: 'acesso.logout', entidadeTipo: 'acesso' };

  const partes = caminho.split('/').filter(Boolean);
  const [colecao, id, acao] = partes;
  let entidadeTipo: TipoEntidade | undefined;
  let evento: Omit<EventoRota, 'entidadeTipo' | 'entidadeId'> | undefined;

  if (colecao === 'clientes') {
    entidadeTipo = 'cliente';
    evento = metodo === 'POST' && partes.length === 1 ? { acao: 'cliente.criado' }
      : metodo === 'PUT' && partes.length === 2 ? { acao: 'cliente.atualizado' }
      : metodo === 'DELETE' && partes.length === 2 ? { acao: 'cliente.excluido' } : undefined;
  } else if (colecao === 'funcionarios') {
    entidadeTipo = 'funcionario';
    evento = metodo === 'POST' && partes.length === 1 ? { acao: 'funcionario.criado' }
      : metodo === 'PUT' && acao === 'acesso' ? { acao: 'funcionario.acesso_alterado' }
      : metodo === 'POST' && acao === 'desativar' ? { acao: 'funcionario.desativado' }
      : metodo === 'PUT' && partes.length === 2 ? { acao: 'funcionario.dados_atualizados' } : undefined;
  } else if (colecao === 'materiais' || colecao === 'produtos') {
    entidadeTipo = colecao === 'materiais' ? 'material' : 'produto';
    const rotulo = entidadeTipo;
    evento = metodo === 'POST' && partes.length === 1 ? { acao: `${rotulo}.criado` }
      : metodo === 'PUT' && partes.length === 2 ? { acao: `${rotulo}.atualizado` }
      : metodo === 'DELETE' && partes.length === 2 ? { acao: `${rotulo}.excluido` } : undefined;
  } else if (colecao === 'fornecedores') {
    if (id === 'vinculos' && metodo === 'PUT' && partes.length === 4) {
      const tipo = partes[2] === 'materiais' ? 'material' : 'produto';
      entidadeTipo = tipo;
      const ids = corpo && typeof corpo === 'object' && 'fornecedores_ids' in corpo && Array.isArray(corpo.fornecedores_ids) ? corpo.fornecedores_ids : [];
      evento = { acao: 'fornecedor.vinculos_atualizados', detalhes: { quantidadeFornecedores: ids.length } };
    } else {
      entidadeTipo = 'fornecedor';
      evento = metodo === 'POST' && partes.length === 1 ? { acao: 'fornecedor.criado' }
        : metodo === 'PUT' && partes.length === 2 ? { acao: 'fornecedor.atualizado' }
        : metodo === 'DELETE' && partes.length === 2 ? { acao: 'fornecedor.excluido' } : undefined;
    }
  } else if (colecao === 'movimentacoes-estoque') {
    entidadeTipo = 'estoque';
    if (metodo === 'POST' && partes.length === 1) {
      const dados = corpo && typeof corpo === 'object' ? corpo as Record<string, unknown> : {};
      evento = { acao: dados.tipo === 'entrada' ? 'estoque.entrada' : 'estoque.saida' };
    } else if (metodo === 'POST' && acao === 'estorno') evento = { acao: 'estoque.movimento_estornado' };
  } else if (colecao === 'vendas') {
    entidadeTipo = 'venda';
    evento = metodo === 'POST' && partes.length === 1 ? { acao: 'venda.criada' }
      : metodo === 'POST' && acao === 'cancelamento'
        ? { acao: 'venda.cancelada', notificarAdministradores: true, mensagem: `A venda #${id} foi cancelada.` } : undefined;
  }

  if (!evento || !entidadeTipo) return undefined;
  const entidadeId = inteiro(colecao === 'movimentacoes-estoque' && partes.length === 1 ? undefined : id);
  return { ...evento, entidadeTipo, entidadeId };
}

export const auditarRequisicoes: RequestHandler = async (request, response, next) => {
  const caminho = request.originalUrl.split('?')[0]!.replace(/^\/api\/v1/, '') || '/';
  const evento = eventoDaRota(request.method, caminho, request.body);
  if (!evento) return next();

  const sessaoId = request.session.autenticacao?.funcionarioId;
  let ator: { id: number; nome: string } | undefined = sessaoId
    ? await buscarAcesso(sessaoId).then(pessoa => pessoa && ({ id: pessoa.id, nome: pessoa.nome })).catch(() => undefined)
    : undefined;
  let corpoResposta: unknown;
  const jsonOriginal = response.json.bind(response);
  response.json = ((corpo: unknown) => {
    corpoResposta = corpo;
    return jsonOriginal(corpo);
  }) as typeof response.json;

  response.once('finish', () => {
    if (response.statusCode < 200 || response.statusCode >= 300) return;
    const dadosResposta = corpoResposta && typeof corpoResposta === 'object' && 'dados' in corpoResposta
      ? (corpoResposta as { dados?: unknown }).dados : undefined;
    if (evento.acao === 'acesso.login' && dadosResposta && typeof dadosResposta === 'object') {
      const dados = dadosResposta as { id?: unknown; nome?: unknown };
      if (Number.isInteger(dados.id) && typeof dados.nome === 'string') ator = { id: dados.id as number, nome: dados.nome };
    }
    if (!ator) return;

    const dados = dadosResposta && typeof dadosResposta === 'object' ? dadosResposta as Record<string, unknown> : {};
    const idResposta = inteiro(typeof dados.id === 'number' ? String(dados.id) : undefined);
    const idRota = evento.entidadeId;
    const entidadeId = evento.acao.startsWith('acesso.') ? ator.id : (idResposta ?? idRota);
    const detalhes: Record<string, unknown> = { ...(evento.detalhes ?? {}) };
    if (evento.acao === 'funcionario.acesso_alterado') {
      if (typeof dados.perfil === 'string') detalhes.perfil = dados.perfil;
      if (typeof dados.ativo === 'boolean') detalhes.ativo = dados.ativo;
    }
    if (evento.acao === 'estoque.entrada' || evento.acao === 'estoque.saida') {
      if (typeof dados.quantidade === 'string' || typeof dados.quantidade === 'number') detalhes.quantidade = String(dados.quantidade);
      if (Number.isInteger(dados.material_id)) { detalhes.tipoItem = 'material'; detalhes.itemId = dados.material_id; }
      if (Number.isInteger(dados.produto_id)) { detalhes.tipoItem = 'produto'; detalhes.itemId = dados.produto_id; }
    }
    if (evento.acao.startsWith('venda.') && (typeof dados.total === 'string' || typeof dados.total === 'number')) detalhes.total = String(dados.total);
    void registrar({
      atorId: ator.id, atorNome: ator.nome, acao: evento.acao, entidadeTipo: evento.entidadeTipo,
      entidadeId, detalhes, notificarAdministradores: evento.notificarAdministradores, mensagem: evento.mensagem,
    }).catch(() => console.error('Não foi possível gravar um evento de atividade.'));
  });
  next();
};
