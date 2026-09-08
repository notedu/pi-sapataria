import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import app from './app.js';
import pool from './config/db.js';
import { hashPassword, verifyPassword } from './services/password.js';

test('hash com salt e validação de senha', async () => {
  const hash = await hashPassword('senha-de-teste-123');
  assert.notEqual(hash, await hashPassword('senha-de-teste-123'));
  assert.equal(await verifyPassword('senha-de-teste-123', hash), true);
  assert.equal(await verifyPassword('incorreta', hash), false);
  assert.equal(await verifyPassword('incorreta', 'invalido'), false);
});

test('login real, proteção, cookie, perfil e revogação', { skip: !process.env.TEST_ADMIN_PASSWORD }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/v1`;
  const headers = { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' };
  let cookie = '';
  try {
    assert.equal((await fetch(`${base}/clientes`)).status, 401);
    assert.equal((await fetch(`${base}/auth/me`)).status, 401);
    assert.equal((await fetch(`${base}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ usuario: 'admin', senha: 'incorreta' }) })).status, 401);
    assert.equal((await fetch(`${base}/auth/login`, { method: 'POST', headers: { ...headers, Origin: 'https://invalid.example' }, body: '{}' })).status, 403);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ usuario: ' ADMIN ', senha: process.env.TEST_ADMIN_PASSWORD }) });
    assert.equal(login.status, 200);
    const user = await login.json();
    assert.equal(user.usuario, 'admin');
    assert.equal(user.perfil, 'admin');
    assert.equal(user.senha_hash, undefined);
    const setCookie = login.headers.get('set-cookie')!;
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/i);
    cookie = setCookie.split(';')[0]!;
    const me = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie } });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), user);
    assert.equal((await fetch(`${base}/clientes`, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}' })).status, 200);
    assert.equal((await fetch(`${base}/auth/me`, { headers: { Cookie: cookie } })).status, 401);
    assert.equal((await fetch(`${base}/clientes`, { headers: { Cookie: cookie } })).status, 401);
  } finally {
    if (cookie) await fetch(`${base}/auth/logout`, { method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}' });
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
});
