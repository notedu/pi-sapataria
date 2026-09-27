import { Router } from 'express';
import { buscarPorId, listar, cadastrar, estornar } from '../controllers/movimentacaoEstoqueController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.post('/:id/estorno', estornar);
export default router;
