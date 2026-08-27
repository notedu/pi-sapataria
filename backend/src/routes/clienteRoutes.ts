import { Router } from "express";
import * as clienteController from "../controllers/clienteController.js";

const router = Router();

router.get("/clientes", clienteController.index); // listar todos
router.get("/clientes/:id", clienteController.show); // buscar por id
router.post("/clientes", clienteController.create); // criar
router.put("/clientes/:id", clienteController.update); // atualizar
router.delete("/clientes/:id", clienteController.destroy); // remover

export default router;
