# Seda e Couro — Gestão da Sapataria

Sistema web de gestão interna para a sapataria **Seda e Couro**, de Santa Cruz das Palmeiras–SP. O objetivo é reunir cadastros, ordens de serviço, vendas, estoques e informações financeiras para apoiar o trabalho diário da loja.

Desenvolvido como Projeto Integrado do módulo **Desenvolvimento de Aplicação Web**, do **UNIFEOB**, no 2º semestre de 2026.

> **Em desenvolvimento inicial:** o repositório contém a aplicação de exemplo do React com Vite. O back-end possui login por usuário e senha, sessões no PostgreSQL e rotas de Clientes e Funcionários. Materiais, Produtos, OS, Vendas e Estoques possuem consultas e operações de gravação autenticadas. As telas continuam pendentes.

## Funcionalidades previstas

- Cadastro de clientes e funcionários, com controle de acesso.
- Registro e acompanhamento de ordens de serviço (OS).
- Registro de vendas de produtos de pronta entrega.
- Controle de estoque de materiais e de produtos para venda.
- Painéis operacionais e financeiros.

O escopo completo, as sugestões e as decisões pendentes estão no [Guia do Projeto](docs/guia-do-projeto.md).

## Tecnologias

| Situação | Tecnologias e finalidade |
|---|---|
| Configuradas | React e TypeScript para a interface; Vite para desenvolvimento e build; ESLint para análise do código; Node.js e Express para a base da API |
| Previstas no guia | Tailwind CSS para estilos; PostgreSQL para persistência |
| Hospedagem planejada | AWS Academy como plano A para aplicação e banco |

## Como rodar

Tenha **Git**, **Node.js 22.13+ da série 22 ou Node.js 24+** e **npm** instalados, conforme os requisitos das ferramentas registradas no lockfile.

```bash
# Baixe o repositório e entre na aplicação.
git clone https://github.com/notedu/pi-sapataria.git
cd pi-sapataria/frontend

# Instale as versões registradas no package-lock.json.
npm ci

# Inicie o servidor de desenvolvimento.
npm run dev
```

Abra o endereço exibido no terminal, normalmente `http://localhost:5173`. Por enquanto, você verá a tela de exemplo do React com Vite. Não é necessário configurar banco de dados, credenciais ou arquivo `.env` nesta etapa. Para encerrar o servidor, pressione `Ctrl+C`.

Outros comandos, executados dentro de `frontend/`:

| Comando | Finalidade |
|---|---|
| `npm run lint` | Verificar o código com ESLint |
| `npm run build` | Verificar TypeScript e gerar a aplicação em `frontend/dist/` |
| `npm run preview` | Visualizar localmente o build, após executar `npm run build` |

## Executar o back-end

Na raiz do projeto:

```bash
cd backend
npm ci
npm run dev
```

`npm run dev` reinicia o servidor quando o código muda. `npm start` inicia sem observar alterações. Ambos executam TypeScript com `tsx`, sem gerar uma pasta `dist`.

O servidor lê `PORT` do `.env`; quando ausente, usa `3030`. O `.env.example` atual define `3333`. Com esse valor, consulte no navegador ou Insomnia:

```http
GET http://localhost:3333/api/v1/health
```

Resposta HTTP `200`:

```json
{"status":"ok","mensagem":"Servidor funcionando"}
```

Essa rota verifica somente a resposta do servidor; não conecta ao banco nem exige autenticação. Para encerrar, pressione `Ctrl+C`.

- `backend/server.ts`: configura e inicia o Express.
- `backend/src/routes/healthRoutes.ts`: associa o endereço à função responsável.
- `backend/src/controllers/healthController.ts`: produz a resposta JSON.

## Login e Funcionários

A autenticação é da aplicação Express, com PostgreSQL. Não usa Supabase Auth. Cada pessoa tem sua conta; o e-mail é contato, e o login usa `usuario` (sem diferenciar maiúsculas/minúsculas) e `senha`.

