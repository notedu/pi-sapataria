# Contrato inicial da API — visão do sistema

[Índice](README.md) · [Modelo de dados](modelo-de-dados.md) · [Telas e fluxos](telas-e-fluxos.md)

## Rota implementada de verificação

`GET /api/v1/health` retorna HTTP `200` com `{"status":"ok","mensagem":"Servidor funcionando"}`. É uma rota pública, sem consulta ao banco, para confirmar que o servidor Express está respondendo. A base atende à etapa inicial de Node.js, HTTP e versionamento do RNF-003; o estado das demais operações é indicado na tabela abaixo.

## Operações e situação atual

O contrato combina como front-end e back-end trocam pedidos e respostas. **Clientes, autenticação, Funcionários, Materiais, Produtos, OS, Vendas e Movimentações estão disponíveis nas operações indicadas abaixo**. O prefixo `/api/v1` foi adotado nas rotas implementadas; detalhes das rotas restantes continuam propostos (Guia §§9.2–9.4; RNF-009/RNF-010). Os caminhos da tabela recebem esse prefixo. Os objetivos das funcionalidades são definidos no guia; isso não aprova automaticamente seus detalhes.

| ID | Funcionalidade | Método e caminho após `/api/v1` | Finalidade | Permissão | Situação |
|---|---|---|---|---|---|
| A01 | Autenticação | `POST /auth/login` | Entrar | Público, com CSRF e limite de tentativas | Implementado |
| A02 | Autenticação | `POST /auth/logout` | Sair | Sessão atual, com CSRF | Implementado |
| A03 | Clientes | `GET /clientes` | Listar/buscar clientes | Administrador e funcionario autenticados | Implementado e verificado localmente |
| A04 | Clientes | `POST /clientes` | Cadastrar cliente | Administrador e funcionario autenticados | Implementado e verificado localmente |
| A05 | Clientes | `GET /clientes/{id}` | Consultar perfil do cliente | Administrador e funcionario autenticados | Implementado e verificado localmente |
| A06 | Clientes | `PUT /clientes/{id}` | Alterar dados cadastrais | Administrador e funcionario autenticados | Implementado e verificado localmente |
| A07 | Funcionários | `GET /funcionarios` | Listar/buscar funcionários | Administrador — RN-001 | Implementado |
| A08 | Funcionários | `POST /funcionarios` | Cadastrar funcionário | Administrador — RN-001 | Implementado |
| A21 | Funcionários | `GET /funcionarios/{id}` | Consultar perfil de funcionário | Administrador — RN-001 | Implementado |
| A22 | Funcionários | `PUT /funcionarios/{id}/acesso` | Definir perfil e estado de acesso | Administrador — RN-001 | Implementado |
| A09 | OS | `GET /ordens-servico` | Listar OS | Ambos os perfis autenticados | Implementado — consulta |
| A10 | OS | `POST /ordens-servico` | Abrir OS | Ambos os perfis autenticados, com CSRF | Implementado |
| A11 | OS | `GET /ordens-servico/{id}` | Consultar detalhes da OS | Ambos os perfis autenticados | Implementado — consulta |
| A12 | OS | `PUT /ordens-servico/{id}/status` | Alterar estado ou solicitar cancelamento | Ambos os perfis autenticados, com CSRF | Implementado |
| A13 | OS | `POST /ordens-servico/{id}/materiais` | Registrar material utilizado | Ambos os perfis autenticados, com CSRF | Implementado |
| A14 | Materiais | `GET /materiais` | Consultar estoque de materiais | Ambos os perfis autenticados | Implementado — consulta |
| A15 | Materiais | `POST /materiais` | Registrar cadastro de material | Ambos os perfis autenticados, com CSRF | Implementado |
| A16 | Produtos | `GET /produtos` | Consultar produtos e saldo | Ambos os perfis autenticados | Implementado — consulta |
| A17 | Produtos | `POST /produtos` | Registrar cadastro de produto | Ambos os perfis autenticados, com CSRF | Implementado |
| A18 | Estoques | `POST /movimentacoes-estoque` | Registrar entrada/reposição | Ambos os perfis autenticados, com CSRF | Implementado |
| A19 | Vendas | `GET /vendas` | Consultar histórico de vendas independentes | Ambos os perfis autenticados | Implementado — consulta |
| A20 | Vendas | `POST /vendas` | Registrar venda independente | Ambos os perfis autenticados, com CSRF | Implementado |
| A23 | Perfil | `GET /perfil` | Consultar os próprios dados | Próprio usuário — RN-006; rota específica pendente | Proposto |
| A24 | Perfil | `PUT /perfil` | Alterar os próprios dados | Próprio usuário; campos editáveis pendentes | Proposto |
| A25 | Perfil | `PUT /perfil/senha` | Alterar a própria senha | Próprio usuário; política pendente | Proposto |
| A27 | Configurações | `GET /configuracoes` | Consultar dados e parâmetros | Pendente — RN-003 | Proposto |
| A28 | Configurações | `PUT /configuracoes` | Alterar dados e parâmetros | Pendente — RN-003 | Proposto |
| A29 | Configurações | `POST /configuracoes/{cadastro}` | Cadastrar item auxiliar | Pendente — RN-003 | Proposto |
| A26 | Dashboard | `GET /dashboard` | Consultar resumo operacional | Pendente; acesso amplo é sugestão | Proposto |
| A30 | Financeiro | `GET /financeiro` | Consultar painel financeiro | Pendente — RN-003 | Proposto |
| A31 | Financeiro | `GET /financeiro/{indicador}` | Consultar indicador detalhado | Pendente — RN-003 | Proposto |

