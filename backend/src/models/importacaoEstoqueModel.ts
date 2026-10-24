import { pool } from '../config/db';
import { emTransacao } from '../config/transacao';
import { ErroHttp } from '../utils/validacao';
import { movimentar } from './estoqueModel';

export type LinhaImportacao =
  | {
      tipo: 'material';
      nome: string;
      categoria: string;
      unidade: string;
      quantidade: string;
      quantidade_minima: string;
      custo: string;
    }
  | {
      tipo: 'produto';
      nome: string;
      categoria: string;
      quantidade: string;
      quantidade_minima: string;
      preco_custo: string;
      preco_venda: string;
    };

export async function importar(linhas: LinhaImportacao[]) {
  return emTransacao(async (conexao) => {
    const vistos = new Set<string>();
    for (const [indice, linha] of linhas.entries()) {
      const chave = `${linha.tipo}:${linha.nome.trim().toLocaleLowerCase('pt-BR')}:${linha.categoria.trim().toLocaleLowerCase('pt-BR')}`;
      if (vistos.has(chave))
        throw new ErroHttp(
          400,
          'IMPORTACAO_DUPLICADA',
          `A linha ${indice + 2} repete um item do arquivo.`,
        );
      vistos.add(chave);
      const duplicado = await conexao.query(
        `SELECT id FROM sapataria.${linha.tipo === 'material' ? 'materiais' : 'produtos'}
         WHERE lower(trim(nome))=lower(trim($1)) AND lower(trim(categoria))=lower(trim($2)) LIMIT 1`,
        [linha.nome, linha.categoria],
      );
      if (duplicado.rowCount)
        throw new ErroHttp(
          409,
          'IMPORTACAO_DUPLICADA',
          `Já existe um item com o nome e a categoria da linha ${indice + 2}.`,
        );
    }

    const criados: Array<{
      id: number;
      tipo: 'material' | 'produto';
      nome: string;
      quantidade: string;
    }> = [];
    for (const linha of linhas) {
      let id: number;
      if (linha.tipo === 'material') {
        const resultado = await conexao.query(
          `INSERT INTO sapataria.materiais (nome,categoria,unidade,quantidade_minima,custo)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [
            linha.nome,
            linha.categoria,
            linha.unidade,
            linha.quantidade_minima,
            linha.custo,
          ],
        );
        id = resultado.rows[0].id;
        if (linha.quantidade !== '0')
          await movimentar(conexao, {
            tipo: 'entrada',
            material_id: id,
            produto_id: null,
            quantidade: linha.quantidade,
            motivo: 'Saldo inicial por importação CSV',
          });
      } else {
        const resultado = await conexao.query(
          `INSERT INTO sapataria.produtos (nome,categoria,quantidade_minima,preco_custo,preco_venda)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [
            linha.nome,
            linha.categoria,
            linha.quantidade_minima,
            linha.preco_custo,
            linha.preco_venda,
          ],
        );
        id = resultado.rows[0].id;
        if (linha.quantidade !== '0')
          await movimentar(conexao, {
            tipo: 'entrada',
            material_id: null,
            produto_id: id,
            quantidade: linha.quantidade,
            motivo: 'Saldo inicial por importação CSV',
          });
      }
      criados.push({
        id,
        tipo: linha.tipo,
        nome: linha.nome,
        quantidade: linha.quantidade,
      });
    }
    return criados;
  });
}
