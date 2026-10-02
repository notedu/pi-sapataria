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
| A21 | Funcionários | `GET /funcionarios/{id}` | Consultar perfil | Administrador ou o próprio Funcionário — RN-001/RN-006 | Implementado |
| — | Funcionários | `PUT /funcionarios/{id}` | Editar dados pessoais com senha própria | Administrador | Implementado |
| — | Funcionários | `GET /funcionarios/{id}/ordens-servico` | Consultar OS sob sua responsabilidade | Administrador ou o próprio Funcionário | Implementado |
| A22 | Funcionários | `PUT /funcionarios/{id}/acesso` | Definir perfil e estado de acesso; desativação exige senha própria | Administrador — RN-001 | Implementado |
| — | Funcionários | `POST /funcionarios/{id}/desativar` | Desativar preservando perfil e histórico, com senha própria | Administrador — RN-001/RN-020 | Implementado |
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
| A30 | Financeiro | `GET /financeiro` | Consultar painel financeiro | Administrador — RN-003 | Proposto; não implementado |
| A31 | Financeiro | `GET /financeiro/{indicador}` | Consultar indicador detalhado | Administrador — RN-003 | Proposto; não implementado |

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

Confirmado pelo Integrante 1: Clientes permite os perfis administrador e funcionario autenticados. Funcionários é exclusivo do administrador (RN-001). A API confere o estado ativo e a versão de acesso no banco em cada requisição protegida; editar ativo/perfil invalida sessões anteriores. Ambos os perfis podem cadastrar, editar, excluir, cancelar e corrigir estoque nas operações documentadas. A gestão de Funcionários permanece exclusiva do Administrador; consulta individual e suas OS também permitem o próprio Funcionário, conforme decisão de 30/09/2026.

Autenticação por cookie `sapataria.sid`, HttpOnly, SameSite=Lax, Secure em produção; sessões no PostgreSQL com duração absoluta de 8h. Nas requisições POST/PUT/DELETE, envie `X-CSRF-Token` associado ao mesmo cookie. Sem login retorna `401`; perfil insuficiente ou CSRF inválido retorna `403`. Senhas são enviadas apenas no login, cadastro e na confirmação administrativa de desativação descrita abaixo. `senha_admin` é a senha da conta autenticada e nunca deve ser registrada em logs ou devolvida.

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

- **Entrada:** `nome`, `telefone`, `cpf`, `cep` e `numero` obrigatórios; `email` e `observacoes` opcionais. Não aceita `id`, `criado_em`, `endereco` ou campos desconhecidos.
- **Validação:** textos não vazios; telefone e CPF com 11 dígitos, CEP com 8, sem pontuação. CPF exige dígitos verificadores válidos e rejeita sequência repetida. Número é texto (ex.: `123A`, `S/N`). E-mail exige formato básico. Sem unicidade nova.
- **Sucesso:** `201`, `{"dados": cliente}` com data e id gerados pelo banco. Campos retornados: id, nome, telefone, cpf, cep, numero, endereco legado, email, observacoes e criado_em. CPF/CEP/número/data podem ser nulos em registros anteriores à migração.
- **Dependência:** aplicar `clientes-perfil.sql` antes de usar o novo contrato. Script preparado, não aplicado ao banco existente. RF-003/RF-017.

<a id="a05"></a>
### A05 — GET /clientes/{id}

- **Entrada:** id inteiro positivo no intervalo de `integer` do PostgreSQL.
- **Sucesso:** `200`, `{"dados": cliente}`. Id inválido: `400`; inexistente: `404`. RF-017.

<a id="a06"></a>
### A06 — PUT /clientes/{id}

- **Entrada:** id no caminho e todos os campos obrigatórios de A04. Os sete campos de negócio são editáveis; endereço legado e data não são recebidos. Opcionais ausentes ficam nulos; o id não pode ser alterado.
- **Sucesso:** `200`, `{"dados": cliente}` atualizado. Id inválido ou corpo inválido: `400`; inexistente: `404`. RF-017.
- Não exclui registros nem altera OS ou histórico.