## Consultas adicionais implementadas

Todas usam o prefixo `/api/v1` e exigem login de administrador ou funcionario:

| Método e caminho | Resposta em dados |
|---|---|
| GET /materiais/:id | Um material |
| GET /produtos/:id | Um produto para venda |
| GET /vendas/:id | Uma venda |
| GET /vendas/:id/itens | Lista dos itens daquela venda |
| GET /ordens-servico/:id/materiais | Lista dos usos de materiais daquela OS |
| GET /movimentacoes-estoque | Lista de movimentações |
| GET /movimentacoes-estoque/:id | Uma movimentação |

Listagens são ordenadas por id, sem filtros/paginação nesta etapa. Sucesso: `200`, `{"dados": ...}`; listas vazias: `{"dados": []}`. ID inválido: `400`; registro ou pai inexistente: `404`; sem sessão: `401`; falha interna: `500` sem detalhes do banco. Numeric é string decimal, datas de OS são YYYY-MM-DD e instantes são ISO UTC. Não há alteração de dados em GET e não é necessário token CSRF para essas consultas. As operações de gravação estão descritas a seguir.

## Origem e limites

**Definidos/exigidos:** módulos e objetivos no Guia §§4–5 (RF-001 a RF-011); Node.js, HTTP e versionamento no §9 (RNF-003); validação e segurança no §8.2 (RNF-004/RNF-005). **Sugeridos:** conteúdo das telas (§5), fluxos (§6), recursos e convenções (§§9.2–9.4). As operações são uma tradução técnica dessas fontes; a saída do sistema também atende ao fluxo explicitamente solicitado nesta conversa.

O código atual contém a demonstração React e o servidor Express com a rota de verificação; as rotas de Clientes, Funcionários e autenticação estão implementadas; as demais entidades possuem tabelas, consultas e operações de gravação aprovadas. Não se cria endpoint por tabela: itens e materiais utilizados são componentes das operações de Venda/OS. Não se propõe exclusão genérica. DELETE está disponível para Clientes, Materiais e Produtos sem vínculos; nos estoques também exige saldo zero. Edição cadastral, mudança de estado/cancelamento e movimento de estoque são comandos distintos.

<a id="permissoes"></a>
## Permissões

Confirmado pelo Integrante 1: Clientes permite os perfis administrador e funcionario autenticados. Funcionários é exclusivo do administrador (RN-001). A API confere o estado ativo e a versão de acesso no banco em cada requisição protegida; editar ativo/perfil invalida sessões anteriores. Ambos os perfis podem cadastrar, editar, excluir, cancelar e corrigir estoque nas operações documentadas. Funcionários permanece exclusivo do administrador.

