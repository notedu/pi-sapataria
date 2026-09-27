import { Router } from 'express';
import { buscarPorId, listar, cadastrar, atualizar, excluir } from '../controllers/materialController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);
export default router;
