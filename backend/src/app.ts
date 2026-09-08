import express, { type Application } from "express";
import cors from "cors";
import clienteRoutes from "./routes/clienteRoutes.js";
import funcionarioRoutes from "./routes/funcionarioRoutes.js";
import servicoRoutes from "./routes/servicoRoutes.js";
import ordemServicoRoutes from "./routes/ordemServicoRoutes.js";
import estoqueMateriaPrimaRoutes from "./routes/estoqueMateriaPrimaRoutes.js";
import estoqueProdutosVendaRoutes from "./routes/estoqueProdutosVendaRoutes.js";
import cepRoutes from "./routes/cepRoutes.js";
import authRoutes, { allowedOrigins, checkOrigin, requireAuth } from './routes/authRoutes.js';

const app: Application = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.get('/api/v1/health', (_req, res) => { res.json({ status: 'API rodando' }); });
app.use('/api/v1', checkOrigin);
app.use('/api/v1/auth', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, authRoutes);
app.use('/api/v1', requireAuth);

app.use("/api/v1", clienteRoutes);
app.use("/api/v1", funcionarioRoutes);
app.use("/api/v1", servicoRoutes);
app.use("/api/v1", ordemServicoRoutes);
app.use("/api/v1", estoqueMateriaPrimaRoutes);
app.use("/api/v1", estoqueProdutosVendaRoutes);
app.use("/api/v1", cepRoutes);

export default app;