Autenticação por cookie `sapataria.sid`, HttpOnly, SameSite=Lax, Secure em produção; sessões no PostgreSQL com duração absoluta de 8h. Nas requisições POST/PUT/DELETE, envie `X-CSRF-Token` associado ao mesmo cookie. Sem login retorna `401`; perfil insuficiente ou CSRF inválido retorna `403`. Nunca envie senha em rotas diferentes de login/cadastro.

<a id="padroes"></a>
O servidor usa HOST=127.0.0.1 por padrão. A origem de front-end permitida em CORS é APP_ORIGIN; o front-end deve enviar cookies (`credentials: include`).

## Padrões comuns e propostas identificadas

- **Tipos:** IDs inteiros; `text` como string, `boolean` como booleano; datas `YYYY-MM-DD` e instantes como strings ISO 8601 com fuso. Para `numeric`, a resposta usa **string decimal**. Envie valores como strings com ponto para preservar precisão; números JSON finitos também são aceitos dentro da precisão segura. Dinheiro aceita até duas casas decimais, sem arredondamento silencioso. Materiais aceitam frações; produtos exigem unidades inteiras. Saldo e valores podem ser zero; quantidades de operações devem ser positivas. A representação recebida tem limite técnico de 100 caracteres.
- **Corpos:** JSON com `Content-Type: application/json`. Campos e significado vêm do [modelo](modelo-de-dados.md). A obrigatoriedade confirmada de Clientes e Funcionários está registrada no modelo de dados. IDs de caminho identificam tecnicamente o recurso; IDs gerados não são preenchidos no cadastro. Representações pendentes não devem ser completadas por suposição.
- **Sucesso:** `200` para consulta/alteração, `201` após criação confirmada, `204` sem corpo nas operações indicadas. Demais sucessos usam `{"dados": ...}`; listas usam array e `{"dados": []}` quando vazias. As respostas usam os campos da entidade correspondente; credenciais e `senha_protegida` nunca integram a representação pública.
- **Opcionais:** somente campos aprovados como opcionais aceitam ausência/`null`, conforme o modelo; resposta com `null`. PUT de cadastro recebe todos os campos obrigatórios; opcionais ausentes ficam nulos, conforme o contrato da operação.
- **P — paginação:** sugestão do Guia §§9.4/14, ainda não aprovada. Proposta de parâmetros `pagina` e `tamanho` (inteiros) e resposta `dados` + `paginacao: {pagina, tamanho, total}`. Limites, padrão, ordenação e adoção por lista ficam pendentes; não truncar silenciosamente. O cadastro/listagem inicial de Clientes conserva resposta sem paginação até revisão explícita dessa proposta.
- **E — erros comuns:** `400` para estrutura/tipo/validação aprovada inválidos; `401` sem identificação válida; `403` sem autorização; `500` para falha interna, sem expor detalhes do banco ou segredos. **R:** `404` para recurso de caminho não encontrado. Referência inexistente em OS/venda/uso: `400`; item inexistente no comando manual de estoque: `404`. **N:** `409` para saldo insuficiente, transição inválida, vínculo que impede exclusão, repetição de cancelamento ou quantidade de devolução excedida.
- **Efeitos:** ações relacionadas devem confirmar juntas ou ser desfeitas em conjunto (RN-018); saldo nunca negativo (RN-019). Vendas e consumo baixam saldo na confirmação. Cancelamento de OS não devolve saldo; cancelamento de venda devolve somente os itens informados como devolvidos. Uma falha de rede pode ocorrer após gravar: consultar a situação antes de repetir uma operação, sem presumir que o envio falhou.

Exemplo de erro de estrutura, sem inventar campo obrigatório:

```json
{"erro":{"codigo":"DADOS_INVALIDOS","mensagem":"O corpo deve conter um objeto JSON válido."}}
```

## Detalhamento conciso por funcionalidade

