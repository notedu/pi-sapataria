import { Router } from 'express';
import { atualizar, consultar } from '../controllers/configuracaoLojaController';
import { exigirAdministrador } from '../middlewares/autenticacao';

const router = Router();
// A rota já exige sessão no registro do router em server.ts; apenas a alteração é administrativa.
router.get('/loja', consultar);
router.put('/loja', exigirAdministrador, atualizar);
export default router;
