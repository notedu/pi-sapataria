# Contrato inicial da API — visão do sistema

[Índice](README.md) · [Modelo de dados](modelo-de-dados.md) · [Telas e fluxos](telas-e-fluxos.md)

## Operações previstas

O contrato combina como front-end e back-end trocam pedidos e respostas. **Toda rota concreta abaixo é proposta, não implementada**, inclusive `/api/v1`, ainda não aprovado (Guia §§9.2–9.4; RNF-009/RNF-010). Os caminhos da tabela recebem esse prefixo. Os objetivos das funcionalidades são definidos no guia; isso não aprova automaticamente seus detalhes.

| ID | Funcionalidade | Método e caminho após `/api/v1` | Finalidade | Permissão | Situação |
|---|---|---|---|---|---|
| A01 | Autenticação | `POST /auth/login` | Entrar | Identificação; fluxo pendente | Proposto |
| A02 | Autenticação | `POST /auth/logout` | Sair | Acesso atual; mecanismo pendente | Proposto |
| A03 | Clientes | `GET /clientes` | Listar/buscar clientes | Pendente; RN-002 é sugestão | Proposto |
| A04 | Clientes | `POST /clientes` | Cadastrar cliente | Pendente | Proposto |
| A05 | Clientes | `GET /clientes/{id}` | Consultar perfil do cliente | Pendente | Proposto |
| A06 | Clientes | `PUT /clientes/{id}` | Alterar dados cadastrais | Pendente | Proposto |
| A07 | Funcionários | `GET /funcionarios` | Listar/buscar funcionários | Administrador — RN-001 | Proposto |
| A08 | Funcionários | `POST /funcionarios` | Cadastrar funcionário | Administrador — RN-001 | Proposto |
| A21 | Funcionários | `GET /funcionarios/{id}` | Consultar perfil de funcionário | Administrador — RN-001 | Proposto |
| A22 | Funcionários | `PUT /funcionarios/{id}/acesso` | Definir perfil e estado de acesso | Administrador — RN-001 | Proposto |
| A09 | OS | `GET /ordens-servico` | Listar OS e histórico por cliente | Pendente | Proposto |
| A10 | OS | `POST /ordens-servico` | Abrir OS | Pendente | Proposto |
| A11 | OS | `GET /ordens-servico/{id}` | Consultar detalhes da OS | Pendente | Proposto |
| A12 | OS | `PUT /ordens-servico/{id}/status` | Alterar estado ou solicitar cancelamento | Pendente | Proposto |
| A13 | OS | `POST /ordens-servico/{id}/materiais` | Registrar material utilizado | Pendente | Proposto |
| A14 | Materiais | `GET /materiais` | Consultar estoque de materiais | Pendente | Proposto |
| A15 | Materiais | `POST /materiais` | Registrar cadastro de material | Pendente | Proposto |
| A16 | Produtos | `GET /produtos` | Consultar produtos e saldo | Pendente | Proposto |
| A17 | Produtos | `POST /produtos` | Registrar cadastro de produto | Pendente | Proposto |
| A18 | Estoques | `POST /movimentacoes-estoque` | Registrar entrada/reposição | Pendente | Proposto |
| A19 | Vendas | `GET /vendas` | Consultar histórico de vendas independentes | Pendente | Proposto |
| A20 | Vendas | `POST /vendas` | Registrar venda independente | Pendente | Proposto |
| A23 | Perfil | `GET /perfil` | Consultar os próprios dados | Próprio usuário — objetivo RN-006; autenticação pendente | Proposto |
| A24 | Perfil | `PUT /perfil` | Alterar os próprios dados | Próprio usuário; campos editáveis pendentes | Proposto |
| A25 | Perfil | `PUT /perfil/senha` | Alterar a própria senha | Próprio usuário; política pendente | Proposto |
| A27 | Configurações | `GET /configuracoes` | Consultar dados e parâmetros | Pendente — RN-003 | Proposto |
| A28 | Configurações | `PUT /configuracoes` | Alterar dados e parâmetros | Pendente — RN-003 | Proposto |
| A29 | Configurações | `POST /configuracoes/{cadastro}` | Cadastrar item auxiliar | Pendente — RN-003 | Proposto |
| A26 | Dashboard | `GET /dashboard` | Consultar resumo operacional | Pendente; acesso amplo é sugestão | Proposto |
| A30 | Financeiro | `GET /financeiro` | Consultar painel financeiro | Pendente — RN-003 | Proposto |
| A31 | Financeiro | `GET /financeiro/{indicador}` | Consultar indicador detalhado | Pendente — RN-003 | Proposto |

