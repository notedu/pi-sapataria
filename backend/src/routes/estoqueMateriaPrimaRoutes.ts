import { Router } from "express";
import * as estoqueMateriaPrimaController from "../controllers/estoqueMateriaPrimaController.js";

const router = Router();

router.get("/estoque-materia-prima", estoqueMateriaPrimaController.index);
router.get("/estoque-materia-prima/:id", estoqueMateriaPrimaController.show);
router.post("/estoque-materia-prima", estoqueMateriaPrimaController.create);
router.put("/estoque-materia-prima/:id", estoqueMateriaPrimaController.update);
router.delete(
  "/estoque-materia-prima/:id",
  estoqueMateriaPrimaController.destroy,
);

export default router;
