import { Router } from "express";
import * as servicoController from "../controllers/servicoController.js";

const router = Router();

router.get("/servicos", servicoController.index);
router.get("/servicos/:id", servicoController.show);
router.post("/servicos", servicoController.create);
router.put("/servicos/:id", servicoController.update);
router.delete("/servicos/:id", servicoController.destroy);

export default router;