## Origem e limites

**Definidos/exigidos:** módulos e objetivos no Guia §§4–5 (RF-001 a RF-011); Node.js, HTTP e versionamento no §9 (RNF-003); validação e segurança no §8.2 (RNF-004/RNF-005). **Sugeridos:** conteúdo das telas (§5), fluxos (§6), recursos e convenções (§§9.2–9.4). As operações são uma tradução técnica dessas fontes; a saída do sistema também atende ao fluxo explicitamente solicitado nesta conversa.

O código atual contém apenas a demonstração React e `backend/.gitkeep`; não há API implementada. Não se cria endpoint por tabela: itens e materiais utilizados são componentes das operações de Venda/OS. Não se propõe exclusão genérica. A obrigação acadêmica de usar DELETE permanece no projeto, mas o recurso e a regra de remoção/desativação precisam de PD-N09 antes de especificar uma exclusão. Edição cadastral, mudança de estado/cancelamento e movimento de estoque são comandos distintos.

<a id="permissoes"></a>
## Permissões

Somente o cadastro de Funcionários tem exclusividade administrativa definida (RN-001). Administrador/funcionário nas áreas operacionais é sugestão (RN-002); Configuração e Financeiro permanecem pendentes (RN-003). RN-006 define gerenciar os próprios dados, sem fechar campos editáveis. A matriz por operação deve ser confirmada em PD-N01.

Não há escolha de sessão, token ou cabeçalho de credencial: PD-N02/PD-R04 e [Arquitetura §9](arquitetura.md). Endpoint pendente não é endpoint público. Todas as permissões devem ser verificadas na API; esconder menu/botão não basta. O identificador de responsável/vendedor enviado não autoriza agir em nome de outra pessoa; validar sua relação com o usuário após definir autoria e permissões.

<a id="padroes"></a>
## Padrões comuns propostos

- **Tipos:** IDs inteiros; `text` como string, `boolean` como booleano; datas `YYYY-MM-DD` e instantes como strings ISO 8601 com fuso. Para `numeric`, propor **string decimal** na API, preservando a representação exata; escala/arredondamento permanecem pendentes. Essa escolha é nova proposta técnica, não mudança de regra financeira.
- **Corpos:** JSON com `Content-Type: application/json`. Campos e significado vêm do [modelo](modelo-de-dados.md). Não há novos campos obrigatórios de negócio aprovados. IDs de caminho identificam tecnicamente o recurso; IDs gerados não são preenchidos no cadastro. Representações pendentes não devem ser completadas por suposição.
- **Sucesso:** `200` para consulta/alteração, `201` após criação confirmada, `204` sem corpo nas operações indicadas. Demais sucessos usam `{"dados": ...}`; listas usam array e `{"dados": []}` quando vazias. As respostas usam os campos da entidade correspondente; credenciais e `senha_protegida` nunca integram a representação pública.
- **Opcionais:** somente campos aprovados como opcionais aceitam ausência/`null`, conforme o modelo; resposta com `null`. Corpo de PUT representa o conjunto editável acordado, não aplicação silenciosa de valores nulos a campos omitidos. Conjunto editável ainda pendente onde indicado.
- **P — paginação:** sugestão do Guia §§9.4/14, ainda não aprovada. Proposta de parâmetros `pagina` e `tamanho` (inteiros) e resposta `dados` + `paginacao: {pagina, tamanho, total}`. Limites, padrão, ordenação e adoção por lista ficam pendentes; não truncar silenciosamente. O cadastro/listagem inicial de Clientes conserva resposta sem paginação até revisão explícita dessa proposta.
- **E — erros comuns:** `400` para estrutura/tipo/validação aprovada inválidos; `401` sem identificação válida; `403` sem autorização; `500` para falha interna, sem expor detalhes do banco ou segredos. **R:** `404` para recurso de caminho não encontrado. Referência enviada no corpo que não existe: proposta `400`, sem criar vínculos órfãos. **N:** recusa por regra de operação/estado/saldo: regra e código específico pendentes; não inventar limite nem aprovar `409` por inferência.
- **Efeitos:** ações relacionadas devem confirmar juntas ou ser desfeitas em conjunto (RN-018); saldo nunca negativo (RN-019). O momento da baixa e os efeitos de cancelamento continuam pendentes. Uma falha de rede pode ocorrer após gravar: consultar a situação antes de repetir uma operação, sem presumir que o envio falhou.

