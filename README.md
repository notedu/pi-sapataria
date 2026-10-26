# Seda e Couro — Gestão da Sapataria

Sistema web de gestão interna para a sapataria **Seda e Couro**, de Santa Cruz das Palmeiras–SP. O objetivo é reunir cadastros, ordens de serviço, vendas, estoques e informações financeiras para apoiar o trabalho diário da loja.

Desenvolvido como Projeto Integrado do módulo **Desenvolvimento de Aplicação Web**, do **UNIFEOB**, no 2º semestre de 2026.

> **Em desenvolvimento:** a página pública em `/` apresenta a Seda e Couro, serviços, fotos da loja e formas de contato; “Acessar o sistema” abre `/login`. Clientes, Funcionários, Dashboard, Busca, Estoque, Ordens de Serviço, Financeiro e Configurações estão integrados à API. Financeiro e gestão de Funcionários são exclusivos do Administrador. Configurações oferece dados de acesso, troca de senha, preferências locais por usuário e endereço comercial somente ao Administrador. `backend/src/database/schema.sql` reúne o esquema completo para um banco novo; não o execute no banco já usado pelo projeto.

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

Abra `/login` no endereço exibido no terminal, normalmente `http://localhost:5173/login`. A tela utiliza o tema de `frontend/src/index.css` e o logo local. Para encerrar o servidor, pressione `Ctrl+C`.

Para autenticar, execute também o back-end e use uma conta de teste autorizada já cadastrada. O front-end usa `http://localhost:3333/api/v1` por padrão. Para outro endereço, copie `frontend/.env.example` para `frontend/.env`, ajuste `VITE_API_URL` e reinicie o Vite. Essa variável é pública e não deve conter segredos. O `APP_ORIGIN` do back-end deve corresponder à origem exata do front-end; utilize o mesmo hostname nos dois serviços (por exemplo, `localhost`).

O login obtém CSRF e envia usuário/senha com cookie de sessão. Exibe erros na tela e bloqueia novos envios durante a requisição. Após sucesso confirmado pela API, limpa o formulário e abre `/dashboard`. Recuperação de senha continua pendente. Componentes `Button` e `InputField` centralizam os controles; `src/services/auth.ts` concentra a autenticação e reutiliza `src/services/api.ts` para requisições com cookie e CSRF. A fonte Hanken Grotesk é carregada pelo Google Fonts, com alternativa `sans-serif`.

Verificação inicial do login: lint e build aprovados; testes de navegador com respostas simuladas da API cobriram campos obrigatórios, CSRF, sucesso, bloqueio de envio duplicado e erros. Layout conferido em desktop e celular. Autenticação contra o banco real não foi verificada nesta entrega; nenhuma conta existente foi utilizada.

Outros comandos, executados dentro de `frontend/`:

| Comando | Finalidade |
|---|---|
| `npm run lint` | Verificar o código com ESLint |
| `npm run build` | Verificar TypeScript e gerar a aplicação em `frontend/dist/` |
| `npm run preview` | Visualizar localmente o build, após executar `npm run build` |

## Navegação interna

**Complemento de Estoque:** condições comerciais opcionais em campos separados por fornecedor (prazo, meios de pagamento, desconto e moeda), apenas informativas. A definição desses campos está em `backend/src/database/schema.sql`; no banco configurado, a atualização foi aplicada e conferida. Botão Histórico consulta movimentos por item na API existente. Registrar Saída até zerar mantém o Material listado e seu histórico; isso não é exclusão de cadastro. Verificação integrada ampliada para 87 verificações HTTP, incluindo persistência das condições e preservação do item/histórico após saída total.

**Estoque — compras, mínimos e histórico (15/10/2026):** Produtos têm mínimo por item e alertas visuais são recalculados a partir dos saldos atuais. Compras salvam fornecedor, itens e preço histórico e lançam entradas atomicamente, sem alterar o preço cadastrado. A tela permite consultar os dados completos dos fornecedores, cadastrar categorias, informar saldo inicial e consultar o histórico geral. A opção de importação CSV foi retirada da interface; a rota permanece disponível na API. A estrutura de categorias foi aplicada ao PostgreSQL configurado e está no esquema consolidado.