Entradas, respostas e efeitos são implementados somente nas rotas identificadas dessa forma; nas demais, continuam **propostos**. “Pendente” marca somente a parte que ainda não pode ser fechada. E/R/N/P remetem aos padrões acima. Falta de definição de obrigatoriedade não autoriza salvar registros vazios.

### GET /auth/csrf — obter proteção para alterações

Retorna `200`, `{"csrfToken":"..."}`, e um cookie de sessão. É público para permitir o login. Use esse token no cabeçalho `X-CSRF-Token`; mantenha o cookie no Insomnia/navegador. Respostas privadas e de autenticação usam `Cache-Control: no-store`.

<a id="a01"></a>
### A01 — POST /auth/login

- **Implementado:** corpo `{"usuario":"carlos.lima","senha":"senha cadastrada"}`. Usuário sem diferenciação de maiúsculas/minúsculas; e-mail não é aceito como campo de login.
- **Sucesso:** `200`, `{"dados": funcionario, "csrfToken":"novo token"}`; cookie e token renovados. Use o novo token nas próximas alterações.
- **Erros:** `400` para corpo inválido; `401` com a mesma mensagem para usuário inexistente, senha incorreta e conta inativa; `403` para CSRF inválido; `429` ao exceder limites; `503` se a capacidade simultânea de hash estiver ocupada.
- Limites: 10 tentativas/usuário e 50/IP em janelas de 15min no PostgreSQL; sucesso limpa apenas contador do usuário. Sessão expira em 8h, sem renovação automática. Senha usa scrypt com salt individual.

<a id="a02"></a>
### A02 — POST /auth/logout

- **Implementado:** exige CSRF, sem corpo. Retorna `204`, destrói a sessão e remove o cookie. A sessão anterior não pode ser reutilizada.

### GET /auth/me — identidade autenticada

Retorna `200`, `{"dados": funcionario}` sem senha/hash/versão técnica. Sem sessão válida, expirado ou inativo retorna `401`.

<a id="a03"></a>
### A03 — GET /clientes

- **Implementado:** lista todos os clientes, ordenados por id, sem filtros ou paginação nesta etapa.
- **Sucesso:** `200`, `{"dados": [...]}`; lista vazia: `{"dados": []}`. RF-017.

<a id="a04"></a>
### A04 — POST /clientes

- **Entrada:** objeto JSON com `nome`, `telefone` e `endereco` obrigatórios; `email` e `observacoes` opcionais. Não aceita `id` nem campos desconhecidos.
- **Validação:** campos são textos; obrigatórios não podem ser vazios. Espaços nas extremidades são removidos; opcionais omitidos, nulos ou em branco tornam-se `null`. E-mail informado exige formato básico válido. Sem unicidade de contatos nem máscara obrigatória de telefone.
- **Sucesso:** `201`, `{"dados": cliente}` com id gerado pelo banco. RF-003/RF-017.

<a id="a05"></a>
### A05 — GET /clientes/{id}

- **Entrada:** id inteiro positivo no intervalo de `integer` do PostgreSQL.
- **Sucesso:** `200`, `{"dados": cliente}`. Id inválido: `400`; inexistente: `404`. RF-017.

<a id="a06"></a>
### A06 — PUT /clientes/{id}

- **Entrada:** id no caminho e todos os campos obrigatórios de A04. Os cinco campos de negócio são editáveis. Opcionais ausentes ficam nulos; o id não pode ser alterado.
- **Sucesso:** `200`, `{"dados": cliente}` atualizado. Id inválido ou corpo inválido: `400`; inexistente: `404`. RF-017.
- Não exclui registros nem altera OS ou histórico.

**Erros implementados em Clientes:** `400` para dados/JSON inválidos, `404` para cliente inexistente, `413` para corpo acima do limite do Express e `500` para falha interna, com `{"erro":{"codigo":"...","mensagem":"..."}}`. Detalhes do banco não são devolvidos.

