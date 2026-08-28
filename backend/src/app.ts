import express, { type Application } from "express";
import cors from "cors";
import clienteRoutes from "./routes/clienteRoutes.js";
import funcionarioRoutes from "./routes/funcionarioRoutes.js";
import servicoRoutes from "./routes/servicoRoutes.js";
import ordemServicoRoutes from "./routes/ordemServicoRoutes.js";
import estoqueMateriaPrimaRoutes from "./routes/estoqueMateriaPrimaRoutes.js";
import estoqueProdutosVendaRoutes from "./routes/estoqueProdutosVendaRoutes.js";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", clienteRoutes);
app.use("/api/v1", funcionarioRoutes);
app.use("/api/v1", servicoRoutes);
app.use("/api/v1", ordemServicoRoutes);
app.use("/api/v1", estoqueMateriaPrimaRoutes);
app.use("/api/v1", estoqueProdutosVendaRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "API rodando" });
});

export default app;
