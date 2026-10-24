import { Router } from 'express';
import {
  listar,
  notificacoes,
  quantidadeNaoLidas,
  marcarLida,
  marcarTodasLidas,
} from '../controllers/atividadeController';

const router = Router();
router.get('/atividades', listar);
router.get('/notificacoes', notificacoes);
router.get('/notificacoes/nao-lidas', quantidadeNaoLidas);
router.post('/notificacoes/lidas', marcarTodasLidas);
router.post('/notificacoes/:id/lida', marcarLida);
export default router;
