# Regras de negócio — Seda e Couro

[Índice da documentação](README.md) · [Guia do Projeto](guia-do-projeto.md) · [Requisitos](requisitos.md)

## Leitura e situação atual

Este documento registra permissões, condições e relações entre os módulos da sapataria. As telas e os detalhes de interface estão nos requisitos; aqui são referenciados por identificador. Regras de convivência e contribuição permanecem no [CONTRIBUTING](../CONTRIBUTING.md).

Cada RN informa origem, classificação, situação da definição e limite do critério de aceitação. “Guia §…” remete à seção do Guia do Projeto. **Sugestão significa proposta não aprovada**, inclusive quando a fonte usa verbos afirmativos. As marcações dos §§3, 5, 6, 9.3 e 10 também abrangem tabelas e listas internas, conforme a [legenda documental](README.md#como-interpretar-as-classificacoes).

**Situação da implementação de todas as RN:** não implementadas nas funcionalidades de negócio, conforme o aviso inicial do [README do projeto](../README.md). O [CHANGELOG](../CHANGELOG.md), em “Não lançado”, registra somente a base inicial e a documentação. Essa atribuição é documental; não houve auditoria de código para confirmar cada regra.

Critérios de sugestões são propostos e condicionados à aprovação. Quando falta decisão, o texto registra **Pendente de definição**. A autorização de criação destes documentos não altera a classificação original.

## Permissões e identificação

### RN-001

**Cadastro de funcionários exclusivo do administrador.**

- **Origem:** Guia §§3, 4 e 5.5; a introdução do §4 ressalva expressamente essa permissão como definida no rascunho.
- **Classificação:** Definição da equipe. **Situação da definição:** definida no rascunho.
- **Regra e critério:** somente o administrador pode acessar o cadastro de funcionários. Isso não concede automaticamente acesso administrativo às outras áreas.
- **Pendente de definição:** mecanismo de bloqueio, mensagem ou redirecionamento para acesso negado; ver [PD-N01](#pd-n01).
- **Requisito relacionado:** [RF-005](requisitos.md#rf-005).

### RN-002

**Perfis e acessos propostos.**

- **Origem:** Guia §3 e coluna de acesso do §4, com a exceção definida em RN-001.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada; contém a divergência explicitada em RN-003.
- **Regra proposta:** dois perfis, administrador e funcionário. O §3 propõe administrador com acesso a todas as telas e funcionário com acesso às telas operacionais.
- **Critério proposto:** observar a distribuição sugerida abaixo, se aprovada. Nenhuma linha aprova permissões de ações específicas, como excluir ou cancelar.

| Área | Acesso descrito no Guia §4 | Classificação da informação |
|---|---|---|
| Login | Todos | Sugestão |
| Dashboard | Administrador e funcionário | Sugestão |
| Clientes | Administrador e funcionário | Sugestão |
| OS | Administrador e funcionário | Sugestão |
| Funcionários | Conforme [RN-001](#rn-001) | Definição da equipe, exceção à coluna sugerida |
| Vendas independentes | Administrador e funcionário | Sugestão |
| Estoque de materiais | Administrador e funcionário | Sugestão |
| Estoque de produtos | Administrador e funcionário | Sugestão |
| Perfil do usuário | Administrador e funcionário | Sugestão |
| Configuração | A definir; ver RN-003 | Pendência |
| Controle financeiro | A definir; ver RN-003 | Pendência |

- **Pendente de definição:** aprovação dos perfis e da matriz de acesso; [PD-N01](#pd-n01). A exigência geral de acesso por perfil está em [RNF-005](requisitos.md#rnf-005), mas não aprova esta matriz específica.
- **Requisitos relacionados:** RF-001 a RF-011 no [catálogo](requisitos.md).

### RN-003

**Acesso a Configuração e Controle financeiro.**

- **Origem:** Guia §3 (tabela e nota), §4 e §17.
- **Classificação:** Pendência. **Situação da definição:** Pendente de definição.
- **Divergência:** a tabela sugerida do §3 atribui todas as telas ao administrador; a nota dessa seção, o mapa do §4 e o §17 deixam estes acessos em aberto.
- **Critério de aceitação:** não fechado; é necessária a definição dos perfis autorizados, sem presumir exclusividade do administrador ou acesso do funcionário.
- **Decisão necessária:** [PD-N01](#pd-n01).
- **Requisitos relacionados:** [RF-010](requisitos.md#rf-010) e [RF-011](requisitos.md#rf-011).

### RN-004

**Proteção das telas por autenticação.**

- **Origem:** Guia §5.1, sob a marcação de sugestão da introdução do §5; §9.4 sugere rotas protegidas. Exigência geral de segurança no §8.2, com classificação mista no §14.
- **Classificação:** Sugestão para o comportamento específico de proteger as demais telas; Exigência acadêmica para segurança e acesso por perfil no §8.2. **Situação da definição:** comportamento proposto, com alcance a esclarecer.
- **Regra e critério propostos:** as telas além do Login só abrem para usuários autenticados.
- **Pendente de definição:** política concreta de autenticação em [PD-N02](#pd-n02) e divergência de segurança em [PD-R04](requisitos.md#pd-r04). Não estão especificados recuperação de senha, expiração de sessão ou limite de tentativas.
- **Requisitos relacionados:** [RF-001](requisitos.md#rf-001), [RF-015](requisitos.md#rf-015) e [RNF-005](requisitos.md#rnf-005).

### RN-005

**Visibilidade do item Funcionários no menu.**

- **Origem:** Guia §11.3, frase posterior ao esboço marcado como sugestão; restrição de acesso definida nos §§4 e 5.5.
- **Classificação:** Pendência de esclarecimento da abrangência da marcação. **Situação da definição:** Pendente de definição quanto à apresentação do menu.
- **Informação da fonte:** “O item Funcionários só aparece para o administrador.” A frase está após o esboço sugerido, sem nova marcação que esclareça se retoma uma definição do rascunho.
- **Critério:** a frase descreve a visibilidade pretendida, mas sua classificação precisa ser confirmada; não se confunde ocultar um item com implementar a restrição de acesso de RN-001.
- **Decisão necessária:** [PD-N10](#pd-n10).
- **Requisito relacionado:** [RF-012](requisitos.md#rf-012).

### RN-006

**Gerenciamento dos próprios dados.**

- **Origem:** Guia §5.9, objetivo da tela.
- **Classificação:** Definição da equipe. **Situação da definição:** definida no rascunho no nível do objetivo.
- **Regra e critério:** o perfil permite que cada pessoa gerencie os próprios dados. Isso não especifica todos os campos editáveis nem proíbe operações administrativas em outras telas.
- **Pendente de definição:** campos e efeitos de edição em [PD-N03](#pd-n03). A alteração de senha é detalhe sugerido, registrado em [RF-023](requisitos.md#rf-023).
- **Requisito relacionado:** [RF-009](requisitos.md#rf-009).

### RN-007

**Recurso financeiro somente para consulta.**

- **Origem:** Guia §9.3, tabela integralmente sugerida.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** o recurso de Financeiro da API oferece somente consulta.
- **Pendente de definição:** aprovação do alcance dessa restrição; [PD-N01](#pd-n01). A linha não define, por si só, todas as operações das telas de configuração financeira.
- **Requisitos relacionados:** [RF-011](requisitos.md#rf-011) e [RNF-009](requisitos.md#rnf-009).

## Vendas e ordens de serviço

### RN-008

**Venda independente de OS.**

- **Origem:** Guia §§1.3 e 5.6, objetivo da tela.
- **Classificação:** Definição da equipe. **Situação da definição:** definida no rascunho.
- **Regra e critério:** é possível registrar venda de produto de pronta entrega sem criar uma OS.
- **Limite:** isso não define campos obrigatórios, identificação do cliente ou formas de pagamento.
- **Requisito relacionado:** [RF-006](requisitos.md#rf-006).

### RN-009

**Formas e condições de pagamento.**

- **Origem:** Guia §17; §§5.4, 5.6 e 5.10 sugerem campos e cadastro auxiliar de formas de pagamento.
- **Classificação:** Pendência. **Situação da definição:** Pendente de definição.
- **Decisão necessária:** definir as formas aceitas pela loja e os comportamentos de pagamento necessários ao registro; [PD-N05](#pd-n05).
- **Critério de aceitação:** não fechado. A fonte não autoriza presumir pagamento parcial, parcelamento, desconto, troco ou integração com meios de pagamento. A exclusão dessa integração também é apenas sugerida no Guia §1.4.
- **Requisitos relacionados:** [RF-018](requisitos.md#rf-018), [RF-020](requisitos.md#rf-020) e [RF-024](requisitos.md#rf-024).

### RN-010

**Estados e significados da OS.**

- **Origem:** Guia §6.1; a marcação de Sugestão do §6 abrange todo o fluxo.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.

| Estado proposto | Significado documentado |
|---|---|
| Aberta | OS registrada e calçado recebido. |
| Em andamento | Serviço em execução. |
| Pronta | Serviço concluído, aguardando retirada. |
| Entregue | Cliente retirou e pagou; efeito financeiro tratado em RN-014. |
| Cancelada | OS encerrada sem execução do serviço. |

- **Critério proposto:** representar esses estados com esses significados, se aprovados. A ordem da tabela não estabelece transições obrigatórias nem permite inferir quais mudanças de estado são válidas.
- **Pendente de definição:** adoção dos estados, transições, tratamento de cancelamento após início do serviço, campos exatos e prazos; [PD-N03](#pd-n03) e [PD-N04](#pd-n04). Pagamento e faturamento: PD-N05 e PD-N06.
- **Requisitos relacionados:** [RF-004](requisitos.md#rf-004) e [RF-018](requisitos.md#rf-018).

### RN-011

**Efeitos da venda independente.**

- **Origem:** Guia §§5.6, 5.8, 6.2 e 6.3; detalhes e fluxo sugeridos.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra proposta:** selecionar produtos e quantidades, informar a forma de pagamento e registrar a venda; o registro dá baixa no estoque de produtos e soma o valor ao faturamento.
- **Critério proposto:** observar os efeitos de estoque e faturamento no registro da venda, se esse fluxo for aprovado. A consistência geral possui exigência própria em RN-018 e RN-019.
- **Pendente de definição:** momento e condições definitivas da operação, correções e cancelamentos, pagamentos e apuração financeira; [PD-N05](#pd-n05), [PD-N06](#pd-n06) e [PD-N07](#pd-n07).
- **Requisitos relacionados:** [RF-020](requisitos.md#rf-020) e [RF-022](requisitos.md#rf-022).

## Estoques e indicadores financeiros

### RN-012

**Uso de materiais em OS.**

- **Origem:** Guia §§5.7 e 6.3.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** materiais usados em uma OS saem do estoque de materiais e entram no custo de Materiais do financeiro.
- **Pendente de definição:** momento em que o uso é registrado, gatilho da baixa, apuração do custo e tratamento de correções/cancelamentos; [PD-N06](#pd-n06) e [PD-N07](#pd-n07).
- **Requisitos relacionados:** [RF-018](requisitos.md#rf-018) e [RF-021](requisitos.md#rf-021).

### RN-013

**Alertas de estoque e prazo.**

- **Origem:** Guia §§1.2, 5.2, 5.7 e 5.8.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** para materiais, alertar quando a quantidade estiver abaixo do mínimo. Para produtos, alertar estoque baixo; para OS, alertar proximidade do prazo.
- **Pendente de definição:** aprovação dos alertas, mínimos de materiais, critério de estoque baixo de produtos e antecedência de OS; [PD-N08](#pd-n08). Não há número ou prazo fixado nas fontes.
- **Requisitos relacionados:** [RF-016](requisitos.md#rf-016), [RF-021](requisitos.md#rf-021) e [RF-022](requisitos.md#rf-022).

### RN-014

**Faturamento.**

- **Origem:** Guia §§5.11, 6.1 e 6.3.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** total recebido com OS entregues e vendas independentes no período; OS entregue e venda independente geram faturamento.
- **Pendente de definição:** aprovar a definição, a data que determina o período e o reconhecimento quando retirada e pagamento não coincidirem. O estado sugerido Entregue reúne ambos os eventos; não resolve esses casos. Ver [PD-N06](#pd-n06).
- **Requisito relacionado:** [RF-025](requisitos.md#rf-025).

### RN-015

**Indicador de materiais.**

- **Origem:** Guia §§5.7, 5.11 e 6.3.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** representar gastos com materiais usados nos serviços; a ligação com o estoque está em RN-012.
- **Pendente de definição:** método de apuração dos custos e período de reconhecimento; [PD-N06](#pd-n06). Não há método de custeio definido.
- **Requisito relacionado:** [RF-025](requisitos.md#rf-025).

### RN-016

**Imposto e configuração financeira.**

- **Origem:** Guia §§5.10, 5.11 e 6.3; pendência explícita no §17.
- **Classificação:** Sugestão para a regra; Pendência para sua definição final. **Situação da definição:** proposta não aprovada, Pendente de definição.
- **Regra e critério propostos:** calcular imposto sobre o faturamento conforme parâmetro de Configuração, exemplificado como alíquota.
- **Pendente de definição:** regra efetiva de cálculo e parâmetro aplicável; [PD-N06](#pd-n06). Não se fixa percentual, fórmula completa, arredondamento ou obrigação fiscal.
- **Requisitos relacionados:** [RF-024](requisitos.md#rf-024) e [RF-025](requisitos.md#rf-025).

### RN-017

**Lucro.**

- **Origem:** Guia §5.11; pendência explícita no §17.
- **Classificação:** Sugestão para a regra; Pendência para sua definição final. **Situação da definição:** proposta não aprovada, Pendente de definição.
- **Regra e critério propostos:** faturamento menos materiais, imposto e demais custos que a equipe definir.
- **Pendente de definição:** fórmula final e custos incluídos; [PD-N06](#pd-n06). A sugestão não resolve tratamento do custo dos produtos vendidos nem autoriza omiti-lo ou incluí-lo por conta própria.
- **Requisito relacionado:** [RF-025](requisitos.md#rf-025).

## Consistência e operações sobre registros

### RN-018

**Operações relacionadas realizadas conjuntamente.**

- **Origem:** Guia §8.2, marcado como Orientação PI.
- **Classificação:** Exigência acadêmica. **Situação da definição:** exigência documentada.
- **Regra e critério:** operações ligadas acontecem juntas; o guia usa venda e baixa de estoque como exemplo. A exigência não escolhe mecanismo técnico ou resposta de erro.
- **Ambiguidade preservada:** os fluxos específicos de baixa dos §§5–6 são sugestões, embora o §8.2 exija consistência usando esse exemplo. Não se assume que todos os gatilhos sugeridos foram aprovados.
- **Pendente de definição:** alcance das operações relacionadas e gatilhos concretos; [PD-N07](#pd-n07).
- **Requisito relacionado:** [RNF-004](requisitos.md#rnf-004).

### RN-019

**Quantidades não negativas.**

- **Origem:** Guia §8.2, item de consistência.
- **Classificação:** Exigência acadêmica. **Situação da definição:** exigência documentada.
- **Regra e critério:** quantidades de estoque nunca ficam negativas.
- **Pendente de definição:** como tratar uma operação que produziria saldo negativo, incluindo a resposta ao usuário; [PD-N07](#pd-n07). A restrição não define reservas, atendimento parcial ou reposição automática.
- **Requisito relacionado:** [RNF-004](requisitos.md#rnf-004).

### RN-020

**Remoção ou desativação por entidade.**

- **Origem:** Guia §9.1, no contexto da exigência acadêmica de métodos HTTP; DELETE é descrito como “Remover (ou desativar) um registro”. O §5.5 sugere ativar/desativar acesso de funcionários.
- **Classificação:** Pendência quanto à regra por entidade; a disponibilidade do método HTTP é Exigência acadêmica em [RNF-003](requisitos.md#rnf-003).
- **Situação da definição:** Pendente de definição.
- **Critério de aceitação:** não fechado para remoção/desativação. É necessário decidir o comportamento por recurso, sem presumir exclusão física, lógica ou tratamento de vínculos e históricos.
- **Decisão necessária:** [PD-N09](#pd-n09).

<a id="pendencias"></a>
## Decisões de negócio em aberto

Todos os registros têm classificação **Pendência** e situação **Pendente de definição**. Não são funcionalidades novas: registram lacunas ou dúvidas das fontes que impedem fechar regras e critérios. A ausência de uma política não autoriza implementá-la por inferência.

| ID | Decisão necessária | Origem e regras relacionadas |
|---|---|---|
| <a id="pd-n01"></a>PD-N01 | Aprovar perfis e acessos; definir Configuração e Financeiro; esclarecer ações autorizadas, resposta a acesso negado e alcance do financeiro somente para consulta. | Guia §§3, 4, 5.5, 9.3 e 17; RN-001, RN-002, RN-003 e RN-007. “Todas as telas” do administrador é sugestão em tensão com acessos explicitamente pendentes. |
| <a id="pd-n02"></a>PD-N02 | Escolher usuário ou e-mail para login, aprovar o fluxo de autenticação, definir a política de alteração de senha e efeitos da desativação de acesso. | Guia §§5.1, 5.5 e 5.9; RN-004. Mecanismo técnico de armazenamento de senha em [PD-R04](requisitos.md#pd-r04). |
| <a id="pd-n03"></a>PD-N03 | Aprovar campos, obrigatoriedade, formatos, dados editáveis e relacionamentos. Reconciliar detalhes da OS entre §§5.4 e 10 e esclarecer o vínculo de compras ao cliente, ausente no modelo sugerido de venda. | Guia §5 (validação exigida, detalhes sugeridos), §§5.3–5.4, 5.9, 10 e 17; RN-006 e RN-010. Listar um campo não o torna obrigatório. |
| <a id="pd-n04"></a>PD-N04 | Aprovar estados e transições da OS; definir tratamento do cancelamento após início do serviço, tipos de serviço e prazos padrão, se adotados. | Guia §§6.1 e 17; RN-010. O guia define apenas significados sugeridos, não transições ou duração. |
| <a id="pd-n05"></a>PD-N05 | Definir formas de pagamento aceitas e esclarecer situações em que retirada e pagamento não coincidam. | Guia §§5.4, 5.6, 6.1–6.2 e 17; RN-009 a RN-011. Não há política documentada de parcelamento ou pagamento parcial. |
| <a id="pd-n06"></a>PD-N06 | Aprovar critérios de faturamento e períodos, apuração de materiais, fórmula de lucro, custos incluídos e regra/parâmetro do imposto. | Guia §§5.11, 6.1, 6.3 e 17; RN-012 e RN-014 a RN-017. Definições atuais são sugestões; lucro e imposto são pendências explícitas. |
| <a id="pd-n07"></a>PD-N07 | Definir gatilhos e momentos de baixa, operações que devem acontecer juntas e tratamento de correções, cancelamentos e tentativa de saldo negativo. | Guia §§5.6–5.8 e 6: **Sugestões**; §8.2: **Exigência acadêmica** de consistência; RN-011, RN-012, RN-018 e RN-019. Preservar ambas as classificações. |
| <a id="pd-n08"></a>PD-N08 | Aprovar alertas e definir mínimos de materiais, critério de estoque baixo de produtos e proximidade de prazo de OS. | Guia §§1.2, 5.2, 5.7 e 5.8; RN-013. O critério “abaixo do mínimo” é sugerido para materiais, sem valores definidos. |
| <a id="pd-n09"></a>PD-N09 | Definir remoção ou desativação por entidade e o tratamento dos vínculos e históricos nessas operações. | Guia §§5.5 e 9.1; RN-020. As alternativas não estão resolvidas por recurso. |
| <a id="pd-n10"></a>PD-N10 | Confirmar a classificação da frase sobre visibilidade de Funcionários no menu. | Guia §11.3; RN-005. Preservar a ambiguidade da marcação posterior ao esboço, sem enfraquecer a restrição de acesso de RN-001. |

Pendências de tecnologias, nuvem, identidade visual, colaboração e entregas acadêmicas estão no [catálogo de requisitos](requisitos.md#pendencias), para evitar duplicação.
