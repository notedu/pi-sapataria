// server.ts
import dotenv from "dotenv";
import app from "./src/app.js"; // repare: mantém a extensão .js na importação, explico abaixo

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
