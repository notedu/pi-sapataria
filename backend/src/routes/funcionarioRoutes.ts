import { Router } from "express";
import * as funcionarioController from "../controllers/funcionarioController.js";

const router = Router();

router.get("/funcionarios", funcionarioController.index); // listar todos
router.get("/funcionarios/:id", funcionarioController.show); // buscar por id
router.post("/funcionarios", funcionarioController.create); // criar
router.put("/funcionarios/:id", funcionarioController.update); // atualizar
router.delete("/funcionarios/:id", funcionarioController.destroy); // remover

export default router;