O `.env` deve conter `DATABASE_URL`, `DATABASE_CA_CERT`, `SESSION_SECRET`, `PORT`, `HOST` e `APP_ORIGIN`, conforme `.env.example`. A chave `SESSION_SECRET` já foi gerada no ambiente local; ao configurar outro ambiente, gere uma chave aleatória própria (32 bytes ou mais):

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guarde o resultado no ambiente, não no Git. Todas as instâncias da mesma implantação devem usar a mesma chave; trocá-la invalida os cookies anteriores.

### Primeiro administrador

Dentro de `backend/`, execute:

```bash
npm run criar:admin
```

Informe seu nome, usuário, e-mail e senha. A senha não aparece no terminal; precisa ter entre 15 e 128 caracteres. O comando só permite o cadastro inicial enquanto não houver funcionários; os próximos são cadastrados pelo administrador autenticado. Nenhuma conta padrão ou fictícia foi criada.

### Testar no Insomnia

Use sempre o mesmo host (`localhost`, por exemplo) e mantenha os cookies habilitados. Com o servidor iniciado por `npm run dev`:

1. Faça `GET http://localhost:3333/api/v1/auth/csrf`. Copie `csrfToken` da resposta. O Insomnia guarda o cookie automaticamente.
2. Faça `POST /api/v1/auth/login`, com `Content-Type: application/json` e `X-CSRF-Token: <token copiado>`. Envie `{"usuario":"seu.usuario","senha":"sua senha cadastrada"}`.
3. O login devolve os dados públicos da pessoa e um **novo** `csrfToken`. Use esse novo token nas próximas requisições POST/PUT/DELETE; o cookie também é renovado.
4. Consulte `GET /api/v1/auth/me`, `GET /api/v1/clientes` ou, sendo administrador, `GET /api/v1/funcionarios`.
5. Para sair, faça `POST /api/v1/auth/logout` com o token atual. Retorno `204`; o cookie anterior deixa de dar acesso.

O token CSRF protege as requisições que alteram dados; ele não substitui o cookie de login. Após logout, repita a etapa 1 para entrar novamente. Requisições GET não precisam desse cabeçalho.

### Operações de Funcionários

| Método e caminho | Finalidade | Acesso |
|---|---|---|
| `POST /api/v1/funcionarios` | Cadastrar | Administrador |
| `GET /api/v1/funcionarios` | Listar | Administrador |
| `GET /api/v1/funcionarios/:id` | Consultar | Administrador |
| `PUT /api/v1/funcionarios/:id/acesso` | Alterar perfil/estado ativo | Administrador |

Exemplo fictício de cadastro (substitua a senha; não há conta criada com esses dados):

```json
{
  "nome": "Carlos Lima",
  "usuario": "carlos.lima",
  "email": "carlos@example.invalid",
  "senha": "Uma frase de exemplo 2026",
  "perfil": "funcionario"
}
```

Todos esses campos são obrigatórios; `ativo` pode ser omitido e começa como `true`. O usuário é único, mesmo com diferenças de maiúsculas/minúsculas; e-mail não é identificador de login nem tem unicidade exigida. Para alterar acesso, envie `{"perfil":"funcionario","ativo":false}`. A mudança invalida as sessões anteriores; reativar exige novo login. Alterar o próprio acesso também invalida a própria sessão: confirme que outro administrador poderá gerenciar a equipe antes de retirar seu acesso.

Senhas recebem hash scrypt com salt individual e nunca são devolvidas. A sessão tem limite absoluto de 8 horas. Há limite de 10 tentativas por usuário e 50 por IP a cada janela de 15 minutos; um login correto limpa o contador do usuário, mas não o do IP. A mensagem de credenciais inválidas é igual para usuário inexistente, senha incorreta e conta inativa. Recuperação/troca de senha, exclusão e a tela de login ficam para etapas posteriores.

### Estrutura e verificação

