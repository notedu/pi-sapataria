import { Router } from 'express';
import {
  consultar,
  consultarFechamentos,
  consultarCorrecoesFechamento,
  corrigirFechamento,
  categoriasDespesa,
  criarCategoriaDespesa,
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
router.get('/fechamentos/:data/correcoes', consultarCorrecoesFechamento);
router.post('/fechamentos', fecharCaixa);
router.put('/fechamentos/:data', corrigirFechamento);
router.get('/categorias-despesas', categoriasDespesa);
router.post('/categorias-despesas', criarCategoriaDespesa);
router.get('/', consultar);
router.get('/:indicador', indicador);
router.post('/despesas', despesa);
router.post('/pagamentos', pagamentoFinanceiro);
router.post('/lancamentos/:id/estorno', estorno);
export default router;
