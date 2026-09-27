import { Router } from 'express';
import { alterarAcesso, buscarPorId, cadastrar, listar } from '../controllers/funcionarioController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.put('/:id/acesso', alterarAcesso);
export default router;
