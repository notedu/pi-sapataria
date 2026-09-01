import { type Request, type Response } from "express";
import * as cepService from "../services/cepService.js";

// GET /cep/:cep - consulta um endereço a partir do CEP
export async function show(req: Request, res: Response) {
  try {
    const { cep } = req.params;

    // garante que "cep" é realmente uma string antes de usar
    // (o TypeScript tipa req.params como string | string[] | undefined)
    if (!cep || typeof cep !== "string") {
      return res.status(400).json({ erro: "CEP não informado" });
    }

    // validação básica: CEP brasileiro tem 8 dígitos
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      return res.status(400).json({ erro: "CEP inválido. Informe 8 dígitos." });
    }

    const endereco = await cepService.buscarEnderecoPorCep(cep);

    if (!endereco) {
      return res.status(404).json({ erro: "CEP não encontrado" });
    }

    return res.status(200).json(endereco);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao consultar CEP" });
  }
}
