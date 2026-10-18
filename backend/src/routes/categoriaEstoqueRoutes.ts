import { Router } from 'express';
import { cadastrar, listar } from '../controllers/categoriaEstoqueController';

const router = Router();
router.get('/', listar);
router.post('/', cadastrar);
export default router;
