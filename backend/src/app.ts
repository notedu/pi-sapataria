import express, { type Application } from "express";
import cors from "cors";
import clienteRoutes from "./routes/clienteRoutes.js";
import funcionarioRoutes from "./routes/funcionarioRoutes.js";
import servicoRoutes from "./routes/servicoRoutes.js";
import ordemServicoRoutes from "./routes/ordemServicoRoutes.js";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", clienteRoutes);
app.use("/api/v1", funcionarioRoutes);
app.use("/api/v1", servicoRoutes);
app.use("/api/v1", ordemServicoRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "API rodando" });
});

export default app;
