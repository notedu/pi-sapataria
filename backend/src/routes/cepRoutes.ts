import { Router } from "express";
import * as cepController from "../controllers/cepController.js";

const router = Router();

router.get("/cep/:cep", cepController.show);

export default router;
