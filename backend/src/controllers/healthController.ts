import type { Request, Response } from 'express';

// Confirma que a API responde, sem consultar o banco de dados.
export function getHealth(_request: Request, response: Response): void {
  response.status(200).json({
    status: 'ok',
    mensagem: 'Servidor funcionando',
  });
}