**Erros implementados em Clientes:** `400` para dados/JSON inválidos, `404` para cliente inexistente, `413` para corpo acima do limite do Express e `500` para falha interna, com `{"erro":{"codigo":"...","mensagem":"..."}}`. Detalhes do banco não são devolvidos.

### GET /clientes/{id}/ordens-servico

Exige sessão dos dois perfis. Retorna `200`, `{"dados": [OS]}`, filtrando `cliente_id` na consulta SQL e reutilizando o modelo de OS. Cliente sem OS retorna lista vazia; inexistente retorna `404`; id inválido, `400`. Não modifica OS nem estoque.

**Verificação da evolução de Clientes:** typecheck e 29 verificações HTTP/PostgreSQL local descartável, incluindo sessão, CSRF, campos inválidos, migração, preservação de legado, edição e histórico filtrado. Sem alteração no banco existente.

<a id="a07"></a>
### A07 — GET /funcionarios

Implementado. Apenas administrador. `200`, `{"dados": [...]}` com id, nome, usuario, email, perfil, ativo, cpf e telefone; sem filtro/paginação nesta etapa.

<a id="a08"></a>
### A08 — POST /funcionarios

Implementado. Apenas administrador, com CSRF. Campos obrigatórios: nome, usuario, email, cpf, telefone, senha (15–128 caracteres), perfil. CPF: 11 dígitos sem pontuação, validação dos dígitos verificadores e rejeição de repetidos. Telefone: 11 dígitos sem pontuação. CPF/telefone não têm unicidade nova. Ambos podem ser nulos nas respostas de registros antigos. `ativo` é booleano opcional na entrada, com padrão true; null não é aceito. Perfil: administrador ou funcionario, sem padrão. Campo desconhecido ou `senha_protegida` na entrada é rejeitado. E-mail exige formato básico; a senha não é modificada.

Retorna `201`, `{"dados": funcionario}` sem senha. Usuário duplicado (incluindo diferença de caixa): `409`; entrada inválida: `400`. Primeiro administrador: comando local `npm run criar:admin`, que também exige CPF/telefone, sem conta pública/padrão.

<a id="a21"></a>
### A21 — GET /funcionarios/{id}

Implementado. Administrador consulta qualquer funcionário; Funcionário comum consulta somente seu próprio id. Outro id retorna `403` antes da busca. `200`, `{"dados": funcionario}` com cpf/telefone (nulos nos legados), sem senha/hash. ID inválido: `400`; não encontrado para consulta autorizada: `404`.

### PUT /funcionarios/{id} — dados pessoais

Apenas Administrador, sessão e CSRF. Corpo completo: `{"nome":"Pessoa Fictícia","email":"pessoa@example.com","cpf":"52998224725","telefone":"11999999999","senha_admin":"senha do Administrador conectado"}`. A senha é sempre do autor, inclusive quando edita outra pessoa. Não permite alterar usuário, senha de login, perfil, ativo ou enviar campos extras. Valida os mesmos quatro campos pessoais do cadastro. Legados precisam completá-los.

Retorna `200`, `{"dados": funcionario}`. Não muda id, vínculos, credenciais nem versão de acesso. Confirmação incorreta: `403/SENHA_CONFIRMACAO_INVALIDA`, sem alterar o registro. Ausente/vazia ou acima de 128 caracteres: `400/CONFIRMACAO_OBRIGATORIA`. Sessão inválida: `401`; inexistente: `404`; limite: `429`. Autor e alvo são bloqueados em ordem de id, com nova checagem de sessão/perfil sob bloqueio; uma desativação concorrente do autor impede a edição.

### GET /funcionarios/{id}/ordens-servico

Mesma permissão de A21, conferida antes de consultar. Retorna `200`, `{"dados":[OS]}`, filtradas por `responsavel_id`, ordenadas por id. Sem vínculo retorna lista vazia; outro perfil sem permissão retorna `403`; funcionário inexistente para consulta autorizada retorna `404`. Não altera OS.