Exemplo de erro de estrutura, sem inventar campo obrigatório:

```json
{"erro":{"codigo":"DADOS_INVALIDOS","mensagem":"O corpo deve conter um objeto JSON válido."}}
```

## Detalhamento conciso por funcionalidade

Entradas, respostas e efeitos abaixo são **propostos**. “Pendente” marca somente a parte que ainda não pode ser fechada. E/R/N/P remetem aos padrões acima. Falta de definição de obrigatoriedade não autoriza salvar registros vazios.

<a id="a01"></a>
### A01 — POST /auth/login

- **Entrada:** Identificador de entrada (usuário ou e-mail, nome da chave pendente) e senha transitória; obrigatoriedade e política em PD-N02.
- **Sucesso:** 200; identidade do usuário e confirmação do acesso, representação da credencial pendente.
- **Erros, efeitos e origem:** 401 para credencial rejeitada, além de E. Não retorna senha nem senha_protegida. Guia §5.1; RF-015; PD-N02/PD-R04.

<a id="a02"></a>
### A02 — POST /auth/logout

- **Entrada:** Sem corpo proposto; identificação do acesso depende do mecanismo escolhido.
- **Sucesso:** 204, sem corpo.
- **Erros, efeitos e origem:** Invalidar o acesso conforme mecanismo aprovado, não apenas esconder telas. Encerramento solicitado nesta conversa; não há mecanismo definido nas fontes. PD-N02/PD-R04.

<a id="a03"></a>
### A03 — GET /clientes

- **Entrada:** Consulta opcional nome ou telefone (text/string); combinação e tipo de busca pendentes. Sem corpo. P quando aprovada.
- **Sucesso:** 200; lista Cliente; vazia: dados: [].
- **Erros, efeitos e origem:** E. Guia §5.3; RF-017. Filtros são ampliação proposta do contrato inicial sem busca.

<a id="a04"></a>
### A04 — POST /clientes

- **Entrada:** Corpo Cliente sem id: nome, telefone, email, endereco, observacoes. Obrigatoriedade em PD-N03.
- **Sucesso:** 201; Cliente persistido com id.
- **Erros, efeitos e origem:** E. Não presumir unicidade de contato ou rejeição de duplicados. Guia §5.3; RF-003/RF-017.

<a id="a05"></a>
### A05 — GET /clientes/{id}

- **Entrada:** id de Cliente no caminho; sem corpo.
- **Sucesso:** 200; Cliente.
- **Erros, efeitos e origem:** E + R. Histórico é consultado por A09/A19; vínculo de compras ainda pendente. Guia §5.3; RF-017.

<a id="a06"></a>
### A06 — PUT /clientes/{id}

- **Entrada:** id e representação dos campos Cliente que forem aprovados como editáveis; não inclui id no corpo. Substituição e campos ausentes precisam estar alinhados antes de usar PUT.
- **Sucesso:** 200; Cliente atualizado.
- **Erros, efeitos e origem:** E + R. Não cancela OS, remove cliente nem altera histórico. Campos editáveis em PD-N03. Guia §5.3; RF-017.

<a id="a07"></a>
### A07 — GET /funcionarios

- **Entrada:** Busca opcional; campo e critério pendentes, sem inventar filtro por dado pessoal. Sem corpo. P quando aprovada.
- **Sucesso:** 200; lista de Funcionário sem senha_protegida.
- **Erros, efeitos e origem:** E. Guia §5.5; RF-019.

<a id="a08"></a>
### A08 — POST /funcionarios

- **Entrada:** nome, email, perfil, ativo conforme modelo; campos obrigatórios e criação da credencial pendentes (PD-N02/PD-N03). Nunca receber senha_protegida pronta do navegador.
- **Sucesso:** 201; Funcionário cadastrado, sem senha_protegida.
- **Erros, efeitos e origem:** E. Nenhum perfil ou estado padrão presumido. Guia §5.5; RF-019.

<a id="a21"></a>
### A21 — GET /funcionarios/{id}

- **Entrada:** id do funcionário; sem corpo.
- **Sucesso:** 200; Funcionário, sem senha_protegida.
- **Erros, efeitos e origem:** E + R. Guia §5.5; RF-019.

<a id="a22"></a>
### A22 — PUT /funcionarios/{id}/acesso