**Verificação:** checagem TypeScript e 18 cenários HTTP com banco simulado passaram. Após configurar `DATABASE_CA_CERT`, a conexão TLS foi validada, a tabela aplicada e as operações verificadas por HTTP com o Supabase real em uma transação revertida. Nenhum registro de teste permaneceu.

<a id="a07"></a>
### A07 — GET /funcionarios

Implementado. Apenas administrador. `200`, `{"dados": [...]}` com id, nome, usuario, email, perfil e ativo; sem filtro/paginação nesta etapa.

<a id="a08"></a>
### A08 — POST /funcionarios

Implementado. Apenas administrador, com CSRF. Campos obrigatórios: nome, usuario, email, senha (15–128 caracteres), perfil. `ativo` é booleano opcional na entrada, com padrão true; null não é aceito. Perfil: administrador ou funcionario, sem padrão. Campo desconhecido ou `senha_protegida` na entrada é rejeitado. E-mail exige formato básico; a senha não é modificada.

Retorna `201`, `{"dados": funcionario}` sem senha. Usuário duplicado (incluindo diferença de caixa): `409`; entrada inválida: `400`. Primeiro administrador: comando local `npm run criar:admin`, sem conta pública/padrão.

<a id="a21"></a>
### A21 — GET /funcionarios/{id}

Implementado. Apenas administrador. `200`, `{"dados": funcionario}`. ID inválido: `400`; não encontrado: `404`.

<a id="a22"></a>
### A22 — PUT /funcionarios/{id}/acesso

Implementado. Apenas administrador, com CSRF. Envie ambos: `{"perfil":"funcionario","ativo":false}`. Retorna `200`, `{"dados": funcionario}`. Mudança de perfil ou ativo invalida as sessões anteriores, inclusive a própria se o administrador alterar seu acesso. Reativar não restaura sessões antigas. ID inválido/dados inválidos: `400`; não encontrado: `404`. Não exclui pessoas nem históricos.

<a id="a09"></a>
### A09 — GET /ordens-servico

Implementado: `200`, `{"dados": [...]}`, lista de OS ordenada por id, sem filtros ou paginação nesta etapa. A consulta não altera status, estoque ou financeiro. RF-004/RF-018.

<a id="a10"></a>
### A10 — POST /ordens-servico

Implementado. Corpo: `cliente_id`, `responsavel_id`, `descricao_calcado`, `servico`, `valor`; opcionais `prazo_entrega`, `forma_pagamento`, `observacoes`. Responsável deve estar ativo e cliente deve existir. Status inicial `Aberta` e data de entrada automáticos; enviar esses campos gera `400`. Pagamento: `pix`, `credito`, `debito` ou `dinheiro`; pode ser omitido na OS. Prazo deve ser uma data real YYYY-MM-DD. Retorna `201`, `{"dados": OS}`. O valor é informado, sem fórmula automática e sem baixa ao abrir a OS.

<a id="a11"></a>
### A11 — GET /ordens-servico/{id}

Implementado: `200`, `{"dados": OS}`. ID inválido: `400`; inexistente: `404`. Os materiais são consultados separadamente em `GET /ordens-servico/:id/materiais`; não há campo materiais_utilizados embutido na resposta atual. RF-018.

<a id="a12"></a>
### A12 — PUT /ordens-servico/{id}/status

Implementado. Corpo `{"status":"Em andamento"}`. Sequência permitida: `Aberta → Em andamento → Pronta → Entregue`. Cancelamento por `{"status":"Cancelada"}` permitido em Aberta, Em andamento ou Pronta. Entregue e Cancelada são finais; retrocessos, saltos e repetição retornam `409`. Retorna `200`, `{"dados": OS}`. Cancelar preserva os usos já registrados e não devolve materiais automaticamente.

<a id="a13"></a>
### A13 — POST /ordens-servico/{id}/materiais

Implementado. Corpo `{"material_id":1,"quantidade_usada":"0.125"}`. Exige OS Aberta ou Em andamento; quantidade positiva, permitindo frações. Cria uma nova linha de uso, uma saída vinculada e baixa o estoque na mesma transação. Falta de saldo retorna `409` e desfaz tudo. Retorna `201`, `{"dados": uso}`. Usos repetidos do mesmo material são linhas distintas; não há cálculo automático do valor da OS.

