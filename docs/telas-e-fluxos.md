# Telas e fluxos — visão inicial do sistema

[Índice](README.md) · [Modelo de dados](modelo-de-dados.md) · [Contrato da API](api.md)

## Mapa geral

As onze telas e subtelas são **definições do rascunho** (Guia §4; RF-001 a RF-011). Seus objetivos vêm do §5; os detalhes de conteúdo dessa seção e os fluxos do §6 são **sugestões**. A tradução em ações e operações abaixo é **proposta não implementada**, sem novas aprovações de negócio. `frontend/src/App.tsx` ainda é a demonstração React; API e telas de negócio não existem no repositório consultado.

| Tela e subtelas | Finalidade | Acesso conforme fontes |
|---|---|---|
| Login | Identificar quem utiliza o sistema | Entrada para todos é sugestão do Guia §4; política pendente. |
| Dashboard | Resumo operacional | Administrador/funcionário sugeridos, não aprovados. |
| Clientes: página e perfil do cliente | Organizar dados e consultas | Administrador/funcionário sugeridos. |
| OS: página e detalhes | Registrar e acompanhar reparos | Administrador/funcionário sugeridos. |
| Funcionários: página e perfil de funcionário | Gerenciar quem acessa | **Somente administrador — definido, RN-001.** |
| Vendas independentes: cadastro e histórico | Registrar produtos vendidos sem criar OS | Administrador/funcionário sugeridos. |
| Estoque de materiais | Controlar insumos consumidos | Administrador/funcionário sugeridos. |
| Estoque de produtos | Controlar itens para venda | Administrador/funcionário sugeridos. |
| Perfil do usuário | Gerenciar os próprios dados | Objetivo próprio definido em RN-006; acesso e edição detalhados pendentes. |
| Configuração | Ajustar funcionamento e cadastros auxiliares | **Pendente — RN-003.** |
| Financeiro: Dashboard financeiro e Faturamento, Lucro, Imposto, Materiais | Consultar indicadores | **Pendente — RN-003.** |

Não inferir acesso irrestrito do administrador: o Guia §3 sugere “todas as telas”, mas §§4/17 deixam Configuração/Financeiro pendentes. A matriz por operação está em PD-N01. Não confundir Perfil do usuário (próprio) com Perfil de funcionário (administração).

## Navegação e padrões compartilhados

**Definido:** barra lateral esquerda, destaque da página atual e busca de páginas (Guia §11.3; RF-012). Ordem dos itens e detalhes visuais são sugestões. **Exigido:** React, responsividade, validação e integração com API (RF-013/RF-014, RNF-001/RNF-002). Não se escolhe paleta, biblioteca visual ou roteador por este documento.

**Proposta comum de navegação:** menu abre as áreas autorizadas; listas levam ao cadastro ou detalhe quando essas ações estão previstas; salvar volta/atualiza a consulta relacionada. Cancelar preenchimento retorna sem enviar dados: não é cancelamento de venda/OS. Ocultar áreas sem permissão é apresentação proposta (RN-005); a API também deve negar acesso.

| Estado comum — proposta | Apresentação e comportamento |
|---|---|
| Carregamento | Indicar consulta em andamento; não mostrar lista vazia antes da resposta. |
| Lista vazia | Após resposta válida sem registros, mostrar aviso; oferecer cadastro somente onde previsto e permitido. |
| Validação | Aplicar regras aprovadas, indicar problema e preservar preenchimento. Campos obrigatórios continuam pendentes onde PD-N03 não foi resolvida; API também valida. |
| Salvando | Indicar envio em andamento e impedir repetição pelo mesmo botão; não substitui consistência no servidor. |
| Sucesso | Confirmar somente após resposta de sucesso da API e atualizar dados exibidos. |
| Erro de consulta | Informar falha e permitir nova consulta; não substituir por lista vazia ou valores financeiros zero. |
| Erro de alteração | Preservar dados; sem resposta, informar que não foi possível confirmar. Verificar situação antes de repetir, pois a operação pode ter sido gravada. |
| Gravação confirmada, atualização falhou | Manter a confirmação e repetir apenas a consulta; não reenviar o cadastro. |
| Acesso negado | Não exibir dados nem executar ação; falta de identificação e falta de permissão seguem o contrato e mecanismo a aprovar. |

