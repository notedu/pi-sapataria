import { Router } from 'express';
import { consultar, despesa, estorno, indicador, pagamentoFinanceiro } from '../controllers/financeiroController';

const router = Router();
router.get('/', consultar);
router.get('/:indicador', indicador);
router.post('/despesas', despesa);
router.post('/pagamentos', pagamentoFinanceiro);
router.post('/lancamentos/:id/estorno', estorno);
export default router;
