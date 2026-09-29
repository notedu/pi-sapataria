// Integração somente em uma instância local descartável, sem schema sapataria prévio.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function executar() {
  const url = new URL(process.env.TEST_DATABASE_URL || 'http://nao-configurado');
  assert(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.equal(url.pathname, '/sapataria_clientes_teste');
  assert(['postgres:', 'postgresql:'].includes(url.protocol));
  const ca = fs.readFileSync(process.env.TEST_DATABASE_CA_FILE, 'utf8');
  process.env.DATABASE_URL = url.toString();
  process.env.DATABASE_CA_CERT = ca;
  process.env.SESSION_SECRET = 'segredo-local-ficticio-clientes-1234567890123456789';
  process.env.NODE_ENV = 'test';
  const banco = new Pool({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } });
  let servidor, pool, sessoes, criado = false, verificacoes = 0;
  const ok = (condicao) => { assert(condicao); verificacoes++; };
  try {
    assert.equal((await banco.query("SELECT 1 FROM information_schema.schemata WHERE schema_name='sapataria'")).rowCount, 0);
    const sql = nome => fs.readFileSync(path.join(__dirname, '../src/database', nome), 'utf8');
    await banco.query(sql('clientes.sql')); criado = true;
    await banco.query("INSERT INTO sapataria.clientes(nome,telefone,endereco) VALUES ('Cliente antigo fictício','123','Rua antiga fictícia, 10')");
    await banco.query(sql('funcionarios.sql'));
    await banco.query(sql('entidades.sql'));
    await banco.query(sql('operacoes.sql'));
    await banco.query(sql('clientes-perfil.sql'));
    const legado = (await banco.query('SELECT * FROM sapataria.clientes WHERE id=1')).rows[0];
    ok(legado.cpf === null && legado.criado_em === null && legado.endereco === 'Rua antiga fictícia, 10');
    await assert.rejects(banco.query("INSERT INTO sapataria.clientes(nome,telefone) VALUES ('Inválido','11999999999')"), { code: '23514' }); verificacoes++;
    const { protegerSenha } = require('../src/utils/senha');
    const senha = 'Senha ficticia para testes 2026!';
    await banco.query('INSERT INTO sapataria.funcionarios(nome,usuario,email,senha_protegida,perfil) VALUES ($1,$2,$3,$4,$5)', ['Pessoa fictícia','teste','teste@example.com',await protegerSenha(senha),'funcionario']);
    const { app } = require('../server');
    pool = require('../src/config/db').pool;
    sessoes = require('../src/config/sessao').armazenarSessoes;
    servidor = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${servidor.address().port}/api/v1`;
    let cookie = '', csrf = '';
    async function http(rota, method='GET', dados, autenticado=true, token=true) {
      const r = await fetch(base+rota, { method, headers: { 'Content-Type':'application/json', ...(autenticado ? { Cookie:cookie } : {}), ...(token ? { 'X-CSRF-Token':csrf } : {}) }, ...(dados ? { body:JSON.stringify(dados) } : {}) });
      if (r.headers.getSetCookie().length) cookie = r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
      const corpo = r.status===204 ? null : await r.json();
      if (corpo?.csrfToken) csrf=corpo.csrfToken;
      return { status:r.status, corpo };
    }
    ok((await http('/clientes/1/ordens-servico')).status===401);
    await http('/auth/csrf');
    ok((await http('/auth/login','POST',{ usuario:'teste', senha })).status===200);
    await http('/auth/csrf');
    const dados = { nome:'Cliente fictício',telefone:'11999999999',cpf:'52998224725',cep:'01001000',numero:'123A',email:null,observacoes:null };
    ok((await http('/clientes','POST',dados,true,false)).status===403);
    for (const alteracao of [{cpf:''},{cpf:'11111111111'},{cpf:'52998224724'},{telefone:'1199999999'},{telefone:'119999999999'},{cep:'1234567'},{cep:'123456789'},{numero:''},{email:'invalido'},{endereco:'antigo'},{criado_em:'2026-01-01'}]) {
      ok((await http('/clientes','POST',{...dados,...alteracao})).status===400);
    }
    const novo = await http('/clientes','POST',dados);
    assert.equal(novo.status,201,JSON.stringify(novo.corpo)); verificacoes++;
    const id=novo.corpo.dados.id;
    ok(novo.corpo.dados.criado_em && novo.corpo.dados.cpf===dados.cpf && novo.corpo.dados.endereco===null);
    ok((await http(`/clientes/${id}/ordens-servico`)).corpo.dados.length===0);
    await banco.query("INSERT INTO sapataria.ordens_servico(cliente_id,responsavel_id,descricao_calcado,servico,valor) VALUES ($1,1,'Sapato fictício','Colagem',45)",[id]);
    await banco.query("INSERT INTO sapataria.ordens_servico(cliente_id,responsavel_id,descricao_calcado,servico,valor) VALUES (1,1,'Outro sapato','Costura',20)");
    const ordens=await http(`/clientes/${id}/ordens-servico`);
    ok(ordens.status===200 && ordens.corpo.dados.length===1 && ordens.corpo.dados[0].cliente_id===id);
    ok((await http(`/clientes/${id}`,'DELETE')).status===409);
    ok((await http('/clientes/99999/ordens-servico')).status===404);
    ok((await http('/clientes/abc/ordens-servico')).status===400);
    ok((await http(`/clientes/${id}`,'PUT',{...dados,numero:'S/N'})).corpo.dados.numero==='S/N');
    ok((await http('/clientes/1','PUT',dados)).status===200);
    const antigoAtualizado=(await http('/clientes/1')).corpo.dados;
    ok(antigoAtualizado.criado_em===null && antigoAtualizado.endereco===legado.endereco);
    ok((await http('/clientes')).corpo.dados.length===2);
    await banco.query("UPDATE sapataria.funcionarios SET perfil='administrador' WHERE id=1");
    // Nova sessão reconhece a identidade atual de Administrador.
    await http('/auth/logout','POST'); await http('/auth/csrf');
    ok((await http('/auth/login','POST',{usuario:'teste',senha})).status===200);
    ok((await http(`/clientes/${id}/ordens-servico`)).status===200);
    console.log(`${verificacoes} verificações de Clientes passaram (HTTP e PostgreSQL local).`);
  } finally {
    if (servidor) await new Promise(resolve=>servidor.close(resolve));
    if (sessoes) sessoes.close();
    if (pool) await pool.end();
    if (criado) await banco.query('DROP SCHEMA sapataria CASCADE');
    await banco.end();
  }
}
executar().catch(error=>{ console.error(error); process.exitCode=1; });
