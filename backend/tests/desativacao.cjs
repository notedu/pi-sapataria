// Integração real, somente em PostgreSQL local descartável com TLS.
// TEST_DATABASE_URL=.../sapataria_desativacao_teste TEST_DATABASE_CA_FILE=... \
// node --require tsx/cjs tests/desativacao.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function executar() {
  const url = new URL(process.env.TEST_DATABASE_URL || 'http://nao-configurado');
  assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Use um banco LOCAL descartável.');
  assert.equal(url.pathname, '/sapataria_desativacao_teste', 'Nome obrigatório do banco de teste.');
  assert(['postgres:', 'postgresql:'].includes(url.protocol));
  const ca = readFileSync(process.env.TEST_DATABASE_CA_FILE, 'utf8');
  process.env.DATABASE_URL = url.toString();
  process.env.DATABASE_CA_CERT = ca;
  process.env.SESSION_SECRET = 'segredo-exclusivo-do-teste-descartavel-123456789';
  process.env.NODE_ENV = 'test';
  process.env.APP_ORIGIN = 'http://localhost:5173';
  const banco = new Pool({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } });
  let servidor, pool, sessoes, criado = false;
  let verificacoes = 0;
  try {
    const existente = await banco.query("SELECT 1 FROM information_schema.schemata WHERE schema_name = 'sapataria'");
    assert.equal(existente.rowCount, 0, 'O teste recusa banco que já contenha o schema sapataria.');
    await banco.query(readFileSync(path.join(__dirname, '../src/database/funcionarios.sql'), 'utf8'));
    criado = true;
    await banco.query('CREATE TABLE sapataria.historico_teste (funcionario_id integer REFERENCES sapataria.funcionarios(id), descricao text)');
    const { protegerSenha } = require('../src/utils/senha');
    const senhaAdmin = 'Senha ficticia de administrador 2026!';
    const senhaFuncionario = 'Senha ficticia de funcionario 2026!';
    const hashAdmin = await protegerSenha(senhaAdmin);
    const hashFuncionario = await protegerSenha(senhaFuncionario);
    for (const [nome, usuario, perfil, hash] of [
      ['Admin A', 'admin.a', 'administrador', hashAdmin], ['Admin B', 'admin.b', 'administrador', hashAdmin],
      ['Funcionário A', 'func.a', 'funcionario', hashFuncionario], ['Funcionário B', 'func.b', 'funcionario', hashFuncionario],
    ]) {
      await banco.query('INSERT INTO sapataria.funcionarios (nome,usuario,email,perfil,senha_protegida) VALUES ($1,$2,$3,$4,$5)', [nome, usuario, `${usuario}@example.com`, perfil, hash]);
    }
    await banco.query("INSERT INTO sapataria.historico_teste VALUES (3, 'Histórico fictício preservado')");
    const { app } = require('../server');
    pool = require('../src/config/db').pool;
    sessoes = require('../src/config/sessao').armazenarSessoes;
    servidor = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${servidor.address().port}/api/v1`;
    async function requisitar(cliente, caminho, method = 'GET', dados, semCsrf = false) {
      const resposta = await fetch(base + caminho, {
        method,
        headers: { 'Content-Type': 'application/json', ...(cliente.cookie ? { Cookie: cliente.cookie } : {}),
          ...(!semCsrf && cliente.csrf ? { 'X-CSRF-Token': cliente.csrf } : {}) },
        ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
      });
      const cookies = resposta.headers.getSetCookie();
      if (cookies.length) cliente.cookie = cookies.map(c => c.split(';')[0]).join('; ');
      const corpo = resposta.status === 204 ? null : await resposta.json();
      if (corpo?.csrfToken) cliente.csrf = corpo.csrfToken;
      return { status: resposta.status, corpo };
    }
    async function login(usuario, senha) {
      const cliente = {};
      assert.equal((await requisitar(cliente, '/auth/csrf')).status, 200);
      assert.equal((await requisitar(cliente, '/auth/login', 'POST', { usuario, senha })).status, 200);
      return cliente;
    }
    function conferir(resposta, status, codigo) {
      assert.equal(resposta.status, status, JSON.stringify(resposta.corpo));
      if (codigo) assert.equal(resposta.corpo.erro.codigo, codigo);
      verificacoes++;
    }
    const admin = await login('admin.a', senhaAdmin);
    const outroAdmin = await login('admin.b', senhaAdmin);
    const funcionario = await login('func.a', senhaFuncionario);
    const versao = async id => (await banco.query('SELECT ativo,perfil,versao_acesso FROM sapataria.funcionarios WHERE id=$1', [id])).rows[0];
    const limparLimites = () => banco.query('DELETE FROM sapataria.tentativas_login');
    conferir(await requisitar({}, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaAdmin }), 401);
    conferir(await requisitar(admin, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaAdmin }, true), 403, 'CSRF_INVALIDO');
    conferir(await requisitar(funcionario, '/funcionarios/4/desativar', 'POST', { senha_admin: senhaFuncionario }), 403, 'ACESSO_NEGADO');
    conferir(await requisitar(admin, '/funcionarios/1/desativar', 'POST', { senha_admin: senhaAdmin }), 403, 'AUTODESATIVACAO_PROIBIDA');
    conferir(await requisitar(admin, '/funcionarios/1/acesso', 'PUT', { perfil: 'administrador', ativo: false, senha_admin: senhaAdmin }), 403, 'AUTODESATIVACAO_PROIBIDA');
    conferir(await requisitar(admin, '/funcionarios/3/desativar', 'POST', {}), 400, 'CONFIRMACAO_OBRIGATORIA');
    conferir(await requisitar(admin, '/funcionarios/3/acesso', 'PUT', { perfil: 'funcionario', ativo: false }), 400, 'CONFIRMACAO_OBRIGATORIA');
    conferir(await requisitar(admin, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaFuncionario }), 403, 'SENHA_CONFIRMACAO_INVALIDA');
    conferir(await requisitar(admin, '/funcionarios/3/acesso', 'PUT', { perfil: 'administrador', ativo: false, senha_admin: 'errada' }), 403, 'SENHA_CONFIRMACAO_INVALIDA');
    assert.deepEqual(await versao(3), { ativo: true, perfil: 'funcionario', versao_acesso: 1 });
    conferir(await requisitar(admin, '/funcionarios/999/desativar', 'POST', { senha_admin: senhaAdmin }), 404);
    conferir(await requisitar(admin, '/funcionarios/invalido/desativar', 'POST', { senha_admin: senhaAdmin }), 400);
    conferir(await requisitar(admin, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaAdmin, ativo: true }), 400);
    const desativado = await requisitar(admin, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaAdmin });
    conferir(desativado, 200);
    assert.equal(desativado.corpo.dados.ativo, false);
    assert(!('senha_protegida' in desativado.corpo.dados));
    assert(!('senha_admin' in desativado.corpo.dados));
    assert.deepEqual(await versao(3), { ativo: false, perfil: 'funcionario', versao_acesso: 2 });
    assert.equal((await banco.query('SELECT * FROM sapataria.historico_teste')).rowCount, 1);
    conferir(await requisitar(funcionario, '/auth/me'), 401);
    conferir(await requisitar(admin, '/funcionarios/3/desativar', 'POST', { senha_admin: senhaAdmin }), 200);
    assert.equal((await versao(3)).versao_acesso, 2, 'Repetição não muda novamente a versão.');
    conferir(await requisitar(admin, '/funcionarios/3/acesso', 'PUT', { perfil: 'funcionario', ativo: true }), 200);
    conferir(await requisitar(funcionario, '/auth/me'), 401, 'NAO_AUTENTICADO');
    const novaSessao = await login('func.a', senhaFuncionario);
    conferir(await requisitar(novaSessao, '/auth/me'), 200);
    conferir(await requisitar(admin, '/funcionarios/3/acesso', 'PUT', { perfil: 'funcionario', ativo: false, senha_admin: senhaAdmin }), 200);
    conferir(await requisitar(novaSessao, '/auth/me'), 401);
    await limparLimites();
    for (let i = 0; i < 10; i++) conferir(await requisitar(admin, '/funcionarios/4/desativar', 'POST', { senha_admin: 'errada' }), 403, 'SENHA_CONFIRMACAO_INVALIDA');
    conferir(await requisitar(admin, '/funcionarios/4/desativar', 'POST', { senha_admin: senhaAdmin }), 429);
    const loginRenovado = await login('admin.a', senhaAdmin);
    conferir(await requisitar(loginRenovado, '/funcionarios/4/desativar', 'POST', { senha_admin: senhaAdmin }), 429);
    assert.equal((await versao(4)).ativo, true);
    await limparLimites();
    // Dois administradores tentando desativar um ao outro: a autorização é revalidada após o bloqueio.
    const resultados = await Promise.all([
      requisitar(admin, '/funcionarios/2/desativar', 'POST', { senha_admin: senhaAdmin }),
      requisitar(outroAdmin, '/funcionarios/1/desativar', 'POST', { senha_admin: senhaAdmin }),
    ]);
    assert.deepEqual(resultados.map(r => r.status).sort(), [200, 401]);
    assert.equal((await banco.query("SELECT id FROM sapataria.funcionarios WHERE perfil='administrador' AND ativo")).rowCount, 1);
    verificacoes++;
    console.log(`OK: ${verificacoes} verificações HTTP, mais estado do banco, histórico, sessões e concorrência real.`);
  } finally {
    if (servidor) await new Promise(resolve => servidor.close(resolve));
    sessoes?.close();
    if (pool) await pool.end();
    if (criado) await banco.query('DROP SCHEMA sapataria CASCADE');
    await banco.end();
  }
}
executar().catch(error => { console.error(error); process.exitCode = 1; });
