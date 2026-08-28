import { Router } from "express";
import * as estoqueProdutosVendaController from "../controllers/estoqueProdutosVendaController.js";

const router = Router();

router.get("/estoque-produtos-venda", estoqueProdutosVendaController.index);
router.get("/estoque-produtos-venda/:id", estoqueProdutosVendaController.show);
router.post("/estoque-produtos-venda", estoqueProdutosVendaController.create);
router.put(
  "/estoque-produtos-venda/:id",
  estoqueProdutosVendaController.update,
);
router.delete(
  "/estoque-produtos-venda/:id",
  estoqueProdutosVendaController.destroy,
);

export default router;
