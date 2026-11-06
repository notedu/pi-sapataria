# Rascunho de commit e Pull Request — Fechamento de caixa

## Mensagem de commit

```text
feat: adiciona fechamento diário automático e manual
```

## Pull Request

### Título

```text
feat: adiciona fechamento diário automático e manual
```

### Descrição

Implementa o fechamento diário de caixa no Financeiro (RF-028), com apuração automática ou conferência manual.

### Alterações

- O modo automático soma os pagamentos e saídas registrados para a data escolhida.
- O modo manual permite selecionar pagamentos existentes e incluir entradas ou saídas avulsas com descrição e valor. Entradas também registram forma de pagamento e origem.
- A prévia apresenta recebimentos por forma e origem, saídas e total líquido.
- O histórico guarda uma fotografia dos valores e, nos fechamentos manuais, os pagamentos selecionados e itens avulsos.
- Uma data aceita apenas um fechamento. Registros posteriores não alteram o fechamento salvo.
- Os itens avulsos pertencem somente ao fechamento; não alteram OS, vendas, estoque ou lançamentos financeiros.
- O acesso permanece exclusivo do Administrador, conforme RN-003.

### Banco de dados

As migrações `backend/src/database/migrations/20261105_fechamento_caixa.sql` e `backend/src/database/migrations/20261106_fechamento_caixa_manual.sql` estão preparadas e ainda não foram aplicadas ao banco existente. `backend/src/database/schema.sql` foi atualizado para instalações novas.

### Verificações

- `backend/`: `npm run typecheck` — passou.
- `frontend/`: `npm run lint` — passou.
- `frontend/`: `npm run build` — passou.
- `git diff --check` — passou.
- Não foi executado teste de integração com PostgreSQL; as migrações não foram aplicadas.

### Documentação

Atualizados RF-028, regras financeiras, contrato da API, modelo de dados, fluxo de tela e CHANGELOG.
