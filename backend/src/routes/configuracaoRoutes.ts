import { Router } from 'express';
import { atualizar, consultar } from '../controllers/configuracaoLojaController';
import { exigirAdministrador } from '../middlewares/autenticacao';

const router = Router();
// A área comercial não fica disponível para Funcionários comuns, nem em leitura.
router.get('/loja', exigirAdministrador, consultar);
router.put('/loja', exigirAdministrador, atualizar);
export default router;
