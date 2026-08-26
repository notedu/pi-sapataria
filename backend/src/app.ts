// src/app.ts
import express, { type Application } from "express";
import cors from "cors";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "API rodando" });
});

export default app;
