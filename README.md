# Seda e Couro — Gestão da Sapataria

Sistema web de gestão interna para a sapataria **Seda e Couro**, de Santa Cruz das Palmeiras–SP. O objetivo é reunir cadastros, ordens de serviço, vendas, estoques e informações financeiras para apoiar o trabalho diário da loja.

Desenvolvido como Projeto Integrado do módulo **Desenvolvimento de Aplicação Web**, do **UNIFEOB**, no 2º semestre de 2026.

> **Em desenvolvimento inicial:** o repositório contém a aplicação de exemplo do React com Vite. As telas de negócio, a API e o banco de dados ainda não foram implementados.

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
| Configuradas | React e TypeScript para a interface; Vite para desenvolvimento e build; ESLint para análise do código |
| Previstas no guia | Tailwind CSS para estilos; Node.js para a API RESTful; PostgreSQL para persistência |
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

## Organização

```text
frontend/       Aplicação React com Vite
backend/        Pasta reservada para a futura API
docs/           Guia e documentação do projeto
README.md       Visão geral e execução local
CONTRIBUTING.md Regras de colaboração
CHANGELOG.md    Histórico de mudanças relevantes
```

## Colaboração e histórico

Integrantes da equipe e colaboradores externos podem consultar o [guia de contribuição](CONTRIBUTING.md). As mudanças relevantes ficam no [CHANGELOG](CHANGELOG.md).
