import { Router } from 'express';
import { importar } from '../controllers/importacaoEstoqueController';

const router = Router();
router.post('/', importar);
export default router;
