// Teste integrado com PostgreSQL real. Tudo que o teste grava é revertido ao sair.
// --navegador mantém o servidor aberto para conferir a tela com a conta fictícia.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { pool } = require('../src/config/db.ts');
const { protegerSenha } = require('../src/utils/senha.ts');

(async () => {
  const conexao = await pool.connect();
  const consulta = conexao.query.bind(conexao);
  await consulta('BEGIN');
  let indice = 0;
  let fila = Promise.resolve();
  const transacoes = [];
  function query(sql, valores) {
    const trabalho = fila.then(() => consultar(sql, valores));
    fila = trabalho.catch(() => {});
    return trabalho;
  }
  async function consultar(sql, valores) {
    const comando = typeof sql === 'string' ? sql.trim().toUpperCase() : '';
    if (comando === 'BEGIN') {
      const nome = `operacao_${++indice}`; transacoes.push(nome); return consulta(`SAVEPOINT ${nome}`);
    }
    if (comando === 'COMMIT') return consulta(`RELEASE SAVEPOINT ${transacoes.pop()}`);
    if (comando === 'ROLLBACK') return consulta(`ROLLBACK TO SAVEPOINT ${transacoes.pop()}`);
    const nome = `consulta_${++indice}`;
    await consulta(`SAVEPOINT ${nome}`);
    try { const r = await consulta(sql, valores); await consulta(`RELEASE SAVEPOINT ${nome}`); return r; }
    catch (error) { await consulta(`ROLLBACK TO SAVEPOINT ${nome}`); await consulta(`RELEASE SAVEPOINT ${nome}`); throw error; }
  }
  pool.query = (sql, valores, callback) => {
    if (typeof valores === 'function') { callback = valores; valores = undefined; }
    const promessa = query(sql, valores);
    if (callback) { promessa.then(r => callback(null, r), e => callback(e)); return; }
    return promessa;
  };
  pool.connect = async () => ({ query, release() {} });
  const navegador = process.argv.includes('--navegador');
  if (navegador) process.env.APP_ORIGIN = 'http://localhost:5174';
  const { app } = require('../server.ts');
  const { armazenarSessoes } = require('../src/config/sessao.ts');
  const servidor = app.listen(navegador ? 3334 : 0, '127.0.0.1');
  await new Promise(resolve => servidor.once('listening', resolve));
  const base = `http://localhost:${servidor.address().port}/api/v1`;
  let cookie = '', token = '';
  let verificacoes = 0;
  async function pedir(caminho, metodo = 'GET', dados, status = 200, csrf = true) {
    const r = await fetch(`${base}${caminho}`, {
      method: metodo, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(csrf ? { 'X-CSRF-Token': token } : {}) },
      ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
    });
    const recebido = r.headers.get('set-cookie');
    if (recebido) cookie = recebido.split(';')[0];
    const corpo = r.status === 204 ? null : await r.json();
    assert.equal(r.status, status, `${metodo} ${caminho}: ${JSON.stringify(corpo)}`);
    verificacoes++;
    return corpo;
  }
  async function encerrar() {
    await new Promise(resolve => servidor.close(resolve));
    armazenarSessoes.close(); await consulta('ROLLBACK'); conexao.release(); await pool.end();
  }
  try {
    await pedir('/produtos', 'GET', undefined, 401);
    await pedir('/fornecedores', 'GET', undefined, 401);
    const usuario = `qa_estoque_${randomBytes(5).toString('hex')}`;
    const senha = 'TesteEstoque-Ficticio-2026';
    const pessoal = (await consulta("SELECT column_name FROM information_schema.columns WHERE table_schema='sapataria' AND table_name='funcionarios' AND column_name='cpf'")).rowCount;
    await consulta(`INSERT INTO sapataria.funcionarios (nome, usuario, email, senha_protegida, perfil${pessoal ? ', cpf, telefone' : ''}) VALUES ($1,$2,$3,$4,$5${pessoal ? ", '52998224725', '11999999999'" : ''})`,
      ['Teste Estoque', usuario, 'estoque@example.invalid', await protegerSenha(senha), 'funcionario']);
    token = (await pedir('/auth/csrf')).csrfToken;
    token = (await pedir('/auth/login', 'POST', { usuario, senha })).csrfToken;
    await pedir('/fornecedores', 'POST', { nome: 'Fornecedor fictício' }, 403, false);
    const f1 = (await pedir('/fornecedores', 'POST', { nome: 'Fornecedor fictício A' }, 201)).dados;
    const f2 = (await pedir('/fornecedores', 'POST', { nome: 'Fornecedor fictício B' }, 201)).dados;
    await pedir(`/fornecedores/${f1.id}`, 'PUT', { nome: 'Fornecedor A editado' });
    await pedir('/fornecedores', 'POST', { nome: ' ' }, 400);
    const p = (await pedir('/produtos', 'POST', { nome: 'Palmilha fictícia QA', categoria: 'Palmilhas', preco_custo: '10.00', preco_venda: '15.00' }, 201)).dados;
    assert.equal(p.quantidade, '0');
    const m = (await pedir('/materiais', 'POST', { nome: 'Cola fictícia QA', categoria: 'Colas', unidade: 'L', quantidade_minima: '1', custo: '12.00' }, 201)).dados;
    await pedir(`/fornecedores/vinculos/produtos/${p.id}`, 'PUT', { fornecedores_ids: [f1.id, f2.id] }, 204);
    await pedir(`/fornecedores/vinculos/materiais/${m.id}`, 'PUT', { fornecedores_ids: [f1.id] }, 204);
    await pedir(`/fornecedores/vinculos/produtos/${p.id}`, 'PUT', { fornecedores_ids: [f1.id, f1.id] }, 400);
    await pedir(`/fornecedores/vinculos/produtos/${p.id}`, 'PUT', { fornecedores_ids: [2147483647] }, 400);
    const vinculos = (await pedir('/fornecedores/vinculos/produtos')).dados.filter(v => v.item_id === p.id);
    assert.equal(vinculos.length, 2);
    await pedir(`/fornecedores/${f1.id}`, 'DELETE', undefined, 409);
    await pedir('/movimentacoes-estoque', 'POST', { tipo: 'entrada', produto_id: p.id, quantidade: '3', motivo: 'Reposição fictícia' }, 201);
    await pedir('/movimentacoes-estoque', 'POST', { tipo: 'entrada', material_id: m.id, quantidade: '0.5', motivo: 'Reposição fictícia' }, 201);
    await pedir('/movimentacoes-estoque', 'POST', { tipo: 'entrada', produto_id: p.id, quantidade: '0.5', motivo: 'Inválido' }, 400);
    await pedir('/movimentacoes-estoque', 'POST', { tipo: 'saida', produto_id: p.id, quantidade: '4', motivo: 'Saldo insuficiente' }, 409);
    await pedir('/movimentacoes-estoque', 'POST', { tipo: 'saida', produto_id: p.id, quantidade: '1', motivo: 'Avaria fictícia' }, 201);
    await pedir(`/produtos/${p.id}`, 'PUT', { nome: p.nome, categoria: p.categoria, preco_custo: '12.00', preco_venda: '18.00' });
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.quantidade, '2');
    await pedir(`/produtos/${p.id}`, 'DELETE', undefined, 409);
    await pedir(`/materiais/${m.id}`, 'DELETE', undefined, 409);
    const vazio = (await pedir('/produtos', 'POST', { nome: 'Item vazio fictício', categoria: 'Teste', preco_custo: '0', preco_venda: '0' }, 201)).dados;
    await pedir(`/produtos/${vazio.id}`, 'DELETE', undefined, 204);
    await pedir(`/produtos/${vazio.id}`, 'GET', undefined, 404);
    await pedir(`/fornecedores/vinculos/produtos/${p.id}`, 'PUT', { fornecedores_ids: [f1.id] }, 204);
    await pedir(`/fornecedores/${f2.id}`, 'DELETE', undefined, 204);
    const { lucroProduto } = require('../../frontend/src/utils/estoque.ts');
    assert.deepEqual(lucroProduto('10.00', '15.00'), { valor: 5, percentual: 50 });
    assert.deepEqual(lucroProduto('0', '15'), { valor: 15, percentual: null });
    assert.deepEqual(lucroProduto('10', '8'), { valor: -2, percentual: -20 });
    assert.deepEqual(lucroProduto('12', '14'), { valor: 2, percentual: 16.67 });
    console.log(`PASSOU: ${verificacoes} verificações HTTP + cálculos de lucro; dados em transação com rollback.`);
    if (navegador) {
      console.log(`QA_NAVEGADOR usuario=${usuario} senha=${senha}; servidor http://localhost:3334; Ctrl+C reverte tudo.`);
      await new Promise(resolve => {
        process.once('SIGINT', resolve); process.once('SIGTERM', resolve);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', mensagem => { if (mensagem.trim() === 'encerrar') resolve(); });
      });
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await encerrar(); console.log('ROLLBACK_CONCLUIDO'); }
})();
