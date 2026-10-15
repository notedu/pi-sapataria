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
    await pedir('/compras-estoque', 'GET', undefined, 401);
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
    await pedir('/produtos', 'POST', { nome: 'Produto sem mínimo', categoria: 'Teste', preco_custo: '10.00', preco_venda: '15.00' }, 400);
    const p = (await pedir('/produtos', 'POST', { nome: 'Palmilha fictícia QA', categoria: 'Palmilhas', quantidade_minima: '2', preco_custo: '10.00', preco_venda: '15.00' }, 201)).dados;
    assert.equal(p.quantidade, '0');
    assert.equal(p.quantidade_minima, '2');
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
    await pedir(`/produtos/${p.id}`, 'PUT', { nome: p.nome, categoria: p.categoria, quantidade_minima: '3', preco_custo: '12.00', preco_venda: '18.00' });
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.quantidade, '2');
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.quantidade_minima, '3');
    await pedir(`/produtos/${p.id}`, 'DELETE', undefined, 409);
    await pedir(`/materiais/${m.id}`, 'DELETE', undefined, 409);
    const vazio = (await pedir('/produtos', 'POST', { nome: 'Item vazio fictício', categoria: 'Teste', quantidade_minima: '0', preco_custo: '0', preco_venda: '0' }, 201)).dados;
    await pedir(`/produtos/${vazio.id}`, 'DELETE', undefined, 204);
    await pedir(`/produtos/${vazio.id}`, 'GET', undefined, 404);
    await pedir(`/fornecedores/vinculos/produtos/${p.id}`, 'PUT', { fornecedores_ids: [f1.id] }, 204);
    await pedir(`/fornecedores/${f2.id}`, 'DELETE', undefined, 204);
    // Dados opcionais e compatibilidade com os fornecedores cadastrados só pelo nome.
    const completo = { nome: 'Fornecedor completo fictício', cnpj: '12.ABC.345/01DE-35', razao_social: 'Fornecedor Teste Ltda.', nome_fantasia: 'Teste Estoque', cep: '01001-000', numero: '123A', email: 'fornecedor@example.invalid', telefone: '(11) 1234-5678', prazo_pagamento: '30 dias', meios_pagamento: 'Pix ou boleto', desconto: '2% à vista', moeda: 'BRL' };
    const f3 = (await pedir('/fornecedores', 'POST', completo, 201)).dados;
    assert.equal(f3.cnpj, '12ABC34501DE35'); assert.equal(f3.telefone, '1112345678'); assert.equal(f3.cep, '01001000');
    for (const campo of ['prazo_pagamento', 'meios_pagamento', 'desconto', 'moeda']) assert.equal(f3[campo], completo[campo]);
    await pedir(`/fornecedores/${f3.id}`, 'PUT', { nome: 'Fornecedor completo editado' });
    const preservado = (await pedir('/fornecedores')).dados.find(f => f.id === f3.id);
    assert.equal(preservado.razao_social, completo.razao_social); assert.equal(preservado.cnpj, f3.cnpj);
    for (const campo of ['prazo_pagamento', 'meios_pagamento', 'desconto', 'moeda']) assert.equal(preservado[campo], completo[campo]);
    await pedir(`/fornecedores/${f3.id}`, 'PUT', { nome: f3.nome, email: null });
    assert.equal((await pedir('/fornecedores')).dados.find(f => f.id === f3.id).email, null);
    await pedir(`/fornecedores/${f3.id}`, 'PUT', { nome: f3.nome, desconto: null });
    assert.equal((await pedir('/fornecedores')).dados.find(f => f.id === f3.id).desconto, null);
    await pedir(`/fornecedores/${f3.id}`, 'PUT', { nome: f3.nome, desconto: completo.desconto });
    await pedir('/fornecedores', 'POST', { nome: 'Condição inválida', prazo_pagamento: 30 }, 400);
    for (const invalido of [{ cnpj: '12ABC34501DE00' }, { cnpj: '00000000000000' }, { cep: '123' }, { telefone: '123' }, { email: 'invalido' }]) {
      await pedir('/fornecedores', 'POST', { nome: 'Fornecedor inválido fictício', ...invalido }, 400);
    }
    const legacy = (await pedir('/fornecedores')).dados.find(f => f.id === f1.id);
    assert.equal(legacy.cnpj, null); assert.equal(legacy.email, null);
    assert.equal(legacy.prazo_pagamento, null); assert.equal(legacy.moeda, null);
    // Cadastro + associações formam uma única transação, inclusive na edição.
    for (const tipo of ['produtos', 'materiais']) {
      const baseItem = tipo === 'produtos'
        ? { nome: 'Produto associação fictício', categoria: 'Categoria livre', quantidade_minima: '2', preco_custo: '10', preco_venda: '15' }
        : { nome: 'Material associação fictício', categoria: 'Cola', unidade: 'kg', quantidade_minima: '1', custo: '12' };
      const item = (await pedir(`/${tipo}`, 'POST', { ...baseItem, fornecedores_ids: [f1.id, f3.id] }, 201)).dados;
      assert.equal((await pedir(`/fornecedores/vinculos/${tipo}`)).dados.filter(v => v.item_id === item.id).length, 2);
      const antes = (await pedir(`/${tipo}`)).dados.length;
      await pedir(`/${tipo}`, 'POST', { ...baseItem, fornecedores_ids: [f1.id, 2147483647] }, 400);
      assert.equal((await pedir(`/${tipo}`)).dados.length, antes);
      await pedir(`/${tipo}`, 'POST', { ...baseItem, fornecedores_ids: [f1.id, f1.id] }, 400);
      await pedir(`/${tipo}`, 'POST', { ...baseItem, fornecedores_ids: null }, 400);
      await pedir(`/${tipo}/${item.id}`, 'PUT', { ...baseItem, nome: 'Não deve persistir', fornecedores_ids: [2147483647] }, 400);
      assert.equal((await pedir(`/${tipo}/${item.id}`)).dados.nome, baseItem.nome);
      assert.equal((await pedir(`/fornecedores/vinculos/${tipo}`)).dados.filter(v => v.item_id === item.id).length, 2);
      await pedir(`/${tipo}/${item.id}`, 'PUT', baseItem);
      assert.equal((await pedir(`/fornecedores/vinculos/${tipo}`)).dados.filter(v => v.item_id === item.id).length, 2);
      await pedir(`/${tipo}/${item.id}`, 'PUT', { ...baseItem, fornecedores_ids: [] });
      assert.equal((await pedir(`/fornecedores/vinculos/${tipo}`)).dados.filter(v => v.item_id === item.id).length, 0);
      if (tipo === 'materiais') {
        assert.equal(item.unidade_bloqueada, false);
        await pedir(`/materiais/${item.id}`, 'PUT', { ...baseItem, unidade: 'g' });
        await pedir('/movimentacoes-estoque', 'POST', { tipo: 'entrada', material_id: item.id, quantidade: '2', motivo: 'Teste de unidade' }, 201);
        assert.equal((await pedir(`/materiais/${item.id}`)).dados.unidade_bloqueada, true);
        await pedir(`/materiais/${item.id}`, 'PUT', { ...baseItem, unidade: 'kg' }, 409);
        await pedir('/movimentacoes-estoque', 'POST', { tipo: 'saida', material_id: item.id, quantidade: '2', motivo: 'Teste com histórico e saldo zero' }, 201);
        await pedir(`/materiais/${item.id}`, 'PUT', { ...baseItem, unidade: 'kg' }, 409);
        const saldoZero = (await pedir(`/materiais/${item.id}`)).dados;
        assert.equal(saldoZero.quantidade, '0'); assert.equal(saldoZero.unidade_bloqueada, true); assert.equal(saldoZero.unidade, 'g');
        // Regressão relatada: saída total não remove o Material nem o histórico.
        assert.equal((await pedir('/materiais')).dados.find(i => i.id === item.id).quantidade, '0');
        const historico = (await pedir(`/movimentacoes-estoque?material_id=${item.id}`)).dados;
        assert.equal(historico.length, 2); assert.ok(historico.every(h => h.material_id === item.id));
        assert.deepEqual(historico.map(h => h.tipo), ['saida', 'entrada']);
        assert.equal(historico[0].motivo, 'Teste com histórico e saldo zero');
        await assert.rejects(pool.query('UPDATE sapataria.materiais SET unidade = $1 WHERE id = $2', ['kg', item.id]), e => e.code === '23514' && e.constraint === 'materiais_unidade_com_historico');
        await pedir(`/materiais/${item.id}`, 'PUT', { ...baseItem, unidade: 'g', nome: 'Material histórico editado' });
      }
    }
    const historicoProduto = (await pedir(`/movimentacoes-estoque?produto_id=${p.id}`)).dados;
    assert.ok(historicoProduto.length >= 2 && historicoProduto.every(h => h.produto_id === p.id));

    const saldoAntesCompra = (await pedir(`/produtos/${p.id}`)).dados.quantidade;
    const compra = (await pedir('/compras-estoque', 'POST', { fornecedor_id: f1.id, itens: [
      { material_id: null, produto_id: p.id, quantidade: '2', preco_unitario: '9.50' },
      { material_id: m.id, produto_id: null, quantidade: '0.25', preco_unitario: '4.25' },
    ] }, 201)).dados;
    assert.equal(compra.fornecedor_id, f1.id); assert.equal(compra.itens.length, 2);
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.quantidade, String(Number(saldoAntesCompra) + 2));
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.preco_custo, '12.00');
    const movimentoCompra = (await pedir(`/movimentacoes-estoque?produto_id=${p.id}`)).dados.find(h => h.item_compra_id !== null);
    assert.ok(movimentoCompra); assert.equal(movimentoCompra.tipo, 'entrada');
    await assert.rejects(pool.query(
      `INSERT INTO sapataria.movimentacoes_estoque (tipo,material_id,produto_id,quantidade,motivo,item_compra_id)
       VALUES ('entrada',$1,NULL,'1','Origem incompatível',$2)`,
      [m.id, compra.itens.find(i => i.produto_id === p.id).id],
    ), e => e.code === '23514' && e.constraint === 'movimentos_compra_item_compativel');
    assert.ok((await pedir('/compras-estoque')).dados.some(c => c.id === compra.id));
    const saldoAnteriorCompraInvalida = (await pedir(`/produtos/${p.id}`)).dados.quantidade;
    await pedir('/compras-estoque', 'POST', { fornecedor_id: f1.id, itens: [{ material_id: null, produto_id: 2147483647, quantidade: '1', preco_unitario: '1' }] }, 404);
    assert.equal((await pedir('/compras-estoque')).dados.some(c => c.itens.some(i => i.produto_id === 2147483647)), false);
    assert.equal((await pedir(`/produtos/${p.id}`)).dados.quantidade, saldoAnteriorCompraInvalida);
    await pedir('/compras-estoque', 'POST', { fornecedor_id: f1.id, itens: [{ material_id: m.id, produto_id: p.id, quantidade: '1', preco_unitario: '1' }] }, 400);

    const importados = (await pedir('/estoque/importacoes', 'POST', { itens: [
      { tipo: 'material', nome: 'Material CSV fictício', categoria: 'Cola', unidade: 'kg', quantidade: '1.5', quantidade_minima: '0.5', custo: '3.25' },
      { tipo: 'produto', nome: 'Produto CSV fictício', categoria: 'Palmilhas', quantidade: '4', quantidade_minima: '2', preco_custo: '5.00', preco_venda: '9.00' },
    ] }, 201)).dados;
    assert.equal(importados.length, 2);
    assert.equal((await pedir('/materiais')).dados.find(i => i.nome === 'Material CSV fictício').quantidade, '1.5');
    assert.equal((await pedir('/produtos')).dados.find(i => i.nome === 'Produto CSV fictício').quantidade_minima, '2');
    const historicoCsv = (await pedir(`/movimentacoes-estoque?material_id=${importados[0].id}`)).dados;
    assert.equal(historicoCsv.length, 1); assert.equal(historicoCsv[0].motivo, 'Saldo inicial por importação CSV');
    await pedir('/estoque/importacoes', 'POST', { itens: [
      { tipo: 'material', nome: 'Importação parcial não deve gravar', categoria: 'Cola', unidade: 'kg', quantidade: '0', quantidade_minima: '0', custo: '0' },
      { tipo: 'material', nome: 'Material CSV fictício', categoria: 'Cola', unidade: 'kg', quantidade: '0', quantidade_minima: '0', custo: '0' },
    ] }, 409);
    assert.equal((await pedir('/materiais')).dados.some(i => i.nome === 'Importação parcial não deve gravar'), false);

    await pedir('/movimentacoes-estoque?material_id=0', 'GET', undefined, 400);
    await pedir(`/movimentacoes-estoque?material_id=${m.id}&produto_id=${p.id}`, 'GET', undefined, 400);
    const { cnpjValido: cnpjApi } = require('../src/utils/cnpj.ts');
    const { cnpjValido: cnpjTela, formatarCnpj, formatarTelefoneFornecedor } = require('../../frontend/src/utils/fornecedores.ts');
    for (const [valor, esperado] of [['12345678000195', true], ['12ABC34501DE35', true], ['00000000000000', false], ['12ABC34501DE00', false], ['123', false]]) {
      assert.equal(cnpjApi(valor), esperado); assert.equal(cnpjTela(valor), esperado);
    }
    assert.equal(formatarCnpj('12ABC34501DE35'), '12.ABC.345/01DE-35');
    assert.equal(formatarTelefoneFornecedor('1112345678'), '(11) 1234-5678');
    const { unidadesDaCategoria } = require('../../frontend/src/config/estoque.ts');
    assert.deepEqual(unidadesDaCategoria(' Cola '), ['kg', 'g']);
    assert.deepEqual(unidadesDaCategoria('Categoria livre'), []);
    const { analisarCsvEstoque } = require('../../frontend/src/utils/csvEstoque.ts');
    const cabecalhoCsv = 'tipo,nome,categoria,unidade,quantidade,quantidade_minima,custo,preco_custo,preco_venda';
    const previaCsv = analisarCsvEstoque(cabecalhoCsv + '\nmaterial,"Cola, premium",Cola,kg,1.25,0.25,12.50,,\nproduto,Palmilha CSV,Palmilhas,,4,2,,8.50,19.90', [], []);
    assert.equal(previaCsv.length, 2); assert.equal(previaCsv[0].dados.nome, 'Cola, premium'); assert.ok(previaCsv.every(l => !l.erro));
    assert.match(analisarCsvEstoque(cabecalhoCsv + '\nproduto,Duplicado,Palmilhas,,2,1,,1,2', [{ nome: 'Duplicado', categoria: 'Palmilhas' }], [])[0].erro, /duplicado/i);
    assert.ok(analisarCsvEstoque(cabecalhoCsv + '\nproduto,Decimal inválido,Palmilhas,,2.5,1,,1,2', [], [])[0].erro);
    const { lucroProduto } = require('../../frontend/src/utils/estoque.ts');
    assert.deepEqual(lucroProduto('10.00', '15.00'), { valor: 5, percentual: 50 });
    assert.deepEqual(lucroProduto('0', '15'), { valor: 15, percentual: null });
    assert.deepEqual(lucroProduto('10', '8'), { valor: -2, percentual: -20 });
    assert.deepEqual(lucroProduto('12', '14'), { valor: 2, percentual: 16.67 });
    console.log(`PASSOU: ${verificacoes} verificações HTTP, importação CSV/prévia e cálculos de lucro; dados em transação com rollback.`);
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