<a id="a14"></a>
### A14 — GET /materiais

Implementado: `200`, `{"dados": [...]}`, materiais ordenados por id, com saldo e demais colunas documentadas. Sem filtros, paginação ou alertas calculados. Consulta individual também disponível em `GET /materiais/:id`. RF-007/RF-021.

<a id="a15"></a>
### A15 — POST /materiais

Implementado. Campos obrigatórios: `nome`, `categoria`, `unidade`, `quantidade_minima`, `custo`. Textos não vazios; mínimo não negativo e fracionável; custo não negativo com até duas casas, referente à unidade cadastrada. Retorna `201`, `{"dados": material}`, saldo zero. Não aceita saldo no corpo; entrada de estoque é uma operação separada.

<a id="a16"></a>
### A16 — GET /produtos

Implementado: `200`, `{"dados": [...]}`, produtos para venda ordenados por id. Sem filtros/paginação. Consulta individual em `GET /produtos/:id`. RF-008/RF-022.

<a id="a17"></a>
### A17 — POST /produtos

Implementado. Campos obrigatórios: `nome`, `categoria`, `preco_custo`, `preco_venda`. Textos não vazios; preços não negativos com até duas casas. Retorna `201`, `{"dados": produto}`, saldo zero. Não aceita saldo no corpo.

<a id="a18"></a>
### A18 — POST /movimentacoes-estoque

Implementado. Corpo: `tipo` (`entrada` ou `saida`), `quantidade` positiva, `motivo` não vazio e exatamente um de `material_id`/`produto_id`. Materiais aceitam frações; produtos exigem inteiros. Data automática; não recebe vínculos de venda/uso/reversão do cliente. Retorna `201`, `{"dados": movimentacao}` depois de confirmar saldo e movimento juntos. Saída manual atende perda/avaria com motivo; não substitui os comandos de venda/consumo. Saldo insuficiente: `409`.

<a id="a19"></a>
### A19 — GET /vendas

Implementado: `200`, `{"dados": [...]}`, vendas ordenadas por id, sem filtro por período/cliente nem paginação. Consulta individual em `GET /vendas/:id`; itens em `GET /vendas/:id/itens`, sem itens embutidos na listagem. RF-006/RF-020.

<a id="a20"></a>
### A20 — POST /vendas

Implementado. Corpo `{"forma_pagamento":"pix","itens":[{"produto_id":1,"quantidade":2}]}`. Exige pelo menos um item, produtos existentes, quantidades inteiras positivas e pagamento `pix`, `credito`, `debito` ou `dinheiro`. Não aceita preço, vendedor, total ou data enviados pelo cliente. Vendedor vem da sessão; preço vem do cadastro e é preservado no item. Total = soma exata de quantidade × preço unitário no PostgreSQL.

Venda, itens, saídas e baixa de estoque confirmam juntos; qualquer falta de saldo desfaz tudo (`409`). Retorna `201`, `{"dados": venda}`, incluindo `cancelada_em: null`. Consulte os itens em `GET /vendas/:id/itens`. Não inclui imposto, desconto, parcelamento ou cálculo do painel financeiro.

## Edição, exclusão e correções implementadas

Todas as rotas desta seção exigem sessão e CSRF; ambos os perfis podem executá-las.