**Migração necessária:** aplicar `funcionarios-perfil.sql` uma única vez após `funcionarios.sql`, antes de iniciar o código atualizado. Preparada e testada apenas localmente, não aplicada ao banco existente.

<a id="a22"></a>
### A22 — PUT /funcionarios/{id}/acesso

Implementado. Apenas Administrador, com cookie e CSRF. `perfil` e `ativo` continuam obrigatórios. Quando `ativo=false`, também é obrigatório `senha_admin` com a senha do Administrador conectado: `{"perfil":"funcionario","ativo":false,"senha_admin":"senha do administrador"}`. Não é possível desativar a própria conta. Alteração de perfil/reativação com `ativo=true` mantém o contrato anterior, sem confirmação adicional; a interface dessas operações permanece pendente.

Retorna `200`, `{"dados": funcionario}` sem senha/hash. Mudança de perfil ou ativo incrementa a versão de acesso: sessões anteriores deixam de valer na próxima requisição protegida, mesmo após reativação. A regra de desativação abaixo é compartilhada com esta rota, impedindo contorno por chamadas diretas.

### POST /funcionarios/{id}/desativar — confirmação administrativa

Corpo: `{"senha_admin":"senha do administrador conectado"}`. Preserva o perfil atual e os históricos; somente altera `ativo` para false e incrementa `versao_acesso` se houver mudança. Repetir a operação sobre uma conta já inativa, com confirmação válida, retorna o estado atual sem incrementar novamente. Não existe exclusão física.

- `200`: `{"dados": funcionario}` inativo, sem segredos.
- `400`: ID/corpo inválido ou `CONFIRMACAO_OBRIGATORIA` para senha ausente/vazia ou maior que 128 caracteres.
- `401`: sessão ausente, expirada ou invalidada.
- `403`: `ACESSO_NEGADO`, `CSRF_INVALIDO`, `AUTODESATIVACAO_PROIBIDA` ou `SENHA_CONFIRMACAO_INVALIDA`. Senha incorreta não encerra a sessão do Administrador e não altera o alvo.
- `404`: funcionário inexistente.
- `429`: mais de 10 confirmações por Administrador ou 50 por IP em 15 minutos. Contadores compartilhados com a confirmação da edição pessoal no PostgreSQL são separados dos de login, incluem sucessos e não são zerados por novo login.
- `503`: capacidade de verificação de senha ocupada.

A autorização é conferida novamente dentro da transação, com bloqueios dos registros do autor e do alvo em ordem de ID. Uma mudança concorrente de acesso do autor impede o uso da autorização anterior. As senhas são verificadas contra o hash do autor autenticado, sem aceitar sua identidade no corpo.

**Impacto de compatibilidade:** clientes que usam A22 para desativar devem passar `senha_admin`; chamadas antigas sem esse campo passam a receber `400`. Não houve alteração de estrutura do banco.

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

- **Situação atual (30/09/2026):** esta rota proposta não foi criada. A edição aprovada usa `PUT /funcionarios/{id}`, exclusiva do Administrador com senha própria e quatro campos pessoais. Funcionário comum tem somente consulta, via A21. Não autoriza autoedição por esse perfil.
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
{"nome":"Clara Almeida","telefone":"11900000000","email":"clara@example.com","cpf":"52998224725","cep":"01001000","numero":"10"}
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

Cliente–Venda e OS–Venda e um eventual catálogo de serviços continuam pendentes. O serviço atual é texto; a origem das movimentações já está vinculada ao item de venda, uso ou movimento revertido. Não simular histórico de compras nem baixar estoque duas vezes para preencher essas lacunas. Configuração/indicadores dependem dos respectivos esquemas e fórmulas (PD-N06), não de tabelas por tela. Consulta de CEP via ViaCEP aprovada e implementada no front-end em RF-026. CSV continua sugestão em RF-027/PD-R10.

As operações documentadas permitem integrar as telas ao back-end. O planejamento de interface permanece em [Telas e fluxos](telas-e-fluxos.md#etapas).
