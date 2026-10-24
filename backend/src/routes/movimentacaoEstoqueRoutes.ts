import { Router } from 'express';
import {
  buscarPorId,
  listar,
  listarGeral,
  cadastrar,
  estornar,
} from '../controllers/movimentacaoEstoqueController';

const router = Router();
router.get('/', listar);
router.get('/historico-geral', listarGeral);
router.get('/:id', buscarPorId);
router.post('/', cadastrar);
router.post('/:id/estorno', estornar);
export default router;