**Melhorias de Estoque em 13/10/2026:** cadastro/edição sugere categorias, oferece kg/g para Cola e permite selecionar vários fornecedores opcionalmente na mesma operação do item. Fornecedores têm nome obrigatório e CNPJ, razão social, nome fantasia, CEP, número, e-mail e telefone opcionais, com consulta de CEP reutilizada. Materiais com saldo ou movimentações têm unidade bloqueada para proteger custo e histórico, mesmo com saldo novamente zero. Nenhuma conversão de unidades foi adicionada. A definição está em `backend/src/database/schema.sql`; a alteração foi aplicada ao PostgreSQL configurado em 13/10/2026, preservando cadastros antigos.

Verificações desta melhoria: lint/build do front-end, tipos do back-end e 78 verificações HTTP/PostgreSQL, além de cálculos de CNPJ/formatadores/unidades; conta e dados fictícios usados em transação com rollback. Cenários incluem cadastro e edição atômicos com fornecedores, preservação de opcionais/vínculos omitidos, validação dos novos campos e bloqueio de unidade na API e direto no banco. O teste versionado permanece em `backend/scripts/verificarEstoque.cjs`.

**Estoque funcional:** `/estoque` está ligado ao menu principal para Administrador e Funcionário. Oferece Produtos para venda e Materiais, cadastros, edição, exclusão conforme vínculos/saldo, entradas/saídas e fornecedores associados opcionalmente a vários itens. Lucro previsto por produto é venda menos compra, com percentual sobre o custo. A estrutura completa está em `backend/src/database/schema.sql`; no banco configurado, a relação com fornecedores foi aplicada em 02/10/2026. Os trechos históricos que ainda indicam Estoque em construção foram superados por esta entrega.

Verificação integrada disponível em `backend/`: `node --import tsx scripts/verificarEstoque.cjs`. Usa PostgreSQL real com conta/dados fictícios em transação e rollback, cobrindo sessão/CSRF, cadastros, fornecedores múltiplos, movimentação e exclusões. Não usa contas existentes. Não executar junto a alterações de esquema. O modo `--navegador` mantém essa mesma aplicação na porta 3334 até encerrar o processo; para conferência visual, executar o front-end com `VITE_API_URL=http://localhost:3334/api/v1` e porta 5174. Essa configuração é exclusiva do teste e não altera os arquivos de ambiente normais.

Após o login, `AppLayout` consulta `/auth/me` em cada mudança de rota e mantém a estrutura com `Sidebar` montada entre navegações. As páginas são divididas em arquivos carregados sob demanda ao acessar cada rota; durante a verificação de sessão ou o primeiro carregamento da página, a área de conteúdo mostra um estado de carregamento sem substituir a navegação compartilhada. Nome e perfil vêm da API; o perfil é exibido como Administrador ou Funcionário, sem inventar cargo profissional. `src/config/navegacao.ts` reúne os nomes e caminhos usados pelo menu e pelas rotas.

Dashboard mostra contagens de OS por estado e entradas do dia, calculadas a partir da lista da API, além de atalhos para OS. Busca localiza clientes, OS, funcionários para Administradores e as páginas disponíveis para o perfil conectado, incluindo cadastros e caminhos para perfis individuais. Ordens de Serviço oferece lista com filtros locais, cadastro, detalhes, edição de OS Aberta ou Em andamento, avanço/cancelamento conforme os estados permitidos e registro de uso de material pela API. O valor da OS é manual; não há imposto automático, faturamento ou status de pagamento nesta interface. Funcionários é exclusivo do Administrador; o acesso direto de funcionário a `/funcionarios` retorna ao Dashboard.

No cadastro de OS, **Cadastrar cliente** abre o formulário de Clientes. Quando o cadastro começa por esse botão e termina com sucesso, o sistema volta à nova OS, conserva os campos já preenchidos e seleciona o cliente recém-cadastrado. O cadastro iniciado pela área de Clientes continua retornando à lista de Clientes.