- **Entrada:** id; perfil e ativo como configuração de acesso; domínio, obrigatoriedade e efeitos em PD-N01/PD-N02.
- **Sucesso:** 200; perfil e ativo confirmados, com id.
- **Erros, efeitos e origem:** E + R. É desativação/ativação de acesso, não exclusão da pessoa nem das vendas antigas. Guia §5.5; PD-N09.

<a id="a09"></a>
### A09 — GET /ordens-servico

- **Entrada:** Filtros opcionais status, cliente_id, data_entrada; strings/data e ID conforme modelo. Significado de filtro por data pendente. Sem corpo; P quando aprovada.
- **Sucesso:** 200; lista de OS.
- **Erros, efeitos e origem:** E. Guia §§5.3–5.4; RF-017/RF-018; PD-N03/PD-N04.

<a id="a10"></a>
### A10 — POST /ordens-servico

- **Entrada:** cliente_id, responsavel_id, descricao_calcado, servico, valor, data_entrada, prazo_entrega, status, forma_pagamento, observacoes. Tipos do modelo; servico e forma_pagamento ainda sem representação fechada. Obrigatoriedade em PD-N03.
- **Sucesso:** 201; OS registrada com id.
- **Erros, efeitos e origem:** E. Estado inicial, datas e pagamento não são presumidos; não dispara baixa por simples cadastro. Guia §§5.4/6.1; PD-N03/PD-N04/PD-N05/PD-N07.

<a id="a11"></a>
### A11 — GET /ordens-servico/{id}

- **Entrada:** id da OS; sem corpo.
- **Sucesso:** 200; OS e materiais_utilizados como lista de Material utilizado em OS.
- **Erros, efeitos e origem:** E + R. materiais_utilizados é composição de resposta, não nova coluna/tabela. Guia §5.4; RF-018.

<a id="a12"></a>
### A12 — PUT /ordens-servico/{id}/status

- **Entrada:** id e status pretendido; valores e transições de RN-010 continuam sugeridos.
- **Sucesso:** 200; OS com estado confirmado.
- **Erros, efeitos e origem:** E + R + N. Cancelamento não é exclusão nem edição cadastral: efeitos sobre consumo, venda e pagamentos pendentes. Guia §6.1; PD-N04/PD-N05/PD-N07.

<a id="a13"></a>
### A13 — POST /ordens-servico/{id}/materiais

- **Entrada:** id da OS; material_id e quantidade_usada; ordem_servico_id vem do caminho. Vínculos obrigatórios são proposta estrutural do modelo; quantidade/unidade em PD-N03/PD-N07.
- **Sucesso:** 201; registro Material utilizado em OS com id.
- **Erros, efeitos e origem:** E + R + N. Baixa e custo são sugeridos em RN-012, mas gatilho pendente. Só habilitar o fluxo após definir efeitos e garantir execução conjunta (RN-018/RN-019). Guia §§5.4/6.3.

<a id="a14"></a>
### A14 — GET /materiais

- **Entrada:** Sem corpo; P quando aprovada.
- **Sucesso:** 200; lista Material.
- **Erros, efeitos e origem:** E. Inclui saldo, unidade e dados aprovados; alerta depende de PD-N08. Guia §5.7; RF-021.

<a id="a15"></a>
### A15 — POST /materiais

- **Entrada:** nome, categoria, unidade, quantidade_minima, custo. Obrigatoriedade e categoria pendentes. Saldo inicial não é arbitrado nem recebido para contornar movimentações.
- **Sucesso:** 201; Material com id; definição do saldo inicial pendente.
- **Erros, efeitos e origem:** E. Operação técnica proposta para alimentar o cadastro previsto em §§5.7/10; não aprova entrada inicial, alerta ou custo. PD-N03/PD-N06/PD-N07/PD-N08.

<a id="a16"></a>
### A16 — GET /produtos

- **Entrada:** Sem corpo; P quando aprovada.
- **Sucesso:** 200; lista Produto.
- **Erros, efeitos e origem:** E. Pode alimentar a seleção de itens na venda. Guia §§5.6/5.8; RF-020/RF-022.

<a id="a17"></a>
### A17 — POST /produtos

- **Entrada:** nome, categoria, preco_custo, preco_venda; obrigatoriedade pendente. Saldo inicial não é arbitrado nem alterado como dado cadastral.
- **Sucesso:** 201; Produto com id; definição do saldo inicial pendente.
- **Erros, efeitos e origem:** E. Proposta técnica para o cadastro previsto em §§5.8/10. PD-N03/PD-N06/PD-N07.