| Método e caminho | Entrada e comportamento |
|---|---|
| DELETE /clientes/:id | Sem corpo. Só exclui sem OS vinculada; `204`, `404` inexistente ou `409` com histórico. |
| PUT /materiais/:id | Mesmo corpo completo de A15; não altera saldo. `200`, `{"dados": material}`. |
| PUT /produtos/:id | Mesmo corpo completo de A17; não altera saldo nem preços de vendas anteriores. `200`, `{"dados": produto}`. |
| DELETE /materiais/:id | Sem corpo. Saldo zero e sem vínculos; `204`, `404` ou `409`. |
| DELETE /produtos/:id | Mesma regra de Materiais. |
| PUT /ordens-servico/:id | Mesmo corpo de A10; apenas Aberta ou Em andamento. `200` ou `409` por estado. |
| POST /ordens-servico/:id/materiais/:usoId/devolucoes | `{"quantidade":"0.05","motivo":"Sobra não utilizada"}`. Devolve parte não utilizada, até o uso menos devoluções anteriores. Funciona também após encerramento; nunca representa cola já consumida. `201`, `{"dados": movimentacao}`. |
| POST /movimentacoes-estoque/:id/estorno | `{"motivo":"Correção de lançamento"}`. Inverte integralmente um movimento manual uma única vez, sem editar o original. Requer saldo se a reversão gerar saída. `201`, `{"dados": movimentacao}`. |
| POST /vendas/:id/cancelamento | `{"itens_devolvidos":[{"item_venda_id":1,"quantidade":1}]}`. Lista explícita, podendo ser vazia. Cancela uma única vez (`200`); devolve somente as quantidades indicadas, limitadas às vendidas. Preserva itens, preços e total originais; preenche `cancelada_em`. |

Estorno genérico não se aplica a movimentos de venda, uso ou reversões: use a operação do módulo de origem. Devoluções não podem ultrapassar a quantidade de origem, mesmo em requisições simultâneas. Movimentações, usos, itens, OS e vendas não têm DELETE genérico; movimentações também não têm PUT. Para corrigir um lançamento manual, faça o estorno e registre o movimento correto.

O cancelamento da venda recebe as devoluções naquele momento. Uma venda cancelada não pode ser cancelada novamente para acrescentar devoluções; não há fluxo separado de devolução posterior de venda nesta etapa. Não existe operação de reembolso financeiro.

Exemplo de sequência no Insomnia: login → cadastrar produto → registrar entrada → registrar venda → consultar itens. Use o cookie e o novo CSRF retornados pelo login em todas as gravações. Não reenvie POST automaticamente após uma falha de rede; confira os registros, pois o servidor pode já ter confirmado a operação.

<a id="a23"></a>
### A23 — GET /perfil

- **Entrada:** Sem id de outra pessoa nem corpo; identidade do acesso atual.
- **Sucesso:** 200; dados do próprio Funcionário, sem senha_protegida.
- **Erros, efeitos e origem:** E. Guia §5.9; RF-009/RF-023.

<a id="a24"></a>
### A24 — PUT /perfil

- **Entrada:** Somente campos pessoais de Funcionário aprovados para autoedição; lista/obrigatoriedade em PD-N03. Não concede alteração de perfil/ativo por inferência.
- **Sucesso:** 200; dados atualizados, sem senha_protegida.
- **Erros, efeitos e origem:** E. Sem alteração de credencial por este comando. Guia §5.9; RN-006; PD-N01/PD-N03.

<a id="a25"></a>
### A25 — PUT /perfil/senha

- **Entrada:** Credenciais transitórias conforme política a definir; nomes das chaves, confirmação de identidade e obrigatoriedade em PD-N02/PD-R04.
- **Sucesso:** 204, sem corpo.
- **Erros, efeitos e origem:** E. Não recebe nem devolve senha_protegida; efeitos sobre acessos iniciados pendentes. Guia §5.9; RF-023.

<a id="a27"></a>
### A27 — GET /configuracoes

- **Entrada:** Sem corpo.
- **Sucesso:** 200; dados da empresa, auxiliares e parâmetros aprovados; formato interno pendente.
- **Erros, efeitos e origem:** E. Guia §5.10; RF-024; PD-N01/PD-N03/PD-N06. Não implica tabela Configuração.

<a id="a28"></a>
### A28 — PUT /configuracoes

- **Entrada:** Somente dados e parâmetros aprovados; esquema, campos obrigatórios e semântica de substituição pendentes.
- **Sucesso:** 200; configuração confirmada.
- **Erros, efeitos e origem:** E + N. §5.10 respalda ajustes, não alíquota ou fórmula específica. Não habilitar gravação de objeto arbitrário; definir esquema antes (PD-N03/PD-N06).