O cliente também pode ser escolhido por busca de nome ou telefone com sugestões no próprio formulário de OS. O serviço solicitado oferece os valores já registrados em outras OS e **Outros** para texto livre; isso não cria um catálogo. O perfil do cliente mostra o nome e a situação ativa/inativa do funcionário responsável por cada OS. No detalhe da OS, **Imprimir** baixa um PDF A4 com as informações da ordem.

O campo **Valor da OS** no cadastro e na edição formata a digitação em reais e centavos (`123456` → `R$ 1.234,56`). A interface envia `1234.56` à API, preservando o valor manual e a validação do servidor.
Estoque possui a tela funcional descrita acima. Financeiro consulta dados da API e está habilitado somente para Administrador. Configurações está disponível aos dois perfis para preferências pessoais; dados comerciais são exclusivos do Administrador. A apuração de impostos, lucro líquido e emissão fiscal continua indisponível enquanto as regras correspondentes estiverem pendentes.

Sem sessão válida, o acesso interno volta ao login. Falhas de conexão oferecem nova tentativa. “Sair” obtém CSRF e encerra a sessão na API; em caso de falha, mostra o erro sem afirmar que a sessão terminou. O menu se expande no celular e fecha ao navegar. A API continua responsável por validar todas as operações protegidas.

Verificação desta etapa: lint e build aprovados; testes no navegador com API simulada cobriram login→Dashboard, seis áreas, os dois perfis, acesso direto restrito, recarga, sessão inválida, falha de rede com nova tentativa, logout com sucesso/erro e menu móvel. Layout conferido em 1280 × 900 e 390 × 844. Nenhuma conta ou banco real foi utilizado.

## Financeiro — consulta integrada à API

Entre como Administrador e abra **Financeiro** no menu ou em `/financeiro`. O acesso é exclusivo do Administrador tanto na interface quanto na API; a sessão interna é reutilizada e a rota sem sessão volta ao login. O botão **Voltar** retorna ao Dashboard.

A tela consulta lançamentos, pagamentos e contas/parcelas no banco. Permite selecionar hoje, semana, mês ou intervalo personalizado, filtrar movimentos por tipo e origem, consultar os resumos financeiros e abrir detalhes de pagamentos e parcelas. A API também oferece operações administrativas para registrar despesas, pagamentos parciais ou totais e estornos com motivo.

Os valores apresentados seguem o regime de caixa definido para os registros disponíveis. Impostos, lucro líquido e emissão de notas fiscais permanecem indisponíveis enquanto suas regras não forem definidas (RN-014 a RN-017). O esquema para uma instalação nova está em `backend/src/database/schema.sql`; ele não deve ser executado no banco já utilizado pelo projeto.

## Funcionários — cadastro, perfil e edição


Como Administrador, abra **Funcionários → Novo funcionário**. Informe nome, CPF válido, telefone de 11 dígitos, e-mail, usuário, perfil, senha de 15–128 caracteres e confirmação. CPF/telefone usam máscaras e são enviados sem pontuação. A conta começa ativa; somente o hash da senha é gravado.

A lupa na lista abre `/funcionarios/:id`, com identificação, dados pessoais, informações de acesso e OS por responsável. **Meu perfil**, na sidebar, abre `/meu-perfil` para qualquer conta: Funcionário comum só consulta a si mesmo; Administrador consulta os demais e pode editar.

**Editar perfil** abre `/funcionarios/:id/editar` para alterar nome, e-mail, CPF e telefone. Cadastro e edição reutilizam `FormularioFuncionario`. Salvar exige a senha do Administrador conectado, validada pela API; usuário, senha de login, perfil e situação não são alterados nessa edição. Resultado incerto bloqueia reenvio até conferir o perfil. Senhas não são guardadas no navegador.