<a id="a18"></a>
### A18 — POST /movimentacoes-estoque

- **Entrada:** tipo, quantidade, data, motivo e exatamente um de material_id/produto_id (restrição proposta do modelo). Formatos e obrigatoriedade de negócio pendentes.
- **Sucesso:** 201; Movimentação registrada com id, após efeitos confirmados.
- **Erros, efeitos e origem:** E + N. Neste contrato, comando para entradas sugeridas nos §§5.7–5.8. Saída por uso/venda pertence aos fluxos A13/A20; não registrar duas baixas. Correções e cancelamentos dependem de PD-N07; RN-018/RN-019.

<a id="a19"></a>
### A19 — GET /vendas

- **Entrada:** Filtros opcionais inicio/fim do período (datas; inclusão de limites e data de referência pendentes). cliente_id somente se o vínculo Cliente–Venda for aprovado e incorporado ao modelo. P quando aprovada.
- **Sucesso:** 200; lista Venda com itens.
- **Erros, efeitos e origem:** E. Histórico de compras por cliente não está fechado. Guia §§5.3/5.6; PD-N03/PD-N06.

<a id="a20"></a>
### A20 — POST /vendas

- **Entrada:** data, vendedor_id, forma_pagamento e itens (produto_id, quantidade, preco_unitario); formatos e obrigatoriedade em PD-N03/PD-N05. total existe na resposta, mas origem/cálculo precisa de definição: não confiar em total arbitrado pelo navegador.
- **Sucesso:** 201; Venda com id, total e itens persistidos.
- **Erros, efeitos e origem:** E + N. venda_id das linhas vem da venda criada. Baixa e faturamento são sugestões RN-011; gatilho, preço e pagamento em PD-N05/PD-N06/PD-N07. Não requer criar OS (RN-008). Consistência é exigida.

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

## Exemplos principais — fictícios e não normativos

**Cliente (A04):** o exemplo preserva os nomes do contrato anterior; não aprova campos obrigatórios nem formato telefônico. A03 retorna esses objetos dentro de uma lista, A05 um objeto.

```json
{"nome":"Cliente Exemplo","telefone":"00000000000","email":"cliente@example.com","endereco":"Rua Fictícia, 10","observacoes":"Demonstração"}
```

Resposta proposta `201`:

```json
{"dados":{"id":1,"nome":"Cliente Exemplo","telefone":"00000000000","email":"cliente@example.com","endereco":"Rua Fictícia, 10","observacoes":"Demonstração"}}
```

**OS (A10), fragmento de corpo:** omite de propósito campos com representação não fechada, como `servico`. Não é um pedido completo válido nem autoriza omitir campos que venham a ser obrigatórios.

```json
{"cliente_id":1,"descricao_calcado":"Sapato de demonstração","observacoes":"Dados fictícios"}
```

**Venda (A20), fragmento de corpo:** `itens` agrupa linhas de Item de venda; não é coluna adicional. Exemplifica a proposta de string decimal, sem aprovar preço, mínimo de itens, pagamento, total ou baixa.

```json
{"itens":[{"produto_id":2,"quantidade":"1","preco_unitario":"12.50"}]}
```

**Uso em OS (A13), fragmento de corpo:** OS vem do caminho. Unidade, quantidade válida e momento de baixa dependem da decisão de negócio.

```json
{"material_id":3,"quantidade_usada":"0.5"}
```

## Lacunas locais e evolução

Cliente–Venda e OS–Venda, quantidade de serviços por OS e origem das movimentações ainda não estão resolvidos no modelo (PD-N03/PD-N07). Não simular histórico de compras nem baixar estoque duas vezes para preencher essas lacunas. Configuração/indicadores dependem dos respectivos esquemas e fórmulas (PD-N06), não de tabelas por tela. CEP/CSV continuam sugestões em RF-026/RF-027; adoção, fonte e contrato permanecem PD-R10, sem novas rotas presumidas.

A primeira etapa pode preparar identificação/acesso e cadastro/listagem de clientes. Seus bloqueios estão no [modelo de Cliente](modelo-de-dados.md#pendencias-que-afetam-o-cadastro-e-a-listagem); a sequência completa está em [Telas e fluxos](telas-e-fluxos.md#etapas).
