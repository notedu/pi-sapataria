import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { ErrorRequestHandler } from 'express';
import healthRoutes from './src/routes/healthRoutes';
import clienteRoutes from './src/routes/clienteRoutes';
import authRoutes from './src/routes/authRoutes';
import funcionarioRoutes from './src/routes/funcionarioRoutes';
import materialRoutes from './src/routes/materialRoutes';
import produtoRoutes from './src/routes/produtoRoutes';
import fornecedorRoutes from './src/routes/fornecedorRoutes';
import ordemServicoRoutes from './src/routes/ordemServicoRoutes';
import vendaRoutes from './src/routes/vendaRoutes';
import movimentacaoEstoqueRoutes from './src/routes/movimentacaoEstoqueRoutes';
import { pool } from './src/config/db';
import { armazenarSessoes, gerenciarSessao, producao } from './src/config/sessao';
import { exigirLogin } from './src/middlewares/autenticacao';
import { verificarCsrf } from './src/middlewares/csrf';
import { ErroHttp } from './src/utils/validacao';

dotenv.config({ quiet: true });

export const app = express();
const port = Number(process.env.PORT ?? 3030);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
}

app.disable('x-powered-by');
app.use(express.json());

const origemFrontend = process.env.APP_ORIGIN ?? 'http://localhost:5173';
if (producao && (!process.env.APP_ORIGIN || !origemFrontend.startsWith('https://'))) {
  throw new Error('Em produção, configure APP_ORIGIN com a origem HTTPS do front-end.');
}
// Só configure proxies que estejam efetivamente à frente desta aplicação.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY.split(',').map((valor) => valor.trim()));
}
app.use(cors({ origin: origemFrontend, credentials: true }));

// As rotas deste arquivo recebem o prefixo /api/v1.
app.use('/api/v1', healthRoutes);
app.use('/api/v1', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api/v1', gerenciarSessao);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', exigirLogin, verificarCsrf, clienteRoutes);
app.use('/api/v1/funcionarios', exigirLogin, verificarCsrf, funcionarioRoutes);

// Ambos os perfis autenticados podem cadastrar, consultar e operar estas entidades.
app.use('/api/v1/materiais', exigirLogin, verificarCsrf, materialRoutes);
app.use('/api/v1/produtos', exigirLogin, verificarCsrf, produtoRoutes);
app.use('/api/v1/fornecedores', exigirLogin, verificarCsrf, fornecedorRoutes);
app.use('/api/v1/ordens-servico', exigirLogin, verificarCsrf, ordemServicoRoutes);
app.use('/api/v1/vendas', exigirLogin, verificarCsrf, vendaRoutes);
app.use('/api/v1/movimentacoes-estoque', exigirLogin, verificarCsrf, movimentacaoEstoqueRoutes);

// O Express 5 encaminha falhas dos controllers assíncronos para este tratamento.
const tratarErro: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ErroHttp) {
    if (error.status === 429) response.setHeader('Retry-After', '900');
    response.status(error.status).json({ erro: { codigo: error.codigo, mensagem: error.message } });
    return;
  }
  if (error.code === '23505' && error.constraint === 'funcionarios_usuario_unico') {
    response.status(409).json({ erro: { codigo: 'USUARIO_JA_CADASTRADO', mensagem: 'Este usuário já está cadastrado.' } });
    return;
  }
  if (error.code === '23503') {
    response.status(409).json({ erro: { codigo: 'REGISTRO_VINCULADO', mensagem: 'A operação conflita com um vínculo do cadastro. Preserve os registros usados no histórico.' } });
    return;
  }
  if (['23514', '22003', '22007', '22008'].includes(error.code)) {
    response.status(400).json({ erro: { codigo: 'DADOS_INVALIDOS', mensagem: 'Valores incompatíveis com as regras do cadastro.' } });
    return;
  }
  if (error.type === 'entity.parse.failed') {
    response.status(400).json({ erro: { codigo: 'JSON_INVALIDO', mensagem: 'Envie um JSON válido.' } });
    return;
  }
  if (error.type === 'entity.too.large') {
    response.status(413).json({ erro: { codigo: 'CORPO_MUITO_GRANDE', mensagem: 'O corpo da requisição excede o limite permitido.' } });
    return;
  }
  // Não devolve credenciais, SQL ou detalhes internos ao cliente da API.
  response.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Não foi possível concluir a operação.' } });
};
app.use(tratarErro);

// Importar app permite verificar as rotas sem iniciar outro servidor na porta 3333.
if (require.main === module) {
  const host = process.env.HOST ?? '127.0.0.1';
  const server = app.listen(port, host, (error?: Error) => {
    if (error) return;
    console.log(`Servidor disponível em http://${host}:${port}`);
  });

  server.on('error', async (error: NodeJS.ErrnoException) => {
    console.error(`Não foi possível iniciar o servidor: ${error.code ?? 'erro desconhecido'}.`);
    armazenarSessoes.close();
    await pool.end();
    process.exitCode = 1;
  });

  const encerrar = () => {
    server.close(async () => {
      armazenarSessoes.close();
      await pool.end();
    });
  };
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}