- `src/models/funcionarioModel.ts`: consultas de Funcionários e criação do primeiro administrador.
- `src/controllers/authController.ts` e `funcionarioController.ts`: fluxo de login e validação dos cadastros.
- `src/routes/authRoutes.ts` e `funcionarioRoutes.ts`: endereços da API.
- `src/middlewares/`: verificação de login, perfil e token CSRF.
- `src/config/sessao.ts`: cookie e sessões persistidas; `src/utils/senha.ts`: hash de senha.
- `src/database/funcionarios.sql`: tabela de Funcionários e tabelas técnicas `sessoes` e `tentativas_login`, já aplicadas no Supabase. `versao_acesso` é um campo técnico para invalidar sessões antigas.

`npm run typecheck` verifica os tipos usando `backend/tsconfig.json`, que também orienta o editor e inclui as declarações de sessão. A opção `noEmit` impede a geração de JavaScript ou da pasta `dist`. Foram executadas verificações HTTP com o PostgreSQL real, em uma transação desfeita ao final: cadastro, usuário duplicado, senha, login/logout, expiração, CSRF, permissões, inativação/reativação e limites de tentativas. Registros existentes de Clientes foram preservados; nenhum funcionário de teste permaneceu.

### Migração futura para AWS

O código de login e as tabelas acompanham a aplicação. Em produção, configure `NODE_ENV=production`, `APP_ORIGIN` com a origem HTTPS exata do front-end e os dados TLS do novo PostgreSQL. O cookie passa a exigir HTTPS. Ajuste `HOST` conforme a implantação. Se houver proxy/load balancer, configure `TRUST_PROXY` somente com seus endereços ou redes confiáveis; isso determina a identificação de HTTPS e do IP do cliente. Com SameSite=Lax, mantenha front-end e API no mesmo site (por exemplo, subdomínios do mesmo domínio ou proxy para `/api`). Não foi feito deploy nem teste na AWS.

## Clientes — desenvolvimento local

Por padrão, o servidor escuta somente nesta máquina (`127.0.0.1`). Clientes exige login e permite os perfis administrador e funcionario. Nas operações POST/PUT, envie também o cabeçalho `X-CSRF-Token` recebido após o login. No Insomnia, use `http://localhost:3333/api/v1/clientes` (ou a porta definida no `.env`).

| Método e caminho | Finalidade |
|---|---|
| `POST /api/v1/clientes` | Cadastrar |
| `GET /api/v1/clientes` | Listar |
| `GET /api/v1/clientes/:id` | Consultar um cliente |
| `PUT /api/v1/clientes/:id` | Editar |

Exemplo fictício para POST/PUT, com `Content-Type: application/json`:

```json
{
  "nome": "Cliente de exemplo",
  "telefone": "00000000000",
  "endereco": "Rua Fictícia, 10"
}
```

`email` e `observacoes` são opcionais. No PUT, envie novamente todos os campos obrigatórios; opcionais ausentes ficam nulos. Respostas de sucesso usam `{"dados": ...}`.

`clienteRoutes.ts` define os caminhos; `clienteController.ts` valida entradas e responde; `clienteModel.ts` executa SQL parametrizado; `config/db.ts` compartilha a conexão PostgreSQL usando `DATABASE_URL` e validação TLS.

**Conexão configurada:** `DATABASE_CA_CERT` contém o certificado oficial em formato PEM no `.env`, com quebras de linha representadas por `\n`. `db.ts` lê esse conteúdo e mantém `rejectUnauthorized: true`; não há pasta `certs`. Preencha essa variável ao copiar `.env.example`. Não acrescente `sslmode`, `sslrootcert`, `sslcert` ou `sslkey` à URL, pois o driver substituiria as opções SSL.

O certificado foi obtido do [endereço usado pelo painel oficial](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt), identificado na [configuração pública do Supabase](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json).

