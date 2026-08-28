# Sapataria Couro e Seda — Sistema de Gestão

> **Sobre este projeto:** este é um Projeto Integrador (PI) desenvolvido para fins **didáticos**, na
> disciplina de Desenvolvimento de Aplicação Web — UNIFEOB, Ciência da Computação, 4º Módulo (2026/2).
> A **Sapataria Couro e Seda** é uma empresa real, que gentilmente aceitou ser parceira do projeto como
> estudo de caso, mas o sistema aqui desenvolvido é um **protótipo acadêmico** — não é o sistema oficial
> de gestão da empresa, nem está em produção comercial. Dados de exemplo (clientes, funcionários, etc.)
> usados para teste são fictícios.

Sistema de gestão para uma sapataria, cobrindo cadastro de clientes e funcionários, catálogo de
serviços, abertura e acompanhamento de ordens de serviço, e controle de estoque (matéria-prima e
produtos de venda).

## Status do projeto

- [x] Modelagem do banco de dados (PostgreSQL)
- [x] API RESTful do back-end — CRUD completo de todos os módulos
- [ ] Front-end em React
- [ ] Deploy em nuvem (AWS Academy)
- [ ] Documentação de custos e plano de implantação em nuvem

## Integrantes da equipe

| Nome | Papel |
|---|---|
| João V. Franco | Colaborador Lider |
| João V. Contin | Colaborador |
| Eduardo Lima | Colaborador |

## Tecnologias utilizadas

**Back-end**
- Node.js
- TypeScript
- Express 5
- PostgreSQL (via biblioteca `pg`)
- tsx (execução TypeScript em desenvolvimento)

**Front-end** _(em desenvolvimento)_
- React
- Vite

## Estrutura do repositório

```
pi-sapataria/
├── backend/
│   ├── src/
│   │   ├── config/         # conexão com o PostgreSQL (pool)
│   │   ├── controllers/    # regras de cada rota (validação, status HTTP)
│   │   ├── models/         # queries SQL de cada entidade
│   │   ├── routes/         # definição dos endpoints
│   │   ├── middlewares/    # (reservado para autenticação/validação futuras)
│   │   ├── services/       # (reservado para regras auxiliares reutilizáveis)
│   │   ├── database/
│   │   │   ├── migrations/ # versionamento da estrutura do banco
│   │   │   ├── seeds/      # script de dados de teste (seed.ts)
│   │   │   └── schema.sql  # script de criação das tabelas
│   │   └── app.ts          # configuração do Express e registro das rotas
│   ├── server.ts           # inicialização do servidor
│   ├── .env.example        # modelo das variáveis de ambiente
│   └── package.json
│
└── frontend/                # ainda em fase de design
```

## Modelagem do banco de dados

Foram criadas 6 tabelas no PostgreSQL:

| Tabela | Descrição |
|---|---|
| `clientes` | Cadastro de clientes da sapataria |
| `funcionarios` | Cadastro de funcionários |
| `servicos` | Catálogo dos tipos de serviço oferecidos (ex: "Troca de sola") |
| `ordens_servico` | Ordens de serviço abertas, ligadas a cliente, funcionário e serviço via FK |
| `estoque_materia_prima` | Insumos usados na fabricação/manutenção (ex: couro, cola, linha) |
| `estoque_produtos_venda` | Produtos prontos vendidos na loja |

A tabela `ordens_servico` referencia `clientes`, `funcionarios` e `servicos` por ID (chave estrangeira),
em vez de repetir dados — princípio de normalização.

O script completo de criação das tabelas está em `backend/src/database/schema.sql`.

## Como rodar o projeto localmente

### Pré-requisitos
- Node.js instalado
- PostgreSQL instalado e em execução

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd pi-sapataria/backend
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as variáveis de ambiente
Copie o arquivo de exemplo e preencha com os dados do seu PostgreSQL local:
```bash
cp .env.example .env
```

Variáveis necessárias no `.env`:
```
PORT=3333
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=pi-sapataria
```

### 4. Criar o banco e as tabelas
Crie um banco chamado `pi-sapataria` no PostgreSQL e execute o script:
```bash
psql -U postgres -d pi-sapataria -f src/database/schema.sql
```

### 5. Popular o banco com dados de teste (opcional)
```bash
npm run seed
```

### 6. Iniciar o servidor em modo desenvolvimento
```bash
npm run dev
```

O servidor sobe em `http://localhost:3333`. Para confirmar que está no ar:
```
GET http://localhost:3333/api/v1/health
```

## Endpoints da API

Todas as rotas são prefixadas com `/api/v1`.

### Clientes
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/clientes` | Lista todos os clientes |
| GET | `/clientes/:id` | Detalha um cliente |
| POST | `/clientes` | Cadastra um cliente |
| PUT | `/clientes/:id` | Atualiza um cliente |
| DELETE | `/clientes/:id` | Remove um cliente |

### Funcionários
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/funcionarios` | Lista todos os funcionários |
| GET | `/funcionarios/:id` | Detalha um funcionário |
| POST | `/funcionarios` | Cadastra um funcionário |
| PUT | `/funcionarios/:id` | Atualiza um funcionário |
| DELETE | `/funcionarios/:id` | Remove um funcionário |

### Serviços (catálogo)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/servicos` | Lista o catálogo de serviços |
| GET | `/servicos/:id` | Detalha um serviço |
| POST | `/servicos` | Cadastra um serviço no catálogo |
| PUT | `/servicos/:id` | Atualiza um serviço |
| DELETE | `/servicos/:id` | Remove um serviço |

### Ordens de serviço
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/ordens-servico` | Lista as ordens de serviço |
| GET | `/ordens-servico/:id` | Detalha uma ordem de serviço |
| POST | `/ordens-servico` | Abre uma nova ordem de serviço |
| PUT | `/ordens-servico/:id` | Atualiza uma ordem de serviço |
| DELETE | `/ordens-servico/:id` | Remove uma ordem de serviço |

### Estoque — Matéria-prima
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/estoque-materia-prima` | Lista os itens de matéria-prima |
| GET | `/estoque-materia-prima/:id` | Detalha um item |
| POST | `/estoque-materia-prima` | Cadastra um item |
| PUT | `/estoque-materia-prima/:id` | Atualiza um item |
| DELETE | `/estoque-materia-prima/:id` | Remove um item |

### Estoque — Produtos de venda
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/estoque-produtos-venda` | Lista os produtos de venda |
| GET | `/estoque-produtos-venda/:id` | Detalha um produto |
| POST | `/estoque-produtos-venda` | Cadastra um produto |
| PUT | `/estoque-produtos-venda/:id` | Atualiza um produto |
| DELETE | `/estoque-produtos-venda/:id` | Remove um produto |

## Segurança

- O arquivo `.env` (com as credenciais reais do banco) nunca é versionado — está listado no
  `.gitignore` e um `.env.example` (sem valores sensíveis) é fornecido como modelo.
- Todas as queries ao banco são feitas de forma parametrizada (`$1, $2...`), prevenindo SQL Injection.

## Próximos passos

- Desenvolvimento do front-end em React, consumindo esta API.
- Deploy da aplicação na AWS Academy (API + banco + front-end).
- Levantamento comparativo de custos entre AWS, Azure e GCP.
- Documentação do plano de implantação em nuvem.