<a id="a29"></a>
### A29 — POST /configuracoes/{cadastro}

- **Entrada:** cadastro identifica tipos-servico, formas-pagamento ou categorias, somente se adotados; corpo nome, com obrigatoriedade pendente. Separação das categorias em PD-N03.
- **Sucesso:** 201; item auxiliar com id e nome, conforme modelo aprovado.
- **Erros, efeitos e origem:** E. Caminho proposto para os cadastros do §5.10. Sem edição/exclusão genérica; PD-N03/PD-N04/PD-N05.

<a id="a26"></a>
### A26 — GET /dashboard

- **Entrada:** Sem corpo; escopo do “dia” precisa de definição para vendas.
- **Sucesso:** 200; resumo de OS abertas/prontas, vendas do dia e alertas que forem aprovados; chaves/métricas ainda pendentes.
- **Erros, efeitos e origem:** E. Sem inventar contagem, valores ou limites. Guia §5.2; RF-016; PD-N04/PD-N06/PD-N08.

<a id="a30"></a>
### A30 — GET /financeiro

- **Entrada:** Período opcional inicio/fim; datas de reconhecimento, limites e período padrão pendentes. Sem corpo.
- **Sucesso:** 200; totais e evolução dos indicadores aprovados; chaves e fórmulas pendentes.
- **Erros, efeitos e origem:** E + N. Somente consulta é sugestão RN-007. Guia §5.11; RF-025; PD-N05/PD-N06. Não retorna zero como substituto de regra ausente.

<a id="a31"></a>
### A31 — GET /financeiro/{indicador}

- **Entrada:** indicador: faturamento, lucro, imposto ou materiais (nomes propostos); período como A30; P apenas se houver lista aprovada.
- **Sucesso:** 200; detalhamento do indicador aprovado, estrutura pendente.
- **Erros, efeitos e origem:** E + R + N. Mesmo significado do painel; não inventa fórmula, percentual ou base de custos. Guia §5.11; RN-014 a RN-017; PD-N06.

## Exemplos de corpos para o Insomnia

Os dados são fictícios. Substitua os IDs por cadastros existentes e use cookie/CSRF do login.

**Cliente — POST /clientes:**

```json
{"nome":"Clara Almeida","telefone":"11900000000","email":"clara@example.com","endereco":"Rua das Flores, 10"}
```

**Material — POST /materiais:**

```json
{"nome":"Cola de contato","categoria":"Adesivos","unidade":"litro","quantidade_minima":"0.5","custo":"25.50"}
```

**Produto — POST /produtos:**

```json
{"nome":"Palmilha confortável","categoria":"Acessórios","preco_custo":"12.00","preco_venda":"25.00"}
```

**Entrada de produto — POST /movimentacoes-estoque:**

```json
{"tipo":"entrada","produto_id":2,"quantidade":10,"motivo":"Reposição recebida"}
```

**OS — POST /ordens-servico:**

```json
{"cliente_id":1,"responsavel_id":1,"descricao_calcado":"Sapato social marrom","servico":"Colagem da sola","valor":"45.00"}
```

**Venda — POST /vendas:**

```json
{"forma_pagamento":"pix","itens":[{"produto_id":2,"quantidade":1}]}
```

**Uso de material — POST /ordens-servico/:id/materiais:**

```json
{"material_id":3,"quantidade_usada":"0.125"}
```

## Lacunas locais e evolução

Cliente–Venda e OS–Venda e um eventual catálogo de serviços continuam pendentes. O serviço atual é texto; a origem das movimentações já está vinculada ao item de venda, uso ou movimento revertido. Não simular histórico de compras nem baixar estoque duas vezes para preencher essas lacunas. Configuração/indicadores dependem dos respectivos esquemas e fórmulas (PD-N06), não de tabelas por tela. CEP/CSV continuam sugestões em RF-026/RF-027; adoção, fonte e contrato permanecem PD-R10, sem novas rotas presumidas.

As operações documentadas permitem integrar as telas ao back-end. O planejamento de interface permanece em [Telas e fluxos](telas-e-fluxos.md#etapas).