**Verificado:** conexão Node–pooler com TLS 1.3 e certificado validado. O SQL de Clientes foi aplicado e as colunas foram conferidas. Cadastro, listagem, consulta e edição foram verificados por HTTP com o Supabase em uma transação revertida ao final. Nenhum registro fictício permaneceu. IDs consumidos na verificação não são recuperados pelo rollback; lacunas são normais.

## Consultas de Materiais, Produtos, OS, Vendas e Movimentações

As sete tabelas restantes foram aplicadas no Supabase pelo script `backend/src/database/entidades.sql`. Clientes, Funcionários e dados existentes foram preservados. Novos Models executam as consultas; Controllers validam o ID e respondem; Routes definem os endereços. Nenhuma dependência foi acrescentada nesta etapa.

No Insomnia, faça login conforme explicado acima e mantenha o cookie. Todos os endereços abaixo são **GET** e começam com `http://localhost:3333/api/v1`:

| Recurso | Listar | Consultar um registro |
|---|---|---|
| Materiais | /materiais | /materiais/:id |
| Produtos para venda | /produtos | /produtos/:id |
| Ordens de serviço | /ordens-servico | /ordens-servico/:id |
| Vendas | /vendas | /vendas/:id |
| Movimentações | /movimentacoes-estoque | /movimentacoes-estoque/:id |

Itens de uma venda: `/vendas/:id/itens`. Materiais utilizados em uma OS: `/ordens-servico/:id/materiais`. Substitua `:id` pelo identificador; se a venda/OS não existir, retorna 404; se existir sem itens/usos, retorna `{"dados": []}`. Ambos os perfis autenticados podem consultar. GET não exige token CSRF.

As listagens não têm filtros/paginação nesta etapa. Retornam `{"dados": [...]}` e consultas individuais `{"dados": {...}}`. Valores e quantidades são strings decimais para preservar precisão. Datas de OS usam YYYY-MM-DD; instantes de venda/movimentação usam ISO UTC. As novas tabelas estão vazias: nenhum dado de demonstração permaneceu.

**Operações disponíveis:** cadastros/edição/exclusão de Materiais e Produtos; exclusão de Clientes sem vínculos; abertura/edição/status/consumo/devolução de OS; registro e cancelamento de Vendas; entradas, saídas e estornos de estoque. Ambos os perfis podem operar; Funcionários continua exclusivo do administrador. Rotas, corpos e exemplos no [contrato da API](docs/api.md).

O saldo inicia em zero e muda somente por operações de estoque. Vendas e consumo usam transações: qualquer falta de saldo desfaz a operação inteira. Datas são automáticas. Preço da venda vem do produto e fica no histórico; total é calculado no back-end. Valor da OS continua manual.

A alteração incremental `backend/src/database/operacoes.sql` já foi aplicada e conferida no Supabase. Para outro banco, aplicar uma vez, após `clientes.sql`, `funcionarios.sql` e `entidades.sql`. Ela acrescenta restrições e vínculos de cancelamento/reversão; não insere dados. Não execute novamente os scripts em um banco já atualizado.

Verificação desta entrega: `npm run typecheck` e 190 verificações HTTP/PostgreSQL, incluindo concorrência real, CSRF, precisão decimal, rollback e histórico, em schema temporário removido ao final. Os registros existentes foram preservados. Não foi criada pasta de testes nem arquivos compilados.

**Verificação:** typecheck e 190 verificações de estrutura, obrigatoriedade, relacionamentos, restrições e HTTP com PostgreSQL real. Dados temporários foram revertidos, preservando os registros existentes. Nenhum servidor de verificação permanece iniciado.

## Organização

```text
frontend/       Aplicação React com Vite
backend/        Servidor Express e base da API
docs/           Guia e documentação do projeto
README.md       Visão geral e execução local
CONTRIBUTING.md Regras de colaboração
CHANGELOG.md    Histórico de mudanças relevantes
```

## Colaboração e histórico

Integrantes da equipe e colaboradores externos podem consultar o [guia de contribuição](CONTRIBUTING.md). As mudanças relevantes ficam no [CHANGELOG](CHANGELOG.md).
