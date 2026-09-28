import { Router } from 'express';
import { alterarAcesso, buscarPorId, cadastrar, desativar, listar } from '../controllers/funcionarioController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.put('/:id/acesso', alterarAcesso);
router.post('/:id/desativar', desativar);
export default router;