**Desativar funcionário** fica no perfil, com confirmação da senha própria; bloqueia desativar a própria conta e mantém as proteções/históricos existentes. A conta desativada permanece consultável pelo Administrador, mas perde o acesso. Sem reativação na interface.

**Banco:** a estrutura de CPF e telefone está aplicada ao banco existente e consta em `backend/src/database/schema.sql` para instalações novas. Registros antigos podem continuar com CPF/telefone não informados; continuam desativáveis, mas a edição pessoal exige preencher esses campos. O comando `npm run criar:admin` também os solicita. Não execute o esquema completo no banco existente. Não há upload de foto; o avatar usa iniciais.

Verificado: lint/build/typecheck; 52 verificações HTTP de perfil/edição, 33 de desativação e 29 de Clientes em PostgreSQL local descartável, incluindo permissões, senha, CSRF, migração/legado, histórico, sessões e concorrência. Navegador com API simulada: cadastro, perfil, edição com senha, cancelamento, resultado incerto, ambos os perfis e responsividade. Esses testes foram executados durante o desenvolvimento; os scripts de `backend/tests` foram posteriormente removidos a pedido da equipe. Nenhuma conta real foi modificada.

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

Informe seu nome, usuário, e-mail, CPF, telefone e senha. A senha não aparece no terminal; precisa ter entre 15 e 128 caracteres. O comando só permite o cadastro inicial enquanto não houver funcionários; os próximos são cadastrados pelo administrador autenticado. Nenhuma conta padrão ou fictícia foi criada.

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
  "cpf": "52998224725",
  "telefone": "11999999999",
  "email": "carlos@example.invalid",
  "senha": "Uma frase de exemplo 2026",
  "perfil": "funcionario"
}
```

Todos esses campos são obrigatórios; `ativo` pode ser omitido e começa como `true`. O usuário é único, mesmo com diferenças de maiúsculas/minúsculas; e-mail não é identificador de login nem tem unicidade exigida. Para desativar pela alteração de acesso, envie `{"perfil":"funcionario","ativo":false,"senha_admin":"sua senha"}`. A própria desativação é proibida. A mudança invalida as sessões anteriores; reativar exige novo login. Alterar o próprio perfil também invalida a própria sessão.

Senhas recebem hash scrypt com salt individual e nunca são devolvidas. A sessão tem limite absoluto de 8 horas. Há limite de 10 tentativas por usuário e 50 por IP a cada janela de 15 minutos; um login correto limpa o contador do usuário, mas não o do IP. A mensagem de credenciais inválidas é igual para usuário inexistente, senha incorreta e conta inativa. Recuperação/troca de senha, exclusão e a tela de login ficam para etapas posteriores.

### Estrutura e verificação

- `src/models/funcionarioModel.ts`: consultas de Funcionários e criação do primeiro administrador.
- `src/controllers/authController.ts` e `funcionarioController.ts`: fluxo de login e validação dos cadastros.
- `src/routes/authRoutes.ts` e `funcionarioRoutes.ts`: endereços da API.
- `src/middlewares/`: verificação de login, perfil e token CSRF.
- `src/config/sessao.ts`: cookie e sessões persistidas; `src/utils/senha.ts`: hash de senha.
- `src/database/schema.sql`: esquema completo ordenado para instalação em banco novo. As tabelas de Funcionários e de sessão foram aplicadas ao Supabase em etapas anteriores; não execute o arquivo completo nesse banco.

`npm run typecheck` verifica os tipos usando `backend/tsconfig.json`, que também orienta o editor e inclui as declarações de sessão. A opção `noEmit` impede a geração de JavaScript ou da pasta `dist`. Foram executadas verificações HTTP com o PostgreSQL real, em uma transação desfeita ao final: cadastro, usuário duplicado, senha, login/logout, expiração, CSRF, permissões, inativação/reativação e limites de tentativas. Registros existentes de Clientes foram preservados; nenhum funcionário de teste permaneceu.

### Migração futura para AWS

O código de login e as tabelas acompanham a aplicação. Em produção, configure `NODE_ENV=production`, `APP_ORIGIN` com a origem HTTPS exata do front-end e os dados TLS do novo PostgreSQL. O cookie passa a exigir HTTPS. Ajuste `HOST` conforme a implantação. Se houver proxy/load balancer, configure `TRUST_PROXY` somente com seus endereços ou redes confiáveis; isso determina a identificação de HTTPS e do IP do cliente. Com SameSite=Lax, mantenha front-end e API no mesmo site (por exemplo, subdomínios do mesmo domínio ou proxy para `/api`). Não foi feito deploy nem teste na AWS.

## Clientes — interface

Acesse **Clientes → Novo cliente**, como Administrador ou Funcionário. Nome, CPF, telefone, CEP e número são obrigatórios; e-mail e observações permanecem opcionais. CPF, telefone e CEP têm máscaras e são enviados sem pontuação. O telefone exige 11 dígitos. O ViaCEP mostra rua, bairro, cidade e estado; indisponibilidade permite nova tentativa e não impede salvar CEP/número.

A listagem mantém nome, telefone e e-mail. Clique na lupa em Ações para abrir `/clientes/:id`: informações pessoais, endereço, data de cadastro e OS vinculadas. Falha de consulta e ausência de OS têm mensagens distintas. Registros antigos preservam o endereço e mostram dados desconhecidos como não informados.

As páginas reutilizam `AppLayout`, `Sidebar`, `Button`, `InputField`, `TextareaField` e o serviço HTTP/CSRF. `EnderecoPorCep` compartilha consulta e apresentação entre cadastro e perfil; `FormularioCliente` compartilha campos/validações entre cadastro e edição. `CartaoInformacoes` organiza o novo perfil inspirado na referência visual, usando o tema existente. O perfil permite excluir com confirmação, cookie/CSRF e retorno à lista. Clientes com OS vinculadas são preservados (RN-020); resultado incerto orienta consultar a lista antes de repetir. O botão Editar abre `/clientes/:id/editar`, com campos preenchidos e formulário compartilhado com o cadastro. Permite editar nome, CPF, telefone, CEP, número, e-mail e observações, enviando PUT com CSRF e retornando ao perfil. Cancelar não grava alterações. Cadastro mantém proteção contra envio duplicado e resultado incerto.

**Banco:** `backend/src/database/schema.sql` inclui os campos novos para uma instalação limpa. Essa evolução ainda não foi aplicada ao banco existente; não execute o esquema completo nesse banco. Não preenche CPF nem data fictícios. Registros antigos podem continuar sem os novos campos; uma edição exige completar os obrigatórios.

Verificado: lint/build/typecheck, 29 verificações HTTP com PostgreSQL local descartável e navegador com API/ViaCEP simulados, incluindo máscaras, validações, perfis, OS, legado, erros e responsividade. A integração com ViaCEP real e o banco remoto não foram exercitados nesta entrega.

## Clientes — desenvolvimento local

Por padrão, o servidor escuta somente nesta máquina (`127.0.0.1`). Clientes exige login e permite os perfis administrador e funcionario. Nas operações POST/PUT, envie também o cabeçalho `X-CSRF-Token` recebido após o login. No Insomnia, use `http://localhost:3333/api/v1/clientes` (ou a porta definida no `.env`).

