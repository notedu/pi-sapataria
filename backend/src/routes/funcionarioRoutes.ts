import { Router } from 'express';
import { alterarAcesso, buscarPorId, cadastrar, desativar, listar, editar, ordens } from '../controllers/funcionarioController';

import { exigirAdministrador } from '../middlewares/autenticacao';

const router = Router();
router.get('/', exigirAdministrador, listar);
router.get('/:id', buscarPorId);
router.post('/', exigirAdministrador, cadastrar);
router.put('/:id/acesso', exigirAdministrador, alterarAcesso);
router.post('/:id/desativar', exigirAdministrador, desativar);
router.get('/:id/ordens-servico', ordens);
router.put('/:id', exigirAdministrador, editar);
export default router;
