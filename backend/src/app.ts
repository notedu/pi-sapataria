import express, { type Application } from "express";
import cors from "cors";
import clienteRoutes from "./routes/clienteRoutes.js";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", clienteRoutes); // removido "/clientes" daqui

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "API rodando" });
});

export default app;