| Método e caminho | Finalidade |
|---|---|
| `POST /api/v1/clientes` | Cadastrar |
| `GET /api/v1/clientes` | Listar |
| `GET /api/v1/clientes/:id` | Consultar um cliente |
| `GET /api/v1/clientes/:id/ordens-servico` | Consultar suas OS |
| `PUT /api/v1/clientes/:id` | Editar |

Exemplo fictício para POST/PUT, com `Content-Type: application/json`:

```json
{
  "nome": "Cliente de exemplo",
  "telefone": "00000000000",
  "cpf": "52998224725",
  "cep": "01001000",
  "numero": "10"
}
```

`email` e `observacoes` são opcionais. No PUT, envie novamente todos os campos obrigatórios; opcionais ausentes ficam nulos. Respostas de sucesso usam `{"dados": ...}`.

`clienteRoutes.ts` define os caminhos; `clienteController.ts` valida entradas e responde; `clienteModel.ts` executa SQL parametrizado; `config/db.ts` compartilha a conexão PostgreSQL usando `DATABASE_URL` e validação TLS.

**Conexão configurada:** `DATABASE_CA_CERT` contém o certificado oficial em formato PEM no `.env`, com quebras de linha representadas por `\n`. `db.ts` lê esse conteúdo e mantém `rejectUnauthorized: true`; não há pasta `certs`. Preencha essa variável ao copiar `.env.example`. Não acrescente `sslmode`, `sslrootcert`, `sslcert` ou `sslkey` à URL, pois o driver substituiria as opções SSL.

