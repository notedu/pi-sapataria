import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { exigirLogin } from '../middlewares/autenticacao';
import { fornecerCsrf, verificarCsrf } from '../middlewares/csrf';

const router = Router();
router.get('/csrf', fornecerCsrf);
router.post('/login', verificarCsrf, login);
router.post('/logout', verificarCsrf, logout);
router.get('/me', exigirLogin, me);
export default router;
