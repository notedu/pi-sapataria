import { Router } from 'express';
import { buscarPorId, listar, listarItens, cadastrar, cancelar } from '../controllers/vendaController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.get('/:id/itens', listarItens);
router.post('/', cadastrar);
router.post('/:id/cancelamento', cancelar);
export default router;