O certificado foi obtido do [endereço usado pelo painel oficial](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt), identificado na [configuração pública do Supabase](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json).

**Verificado:** conexão Node–pooler com TLS 1.3 e certificado validado. O SQL de Clientes foi aplicado e as colunas foram conferidas. Cadastro, listagem, consulta e edição foram verificados por HTTP com o Supabase em uma transação revertida ao final. Nenhum registro fictício permaneceu. IDs consumidos na verificação não são recuperados pelo rollback; lacunas são normais.

## Consultas de Materiais, Produtos, OS, Vendas e Movimentações

As sete tabelas restantes foram aplicadas no Supabase em etapa anterior; sua definição atual está em `backend/src/database/schema.sql`. Clientes, Funcionários e dados existentes foram preservados. Novos Models executam as consultas; Controllers validam o ID e respondem; Routes definem os endereços. Nenhuma dependência foi acrescentada nesta etapa.

No Insomnia, faça login conforme explicado acima e mantenha o cookie. Todos os endereços abaixo são **GET** e começam com `http://localhost:3333/api/v1`:

| Recurso | Listar | Consultar um registro |
|---|---|---|
| Materiais | /materiais | /materiais/:id |
| Produtos para venda | /produtos | /produtos/:id |
| Ordens de serviço | /ordens-servico | /ordens-servico/:id |
| Vendas | /vendas | /vendas/:id |
| Movimentações | /movimentacoes-estoque | /movimentacoes-estoque/:id |
| Compras de estoque | /compras-estoque | — |
| Importação CSV de estoque | /estoque/importacoes (POST) | — |

Itens de uma venda: `/vendas/:id/itens`. Materiais utilizados em uma OS: `/ordens-servico/:id/materiais`. Substitua `:id` pelo identificador; se a venda/OS não existir, retorna 404; se existir sem itens/usos, retorna `{"dados": []}`. Ambos os perfis autenticados podem consultar. GET não exige token CSRF.

As listagens não têm filtros/paginação nesta etapa. Retornam `{"dados": [...]}` e consultas individuais `{"dados": {...}}`. Valores e quantidades são strings decimais para preservar precisão. Datas de OS usam YYYY-MM-DD; instantes de venda/movimentação usam ISO UTC. As novas tabelas estão vazias: nenhum dado de demonstração permaneceu.

**Operações disponíveis:** cadastros/edição/exclusão de Materiais e Produtos; exclusão de Clientes sem vínculos; abertura/edição/status/consumo/devolução de OS; registro e cancelamento de Vendas; entradas, saídas e estornos de estoque. Ambos os perfis podem operar; Funcionários continua exclusivo do administrador. Rotas, corpos e exemplos no [contrato da API](docs/api.md).

O saldo inicia em zero e muda somente por operações de estoque. Vendas e consumo usam transações: qualquer falta de saldo desfaz a operação inteira. Datas são automáticas. Preço da venda vem do produto e fica no histórico; total é calculado no back-end. Valor da OS continua manual.

As restrições e vínculos de operações já foram aplicados e conferidos no Supabase; a definição atual está em `backend/src/database/schema.sql`. O arquivo completo destina-se a um banco novo e não deve ser executado em banco já atualizado.

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
