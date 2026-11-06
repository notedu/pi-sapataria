import { Router } from 'express';
import {
  consultar,
  consultarFechamentos,
  despesa,
  estorno,
  fecharCaixa,
  fechamentoPorData,
  indicador,
  pagamentoFinanceiro,
} from '../controllers/financeiroController';

const router = Router();
router.get('/fechamentos', consultarFechamentos);
router.get('/fechamentos/:data', fechamentoPorData);
router.post('/fechamentos', fecharCaixa);
router.get('/', consultar);
router.get('/:indicador', indicador);
router.post('/despesas', despesa);
router.post('/pagamentos', pagamentoFinanceiro);
router.post('/lancamentos/:id/estorno', estorno);
export default router;
