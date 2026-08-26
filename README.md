# 👞 Sapataria Couro e Seda — Sistema de Gestão

Sistema interno de gestão desenvolvido como Projeto Integrado (PI) do módulo
**Desenvolvimento de Aplicação Web**, com arquitetura preparada para, futuramente,
integrar um site/portal voltado ao cliente final no mesmo ecossistema.

Projeto de caráter extensionista, beneficiando a **Sapataria Couro e Seda**.

## 📌 Sobre o projeto

O sistema permite:

- Cadastro e gestão de **clientes**;
- Cadastro e gestão de **funcionários**;
- Abertura, acompanhamento e atualização de **ordens de serviço** (conserto de
  calçados/artigos de couro);
- Consulta do status de cada ordem de serviço (pendente, em andamento,
  concluído, entregue).

A aplicação consome dados de um banco **PostgreSQL** por meio de uma **API RESTful**
própria, com uma interface **React** responsiva no front-end, hospedada em nuvem
(AWS Academy).

## 🧱 Tecnologias utilizadas

| Camada         | Tecnologia                              |
|----------------|------------------------------------------|
| Front-end      | React + Vite, React Router, Axios        |
| Back-end       | Node.js + Express                        |
| Banco de dados | PostgreSQL                               |
| Nuvem          | AWS Academy (EC2 / RDS / S3)             |
| Gestão de tarefas | GitHub Projects                       |
| Versionamento  | Git / GitHub                             |

## 📁 Estrutura do repositório

```
sapataria-couro-e-seda/
├── backend/
│   ├── src/
│   │   ├── config/          # conexão com o PostgreSQL
│   │   ├── models/          # definição das tabelas
│   │   ├── controllers/     # regras de negócio
│   │   ├── routes/          # definição dos endpoints
│   │   ├── middlewares/     # validação e tratamento de erros
│   │   ├── services/        # regras auxiliares
│   │   └── database/
│   │       ├── migrations/
│   │       └── seeds/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── sprint-reports/
│   ├── atas/
│   ├── diagrama-er.png
│   ├── plano-implantacao-nuvem.md
│   └── comparativo-custos-nuvem.md
│
├── .gitignore
└── README.md
```

## 🗄️ Modelo de dados (resumo)

- **cliente** `(id_cliente, nome, cpf, telefone, genero, endereco)`
- **funcionario** `(id_funcionario, nome, cpf, telefone, genero, cargo)`
- **servico** `(id_servico, nome_servico, valor_base, ativo)` — catálogo
- **ordem_servico** `(id_os, id_cliente, id_funcionario, id_servico, descricao_item,
  cor_item, observacoes, valor_servico, status, data_entrada, data_previsao,
  data_conclusao)`

Detalhamento completo, com tipos de dados e relacionamentos, no
**Guia do Projeto (PDF)** entregue junto a este arquivo.

## 🔌 Principais endpoints da API

| Método | Rota                                | Descrição                        |
|--------|--------------------------------------|-----------------------------------|
| GET    | `/api/v1/clientes`                  | Lista clientes                    |
| POST   | `/api/v1/clientes`                  | Cadastra cliente                  |
| GET    | `/api/v1/funcionarios`              | Lista funcionários                |
| POST   | `/api/v1/funcionarios`              | Cadastra funcionário              |
| GET    | `/api/v1/ordens-servico`            | Lista ordens de serviço           |
| POST   | `/api/v1/ordens-servico`            | Abre uma ordem de serviço         |
| PATCH  | `/api/v1/ordens-servico/:id/status` | Atualiza o status da ordem        |

## ⚙️ Como rodar o projeto localmente

### Pré-requisitos

- Node.js (versão 18+)
- PostgreSQL instalado localmente (ou via Docker)
- npm ou yarn

### 1. Clonar o repositório

```bash
git clone https://github.com/<usuario-ou-organizacao>/sapataria-couro-e-seda.git
cd sapataria-couro-e-seda
```

### 2. Configurar o back-end

```bash
cd backend
npm install
cp .env.example .env
# edite o .env com as credenciais do seu PostgreSQL local
npm run dev
```

Variáveis esperadas no `.env`:

```env
PORT=3333
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario_db
DB_PASSWORD=usuario_senha
DB_NAME=nome_db
```

### 3. Configurar o front-end

```bash
cd frontend
npm install
npm run dev
```

Por padrão, o front-end roda em `http://localhost:5173` e consome a API em
`http://localhost:3333`.

## ☁️ Deploy (nuvem)

Ambiente de produção hospedado na **AWS Academy**:

- API (Node.js): instância EC2, mantida em execução com PM2.
- Banco de dados: RDS PostgreSQL (ou EC2 com PostgreSQL instalado).
- Front-end: build estático publicado em bucket S3.

Detalhes completos no plano de implantação: `docs/plano-implantacao-nuvem.md`.

## 👥 Equipe

| Nome | Papel |
|------|-------|
| João V. Franco | Líder / Facilitador |
| Eduardo Lima | Integrante |
| João V. Contin | Integrante |

## 📄 Status do projeto

🚧 Em desenvolvimento — Projeto Integrado, 2º semestre de 2026.

## 🎯 ODS relacionado

ODS 8 — Trabalho Decente e Crescimento Econômico _(a confirmar com o orientador)_.
