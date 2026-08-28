import { Router } from "express";
import * as ordemServicoController from "../controllers/ordemServicoController.js";

const router = Router();

router.get("/ordens-servico", ordemServicoController.index);
router.get("/ordens-servico/:id", ordemServicoController.show);
router.post("/ordens-servico", ordemServicoController.create);
router.put("/ordens-servico/:id", ordemServicoController.update);
router.delete("/ordens-servico/:id", ordemServicoController.destroy);

export default router;
