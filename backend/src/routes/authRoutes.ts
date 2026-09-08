import { createHash, randomBytes } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import pool from '../config/db.js';
import { verifyPassword } from '../services/password.js';

export const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(value => value.trim());
const cookie = 'sapataria_session';
const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const tokenFrom = (req: Request) => (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${cookie}=`))?.slice(cookie.length + 1);

export function checkOrigin(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!req.headers.origin || !allowedOrigins.includes(req.headers.origin))) {
    res.status(403).json({ erro: 'Origem da requisição não permitida.' });
    return;
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = tokenFrom(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    res.status(401).json({ erro: 'Faça login para continuar.' });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT u.id, u.usuario, u.nome, u.perfil FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = $1 AND s.expira_em > NOW() AND u.ativo = TRUE`, [digest(token)],
    );
    if (!result.rows[0]) {
      res.clearCookie(cookie, options).status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
      return;
    }
    res.locals.usuario = result.rows[0];
    next();
  } catch { res.status(503).json({ erro: 'Não foi possível verificar sua sessão. Tente novamente.' }); }
}

const router = Router();
// Limit attempts per IP in this API instance, including unknown usernames.
const attempts = new Map<string, { count: number; until: number }>();
const cleanup = setInterval(() => { for (const [key, entry] of attempts) if (entry.until < Date.now()) attempts.delete(key); }, 60_000);
cleanup.unref();
router.post('/login', async (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  let entry = attempts.get(ip);
  if (!entry || entry.until < now) { entry = { count: 0, until: now + 15 * 60_000 }; attempts.set(ip, entry); }
  if (++entry.count > 10) { res.status(429).json({ erro: 'Muitas tentativas. Aguarde 15 minutos.' }); return; }
  const { usuario, senha } = req.body ?? {};
  if (typeof usuario !== 'string' || !usuario.trim() || usuario.length > 80 || typeof senha !== 'string' || !senha || senha.length > 128) {
    res.status(400).json({ erro: 'Informe usuário e senha válidos.' }); return;
  }
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario.trim().toLowerCase()]);
    const user = result.rows[0];
    const valid = await verifyPassword(senha, user?.senha_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if (!user || !valid || !user.ativo) { res.status(401).json({ erro: 'Usuário ou senha inválidos.' }); return; }
    const token = randomBytes(32).toString('hex');
    const oldToken = tokenFrom(req);
    if (oldToken) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [digest(oldToken)]);
    await pool.query('DELETE FROM sessoes WHERE expira_em <= NOW()');
    await pool.query("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES ($1, $2, NOW() + INTERVAL '8 hours')", [digest(token), user.id]);
    attempts.delete(ip);
    res.cookie(cookie, token, { ...options, maxAge: 8 * 60 * 60 * 1000 });
    res.json({ id: user.id, usuario: user.usuario, nome: user.nome, perfil: user.perfil });
  } catch { res.status(503).json({ erro: 'Não foi possível entrar. Verifique a conexão com o banco e tente novamente.' }); }
});
router.get('/me', requireAuth, (_req, res) => { res.json(res.locals.usuario); });
router.post('/logout', async (req, res) => {
  try {
    const token = tokenFrom(req);
    if (token) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [digest(token)]);
    res.clearCookie(cookie, options).json({ mensagem: 'Sessão encerrada.' });
  } catch { res.status(503).json({ erro: 'Não foi possível encerrar a sessão. Tente novamente.' }); }
});
export default router;
