# Autenticação

O sistema autentica funcionários pela tabela `usuarios`, separada de `clientes`.
O login normaliza o nome de usuário para minúsculas. Usuários precisam estar ativos.
Todos os usuários autenticados acessam os módulos atuais; `perfil` ainda não restringe
permissões por módulo. Não há cadastro público nem tela de criação de usuários.

## Preparar o primeiro administrador

No terminal, dentro de `backend`:

```sh
npm ci
npm run auth:setup -- --generate-password
npm run dev
```

O comando usa `DATABASE_URL` do `backend/.env`, cria as tabelas `usuarios` e
`sessoes` e cadastra somente `admin`. Exibe a senha aleatória uma única vez: guarde-a
em um gerenciador de senhas. Reexecutar preserva o admin e a senha existentes.
Alternativamente, defina `ADMIN_PASSWORD` no `.env` (12 a 128 caracteres) e execute
`npm run auth:setup` sem a opção de geração; remova essa variável após criar a conta.
Não é necessário executar o seed de clientes nem recriar o banco.

Em outro terminal, dentro de `frontend`, execute `npm ci` e `npm run dev`.
Abra http://localhost:5173/login. A entrada leva a `/dashboard`, cujo conteúdo
continua sob responsabilidade do integrante de Atendimento.
O frontend usa a API na porta 3333 do mesmo hostname por padrão. Se configurar
`VITE_API_URL`, inclua `/api/v1` e use o mesmo hostname (localhost ou 127.0.0.1)
nos dois serviços. Reinicie o Vite após alterar suas variáveis.

## Sessões e endpoints

- `POST /api/v1/auth/login`: corpo `{ "usuario": "admin", "senha": "..." }`.
- `GET /api/v1/auth/me`: recupera o usuário da sessão, sem senha ou hash.
- `POST /api/v1/auth/logout`: revoga a sessão e remove o cookie.
- `/api/v1/health` é público; os demais endpoints exigem sessão.

A senha usa scrypt com salt aleatório. O cookie HttpOnly contém um token aleatório;
somente seu SHA-256 fica no banco. A sessão dura oito horas e sobrevive ao reinício
da API. Sair revoga o token no servidor; sessões de usuários inativos são rejeitadas.
O frontend verifica a sessão ao abrir/recarregar e redireciona ao login após 401.
Os endpoints de escrita exigem um cabeçalho Origin permitido em `FRONTEND_URL`;
clientes como Postman também devem enviar Origin e preservar o cookie.
São permitidas dez tentativas por IP em quinze minutos por instância da API.

## Publicação

Em produção, use HTTPS e `NODE_ENV=production` para cookies Secure. Configure
`FRONTEND_URL` com a origem exata da interface. Publique frontend/API no mesmo site
(mesmo domínio base, preferencialmente um proxy `/api`) para SameSite=Lax.
Para múltiplas instâncias, migre o limitador em memória para um armazenamento compartilhado.
A conexão PostgreSQL existente usa TLS sem verificação de certificado; configure
a CA do provedor antes de publicar. Recuperação de senha ainda exige atendimento
do administrador; não há envio de e-mail ou redefinição automática nesta etapa.
