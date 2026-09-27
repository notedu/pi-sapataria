import { Router } from 'express';
import { buscarPorId, listar, listarMateriais, cadastrar, atualizar, mudarStatus, consumir, devolverMaterial } from '../controllers/ordemServicoController';

const router = Router();
router.get('/', listar);
router.get('/:id', buscarPorId);
router.get('/:id/materiais', listarMateriais);
router.post('/', cadastrar);
router.put('/:id', atualizar);
router.put('/:id/status', mudarStatus);
router.post('/:id/materiais', consumir);
router.post('/:id/materiais/:usoId/devolucoes', devolverMaterial);
export default router;
