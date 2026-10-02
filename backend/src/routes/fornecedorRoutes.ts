import { Router } from 'express';
import { listar, cadastrar, atualizar, excluir, listarVinculos, associar } from '../controllers/fornecedorController';

const router = Router();
router.get('/', listar);
router.post('/', cadastrar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);
router.get('/vinculos/:tipo', listarVinculos);
router.put('/vinculos/:tipo/:id', associar);
export default router;
