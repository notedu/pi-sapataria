import { Router } from 'express';
import { atualizar, buscarPorId, cadastrar, listar, excluir, ordens } from '../controllers/clienteController';

const router = Router();

router.get('/', listar);
router.get('/:id/ordens-servico', ordens);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.put('/:id', atualizar);

router.delete('/:id', excluir);

export default router;