Campos/números/datas seguem o [modelo](modelo-de-dados.md) e os [padrões da API](api.md#padroes). Decimais transmitidos como strings são proposta técnica, não texto livre no formulário. Somente dados aprovados como opcionais podem aparecer como “Não informado”. Exemplos usam dados fictícios, nunca preenchimento automático de cadastros reais.

## Telas, ações e fluxos principais

Todas as sequências abaixo são **propostas**, salvo objetivos e restrições explicitamente definidos. Referências Axx apontam para operações do contrato; cada operação mantém suas próprias pendências. Não se exige concluir módulos futuros para começar Clientes.

### Login — entrar e sair

- **Objetivo/origem:** identificar usuário; Guia §5.1, RF-001/RF-015. Campos sugeridos: usuário **ou** e-mail e senha; escolha em PD-N02, sem presumir ambos.
- **Ações e fluxo:** informar credenciais → [A01](api.md#a01) → Dashboard após sucesso (destino sugerido no guia); erro mantém possibilidade de correção. Sair → [A02](api.md#a02) → Login após encerrar acesso; fluxo de saída solicitado nesta conversa, mecanismo pendente.
- **Pendências:** política e mecanismo de identificação, encerramento e acesso às demais telas (PD-N02/PD-R04). Não especificar sessão/token por inferência.

### Dashboard — resumo e atalhos

- **Objetivo/origem:** visão rápida da rotina; Guia §5.2, RF-002/RF-016.
- **Conteúdo e ações:** OS abertas/prontas, vendas do dia e alertas propostos; atalhos para novo cliente, nova OS e nova venda, respeitando permissões.
- **Fluxo/API:** entrar na tela → [A26](api.md#a26) → consultar resumo ou seguir atalho para a área correspondente. Atalho não cria registro nem exige outra API própria.
- **Pendências:** conteúdo exato, significado dos estados, período do dia e alertas (PD-N04/PD-N06/PD-N08). Não inventar números para indicador indisponível.

### Clientes — cadastrar, consultar e editar

- **Objetivo/origem:** manter dados organizados; Guia §5.3, RF-003/RF-017. Formulário: `nome`, `telefone`, `email`, `endereco`, `observacoes`; `id` vem da API. Colunas iniciais propostas: nome, telefone, e-mail; busca por nome/telefone é sugestão.
- **Cadastro/lista:** abrir Clientes → [A03](api.md#a03) → Novo cliente → preencher → validar → [A04](api.md#a04) → confirmar `201` → consultar lista novamente. Reconhecer registro pelo `id`, sem prometer posição na lista.
- **Perfil/edição:** selecionar cliente → [A05](api.md#a05); editar dados permitidos → [A06](api.md#a06). Histórico de OS usa [A09](api.md#a09) com `cliente_id`; compras dependem do vínculo ainda ausente no modelo e de [A19](api.md#a19). Do histórico de OS pode-se abrir seus detalhes, se autorizado.
- **Pendências:** campos, obrigatoriedade, formatos e edição (PD-N03); permissões (PD-N01); vínculo das compras. Busca/edição/histórico ampliam a visão documental anterior, sem se tornarem requisitos aprovados.

```text
Menu | Clientes                       [Novo cliente]
     | Nome | Telefone | E-mail
     | Resultado, aviso de lista vazia ou erro
Cadastro: nome, telefone, email, endereco, observacoes
[Salvar] [Cancelar preenchimento]
```

### Funcionários — administrar acessos

- **Objetivo/origem:** gerenciar acesso, **restrito ao administrador**; Guia §5.5, RN-001/RF-019.
- **Informações:** `nome`, `email`, `perfil`, `ativo` conforme modelo; busca sugerida, critério pendente. Nunca mostrar `senha_protegida` nem senha existente. Criação da credencial ainda depende da autenticação.
- **Fluxo/API:** abrir lista → [A07](api.md#a07) → cadastrar com [A08](api.md#a08) ou consultar perfil com [A21](api.md#a21); ajustar acesso por [A22](api.md#a22) após confirmar políticas. Retornar/atualizar lista.
- **Pendências:** dados, perfis, efeito de desativação sobre acesso iniciado e autoria histórica (PD-N01/PD-N02/PD-N03/PD-N09). Não há exclusão de funcionário nem editor genérico de todos os dados aprovado por esta proposta.

### OS — abrir, acompanhar e registrar materiais

- **Objetivo/origem:** acompanhar serviços; Guia §§5.4/6.1/6.3, RF-004/RF-018/RN-010/RN-012.
- **Informações:** `cliente_id`, `responsavel_id`, `descricao_calcado`, `servico`, `valor`, `data_entrada`, `prazo_entrega`, `status`, `forma_pagamento`, `observacoes`; materiais utilizados em lista vinculada. Representação de serviço/pagamento pendente, conforme modelo.
- **Abertura/acompanhamento:** lista/filtros de cliente, estado e data → [A09](api.md#a09); escolher cliente consultando A03, preencher → [A10](api.md#a10) → detalhes por [A11](api.md#a11). A seleção de responsável depende da regra de autoria; não conceder acesso à lista administrativa de funcionários a quem não pode consultá-la.
- **Estado/cancelamento:** solicitar mudança por [A12](api.md#a12), somente após aprovar transições. “Aberta”, “Em andamento”, “Pronta”, “Entregue” e “Cancelada” são estados sugeridos, não sequência obrigatória nem permissão para cancelar qualquer OS.
- **Consumo:** consultar materiais com [A14](api.md#a14) → selecionar `material_id` e informar `quantidade_usada` → [A13](api.md#a13) → atualizar detalhe/saldo conforme efeito aprovado. É um único fluxo de uso, não uma baixa adicional manual. Não há gatilho de baixa aprovado; não habilitar efeito automático antes de PD-N07.
- **Pendências:** serviços e responsável (PD-N03), transições/prazos (PD-N04), pagamento/entrega (PD-N05), custo (PD-N06), consumo/correção (PD-N07). Não acrescentar edição geral da OS nem excluir registro como cancelamento.

### Vendas independentes — registro e histórico

- **Objetivo/origem:** vender produtos sem criar OS (**definido em RN-008**); detalhes no Guia §§5.6/6.2, RF-020/RN-011.
- **Informações:** `data`, `vendedor_id`, `forma_pagamento`, `total` e `itens` com `produto_id`, `quantidade`, `preco_unitario`. Fonte do preço, total e autoria precisam de regra; não confiar em valores manipulados no navegador.
- **Fluxo/API:** histórico com período por [A19](api.md#a19) → nova venda → consultar [A16](api.md#a16) → selecionar produtos/quantidades e forma de pagamento → [A20](api.md#a20) → confirmação e nova consulta. A representação do histórico inclui itens; não exige endpoint separado por item.
- **Efeitos e pendências:** baixa e faturamento são sugestões; confirmar momentos, pagamento, composição do total e correções (PD-N05/PD-N06/PD-N07). Quando aprovados, efeitos relacionados precisam ocorrer juntos e sem saldo negativo. Não há exclusão ou cancelamento de venda definido. Vendas ligadas a OS continuam com relacionamento pendente no modelo, sem novo fluxo presumido.

### Estoque de materiais

- **Objetivo/origem:** controlar insumos; Guia §5.7, RF-007/RF-021.
- **Informações:** `nome`, `categoria`, `unidade`, `quantidade`, `quantidade_minima`, `custo`; alerta apenas se aprovado.
- **Fluxo/API:** consultar [A14](api.md#a14); registrar cadastro por [A15](api.md#a15) (operação técnica proposta para alimentar a lista). Registrar entrada de compra por [A18](api.md#a18) → atualizar saldo. Saída por uso segue OS/A13; não editar saldo diretamente como cadastro.
- **Pendências:** unidades/frações/campos, saldo inicial, custo, mínimos e correções (PD-N03/PD-N06/PD-N07/PD-N08). Campos de movimento são os do contrato; tipo e motivo não ganham valores padrão por este documento.

### Estoque de produtos para venda

- **Objetivo/origem:** controlar itens vendidos; Guia §5.8, RF-008/RF-022.
- **Informações:** `nome`, `categoria`, `quantidade`, `preco_custo`, `preco_venda`; alerta sujeito a aprovação.
- **Fluxo/API:** consultar [A16](api.md#a16); novo cadastro por [A17](api.md#a17) (proposta técnica); reposição por [A18](api.md#a18) com `produto_id` → atualizar saldo. Venda seleciona esses produtos em A20; não repetir a saída em A18.
- **Pendências:** categoria, saldo inicial, quantidades, preços e alertas (PD-N03/PD-N06/PD-N07/PD-N08). Não propor edição/exclusão genérica de produtos para resolver movimentações.

### Perfil do usuário

- **Objetivo/origem:** gerenciar os próprios dados; Guia §5.9, RF-009/RF-023/RN-006.
- **Informações:** dados pessoais aprovados da entidade Funcionário, sem senha armazenada; não criar cadastro paralelo de usuário.
- **Fluxo/API:** abrir perfil → [A23](api.md#a23) → alterar somente campos pessoais autorizados por [A24](api.md#a24). Alteração de senha sugerida usa [A25](api.md#a25), com campos e confirmação de identidade ainda pendentes. Retornar ao próprio perfil.
- **Pendências:** campos editáveis e política de senha (PD-N02/PD-N03/PD-R04). Autoedição não concede alteração de `perfil` ou `ativo`.

### Configuração

- **Objetivo/origem:** ajustar funcionamento; Guia §5.10, RF-010/RF-024. Acesso pendente (RN-003).
- **Informações:** dados da empresa, tipos de serviço, formas de pagamento, categorias e parâmetros financeiros, somente conforme adoção e esquema aprovados. Não há campos completos nem alíquota definidos.
- **Fluxo/API:** abrir → [A27](api.md#a27); ajustar dados/parâmetros por [A28](api.md#a28); cadastrar auxiliares por [A29](api.md#a29), se aprovados. Atualizar consulta; formulários de OS/venda/estoque podem consumir as opções autorizadas sem conceder edição de Configuração.
- **Pendências:** esquema e divisão dos catálogos, permissões de leitura de opções por outras telas, formas aceitas e parâmetros (PD-N01/PD-N03/PD-N04/PD-N05/PD-N06). Não usar um formulário JSON livre nem conceder acesso à configuração inteira como atalho.

### Controle financeiro

- **Objetivo/origem:** acompanhar indicadores; Guia §5.11, RF-011/RF-025; acesso em RN-003.
- **Informações:** totais/evolução por período e subtelas Faturamento, Lucro, Imposto e Materiais; fórmulas e dados retornados permanecem pendentes (RN-014 a RN-017).
- **Fluxo/API:** selecionar período → painel com [A30](api.md#a30) → abrir indicador com [A31](api.md#a31) → voltar ao painel. Consulta apenas é sugestão RN-007; não se criam lançamentos ou edição financeira por inferência.
- **Pendências:** quem consulta, datas de reconhecimento, custos históricos e fórmulas (PD-N01/PD-N05/PD-N06). Não exibir estimativa fictícia como resultado real, nem transformar regra ausente em valor zero.

<a id="etapas"></a>
## Implementação por funcionalidade — sequência sugerida

1. **Identificação/acesso e cadastrar/listar clientes:** alinhar autenticação, permissões, campos/validações e contrato técnico; preparar os componentes de Clientes em paralelo às partes independentes da identificação. Não liberar dados reais sem proteção.
2. **Funcionários, próprio perfil e consultas cadastrais:** gerenciamento de acesso e edição autorizada; completar consulta/edição de Clientes após confirmar campos editáveis.
3. **Cadastros de materiais/produtos e configuração necessária:** resolver unidades, saldo inicial e somente os auxiliares realmente adotados; entradas consistentes antes de alimentar estoque operacional.
4. **OS, consumo e vendas:** implementar cada operação com seus efeitos de estoque confirmados e atômicos (todos juntos ou nenhum), sem ativar uma baixa parcialmente implementada.
5. **Dashboard e financeiro:** primeiro resumos com significado confirmado; indicadores somente após fórmulas, datas e custos. Completar refinamentos/integrações aprovados por etapa.

Bloqueios da **primeira etapa**: PD-N03 para campos/obrigatoriedade/formatos de Cliente; PD-N01/PD-N02/PD-R04 para quem cadastra/lista e como se identifica; PD-R09 para alinhar representações, API e acesso ao banco. Pendências financeiras e futuras não impedem essa etapa. Identidade visual definitiva e protótipo completo não são pré-condições aqui.

<a id="verificacao"></a>
## Verificação prática proposta

Nenhum teste de aplicação foi executado nesta entrega documental. Após aprovar os detalhes de cada etapa:

- Cadastrar cliente fictício, receber `201` e reencontrá-lo após nova consulta; conferir também lista vazia e erro sem duplicar envio.
- Rejeitar dados que contrariem validações confirmadas, tanto pela interface quanto diretamente na API; manter preenchimento para correção.
- Impedir ações sem permissão na API, mesmo com acesso direto ao endereço; não devolver credenciais.
- Verificar alterações de estado, movimentos e valores somente contra regras aprovadas; testar falha de uma gravação relacionada sem deixar efeitos parciais ou saldo negativo.
- Conferir os estados comuns, navegação e uso em tela estreita, sem afirmar atendida uma pendência ainda aberta.
