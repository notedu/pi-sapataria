# Requisitos — Seda e Couro

[Índice da documentação](README.md) · [Guia do Projeto](guia-do-projeto.md) · [Regras de negócio](regras-de-negocio.md)

## Leitura e situação atual

Este catálogo organiza as funcionalidades e restrições extraídas das fontes. A [legenda do índice](README.md#como-interpretar-as-classificacoes) explica a classificação e sua relação com a situação da definição. **Sugestão significa proposta não aprovada**; uma pendência não elimina uma exigência já documentada.

“Guia §…” indica a seção de origem no Guia do Projeto. Os critérios são somente desdobramentos do conteúdo indicado, sem acrescentar campos, permissões ou parâmetros. Nas tabelas de sugestões, todos os critérios são propostos. A aprovação da documentação não os aprova como comportamento.

**Situação da implementação:** todos os RF abaixo estão **não implementados conforme o aviso inicial do README da raiz**. Nos RNF, a situação é indicada por registro. Para os RA, o cumprimento é não informado, salvo evidência documental indicada. Fonte adicional: CHANGELOG, “Não lançado”. Não foi realizada auditoria de implementação para este catálogo.

## Escopo

- **Definição da equipe — Guia §§1.1–1.4 e 4:** gestão interna da Seda e Couro, com as onze telas e suas subtelas representadas em RF-001 a RF-011.
- **Sugestão — Guia §1.4:** deixar emissão de nota fiscal, integração com meios de pagamento e aplicativo mobile nativo fora do escopo inicial. A exclusão não está aprovada; ver [PD-R02](#pd-r02).
- Exigências acadêmicas de interface, API, integração e nuvem estão identificadas abaixo. O roteiro de etapas do Guia §15 é **sugestão**, sem comprovar conclusão ou fixar datas.

## Requisitos funcionais definidos no rascunho

Todos os registros desta tabela têm classificação **Definição da equipe** e situação da definição **definido no rascunho**, no nível de objetivo e telas. Seus detalhes sugeridos ficam na tabela seguinte.

| ID | Requisito e critério de aceitação no nível documentado | Origem | Relações e limites |
|---|---|---|---|
| <a id="rf-001"></a>RF-001 | Login: identificar quem está usando o sistema. Critério: disponibilizar a identificação do usuário; mecanismo e fluxo definitivo pendentes. | Guia §§4 e 5.1 | RF-015; [PD-N02](regras-de-negocio.md#pd-n02). |
| <a id="rf-002"></a>RF-002 | Dashboard: oferecer visão rápida da situação da sapataria. Critério: disponibilizar essa tela; conteúdo definitivo pendente. | Guia §§4 e 5.2 | RF-016. |
| <a id="rf-003"></a>RF-003 | Clientes: manter dados organizados e acessíveis. Critério: disponibilizar cadastro, página de clientes e perfil do cliente. | Guia §§1.3, 4 e 5.3 | RF-017; campos não aprovados. |
| <a id="rf-004"></a>RF-004 | OS: registrar e acompanhar serviços. Critério: disponibilizar cadastro, página de OS e detalhes da OS. | Guia §§1.3, 4 e 5.4 | RF-018; estados em [RN-010](regras-de-negocio.md#rn-010). |
| <a id="rf-005"></a>RF-005 | Funcionários: gerenciar quem tem acesso. Critério: disponibilizar cadastro, página e perfil de funcionário, respeitando [RN-001](regras-de-negocio.md#rn-001). | Guia §§1.3, 4 e 5.5 | RF-019; não define permissões das demais áreas. |
| <a id="rf-006"></a>RF-006 | Vendas independentes: registrar vendas de produtos de pronta entrega. Critério: disponibilizar cadastro e histórico de vendas independentes, conforme [RN-008](regras-de-negocio.md#rn-008). | Guia §§1.3, 4 e 5.6 | RF-020. |
| <a id="rf-007"></a>RF-007 | Estoque de materiais: controlar materiais consumidos nos serviços. Critério: disponibilizar a tela de controle de materiais. | Guia §§1.3, 4 e 5.7 | RF-021; movimentações em RN-012. |
| <a id="rf-008"></a>RF-008 | Estoque de produtos: controlar produtos disponíveis para venda. Critério: disponibilizar a tela de controle desses produtos. | Guia §§1.3, 4 e 5.8 | RF-022; vendas em RN-011. |
| <a id="rf-009"></a>RF-009 | Perfil do usuário: permitir gerenciar os próprios dados. Critério: disponibilizar a tela de perfil com essa finalidade. | Guia §§4 e 5.9 | RF-023; campos editáveis pendentes. |
| <a id="rf-010"></a>RF-010 | Configuração: ajustar o funcionamento geral do sistema. Critério: disponibilizar a tela de configuração. | Guia §§4 e 5.10 | RF-024; acesso em [RN-003](regras-de-negocio.md#rn-003). |
| <a id="rf-011"></a>RF-011 | Financeiro: acompanhar a saúde financeira. Critério: disponibilizar Dashboard financeiro e páginas de Faturamento, Lucro, Imposto e Materiais. | Guia §§1.3, 4 e 5.11 | RF-025; cálculos em RN-014 a RN-017. |
| <a id="rf-012"></a>RF-012 | Navegação: barra lateral à esquerda, página atual em destaque e busca de páginas. Critério: esses elementos permitem localizar e navegar entre as páginas. | Guia §11.3, lista anterior ao esboço sugerido | Permissões são tratadas nas RN; ordem do menu e esboço não são decisões aprovadas. |

## Requisitos funcionais de origem acadêmica

Classificação de todos os registros: **Exigência acadêmica**. Situação da definição: exigência documentada, com detalhamento pendente onde indicado.

| ID | Requisito e critério de aceitação documentado | Origem | Pendências e relações |
|---|---|---|---|
| <a id="rf-013"></a>RF-013 | Validar todos os formulários quanto a campos obrigatórios e formatos corretos. Critério: executar essas validações; casos concretos dependem da definição de campos e formatos. | Guia, introdução do §5; §11.1 | [PD-N03](regras-de-negocio.md#pd-n03); não torna os campos sugeridos obrigatórios. |
| <a id="rf-014"></a>RF-014 | Integrar as telas à API e oferecer camada de coleta, tratamento, armazenamento e disponibilização dos dados. Critério: disponibilizar dados para API e interfaces, com transformação e validação. | Guia §§1.2, 2.4, 5 (introdução), 8 e 11.1 | RNF-003, RNF-004; fontes concretas sugeridas em RF-026 e RF-027. |

## Detalhamentos funcionais sugeridos

Classificação de todos os registros: **Sugestão**. Situação da definição: **proposto — não aprovado**. A marcação da introdução do Guia §5 também abrange listas de subtelas. Os critérios abaixo são propostos e não definem campos obrigatórios.

| ID | Conteúdo e critério de aceitação proposto | Origem | Relações e decisões em aberto |
|---|---|---|---|
| <a id="rf-015"></a>RF-015 | Login com usuário ou e-mail e senha, mensagem de erro para dados incorretos e redirecionamento ao Dashboard após login. Critério proposto: executar esse fluxo. | Guia §5.1 | RF-001; proteção das telas em [RN-004](regras-de-negocio.md#rn-004); PD-N02. |
| <a id="rf-016"></a>RF-016 | Dashboard com resumo diário de OS abertas, prontas para retirada e vendas; atalhos para nova OS, cliente e venda; alertas. Critério proposto: exibir esses conteúdos. | Guia §§1.2 e 5.2 | RF-002; condições de alerta em [RN-013](regras-de-negocio.md#rn-013). |
| <a id="rf-017"></a>RF-017 | Lista de clientes com busca por nome ou telefone, cadastro e acesso ao perfil; nome, telefone, e-mail, endereço, observações, edição e histórico de OS/compras. Critério proposto: disponibilizar esses dados e operações. | Guia §5.3 | RF-003; campos e relação com compras em PD-N03. |
| <a id="rf-018"></a>RF-018 | Lista de OS com filtros por status, cliente e data e criação de OS; detalhes de cliente, calçado, serviços, materiais, valor, pagamento, entrada, prazo, status e observações. Critério proposto: disponibilizar esses dados e operações. | Guia §5.4 | RF-004; campos em PD-N03; estados em RN-010; prazos e pagamentos em PD-N04 e PD-N05. |
| <a id="rf-019"></a>RF-019 | Lista e busca de funcionários; indicação de ativo/inativo; cadastro; perfil com dados pessoais, contato e perfil de acesso; ativação/desativação. Critério proposto: disponibilizar esses dados e operações. | Guia §5.5 | RF-005; perfis em RN-002; efeitos da desativação em PD-N02. |
| <a id="rf-020"></a>RF-020 | Histórico de vendas com data, itens, total, pagamento e vendedor; filtro por período; nova venda com produtos e quantidades. Critério proposto: disponibilizar consulta e registro com esses dados. | Guia §5.6 | RF-006; efeitos da venda em [RN-011](regras-de-negocio.md#rn-011), sem reproduzir aqui a regra. |
| <a id="rf-021"></a>RF-021 | Materiais com nome, categoria, unidade, quantidade atual, mínima e custo; entradas por compra e saídas por uso. Critério proposto: disponibilizar lista e registro de movimentações. | Guia §5.7 | RF-007; efeitos em RN-012, alertas em RN-013 e custos em RN-015. |
| <a id="rf-022"></a>RF-022 | Produtos com nome, categoria, quantidade, custo e preço de venda; entradas por reposição. Critério proposto: disponibilizar lista e registro de entradas. | Guia §5.8 | RF-008; saídas em RN-011; alertas em RN-013. |
| <a id="rf-023"></a>RF-023 | Perfil com dados do usuário conectado e alteração de senha. Critério proposto: disponibilizar ambas as operações. | Guia §5.9 | RF-009; campos e política de senha em PD-N02 e PD-N03. |
| <a id="rf-024"></a>RF-024 | Configuração com dados da empresa, tipos de serviço, formas de pagamento, categorias de produtos/materiais e parâmetros financeiros. Critério proposto: disponibilizar esses ajustes. | Guia §5.10 | RF-010; efeito no imposto em RN-016; não define valores ou opções aceitas. |
| <a id="rf-025"></a>RF-025 | Financeiro com totais do mês ou ano, gráficos de evolução e indicadores detalhados com filtro por período. Critério proposto: disponibilizar essas visualizações. | Guia §5.11 | RF-011; definições dos indicadores em RN-014 a RN-017; PD-N06. |
| <a id="rf-026"></a>RF-026 | Obter endereço por API pública de CEP, validar CEP e tratar indisponibilidade da API. Critério proposto: realizar consulta e tratar falha; ViaCEP é exemplo, não escolha aprovada. | Guia §8.1 | RF-014; adoção e contrato em PD-R10. |
| <a id="rf-027"></a>RF-027 | Importar clientes e estoques de CSV, se houver planilhas, verificando colunas, duplicados e conversão de tipos. Critério proposto: executar os tratamentos; regras concretas não definidas. | Guia §8.1 | RF-014; PD-R10; não pressupõe existência de planilhas. |

## Requisitos não funcionais e restrições técnicas

A classificação determina a situação da definição conforme a legenda. Quando houver classificações divergentes, ambas estão indicadas. “Não demonstrado” significa que as fontes não comprovam atendimento; não equivale a afirmar uma falha encontrada em código.

| ID | Requisito e limite do critério de aceitação | Origem e classificação | Situação da implementação |
|---|---|---|---|
| <a id="rnf-001"></a>RNF-001 | Front-end em React, com componentes reutilizáveis. Critério: uso da biblioteca e organização reutilizável das funcionalidades. | Guia §§7.1 e 11.1: **Exigência acadêmica**; React também é **Definição da equipe** no §7.1. Divergência com §14 em PD-R03. | React configurado conforme README, “Tecnologias”; componentes das funcionalidades não implementados conforme aviso inicial. |
| <a id="rnf-002"></a>RNF-002 | Layout responsivo, funcionando em diferentes tamanhos de tela. Critério: funcionamento responsivo; não há dimensões ou lista obrigatória de dispositivos definida. | Guia §§11.1 e 14: **Exigência acadêmica**. | Não demonstrado para as telas de negócio, ainda não implementadas. |
| <a id="rnf-003"></a>RNF-003 | API RESTful em Node.js com GET, POST, PUT e DELETE e endpoints versionados. Critério: atender aos métodos e ao versionamento documentados. | Guia §§2.4, 7.1 e 9–9.1: **Exigência acadêmica**; Node.js também é **Definição da equipe** no §7.1. | API não implementada conforme README. |
| <a id="rnf-004"></a>RNF-004 | Validar e padronizar dados, com mensagem clara na recusa; preservar consistência e chaves estrangeiras. Critérios de domínio em [RN-018](regras-de-negocio.md#rn-018) e [RN-019](regras-de-negocio.md#rn-019). | Guia §8.2: **Exigência acadêmica**. | Integração/API/banco não implementados conforme README. |
| <a id="rnf-005"></a>RNF-005 | Segurança: senhas “criptografadas”, acesso por perfil, segredos fora do repositório e consultas parametrizadas. Critério limitado ao texto da fonte; não escolhe mecanismo de senha nem matriz de permissões. | Guia §8.2: **Exigência acadêmica**; §14: origem mista de orientação e sugestão. Divergência em PD-R04. | Segurança da aplicação não demonstrada; API não implementada. A orientação do CONTRIBUTING não comprova atendimento. |
| <a id="rnf-006"></a>RNF-006 | TypeScript, Vite, Tailwind CSS e PostgreSQL como tecnologias do projeto. Critério: utilização das tecnologias escolhidas no rascunho, sem alegar que todas sejam exigência da faculdade. | Guia §7.1: **Definição da equipe**. TypeScript como sugestão no §14: divergência em PD-R03; enquadramento acadêmico em PD-R05. | TypeScript e Vite configurados; Tailwind e PostgreSQL previstos, conforme README, “Tecnologias”. |
| <a id="rnf-007"></a>RNF-007 | Interface simples e intuitiva, baseada na identidade visual da Seda e Couro. Critério: aderência à identidade; códigos da paleta ainda pendentes. | Guia §§11.2 e 11.6: **Definição da equipe**; cores em §17: **Pendência**. | Não demonstrado nas telas de negócio. |
| <a id="rnf-008"></a>RNF-008 | Aplicação e banco na nuvem com suporte a Node.js e API em execução automática. Critério: hospedagem e execução automática; não estabelece SLA. | Guia §§2.4 e 12.2: **Exigência acadêmica**. AWS Academy é plano A; divergência de redação em PD-R06. | Hospedagem planejada conforme README; atendimento não demonstrado. |
| <a id="rnf-009"></a>RNF-009 | Prefixo `/api/v1`, transição para `/api/v2` mantendo a versão anterior durante a transição e recursos conforme tabela do guia. Critério **proposto**: adoção dessa convenção; não fixa duração da transição. | Guia §§9.2–9.3: **Sugestão**. | API não implementada. |
| <a id="rnf-010"></a>RNF-010 | JSON uniforme, códigos HTTP indicados no guia, paginação/filtros e documentação de endpoints. Critério **proposto**: seguir essas convenções, sem inventar formato de resposta ou tamanho de página. | Guia §9.4: **Sugestão**. Validação e segurança com exigências próprias em RNF-004/RNF-005. | API não implementada. |
| <a id="rnf-011"></a>RNF-011 | Arquitetura, organização de pastas, entidades/campos e componentes nomeados nos exemplos do guia. Critério **proposto**: adotar os desenhos após revisão; nenhum campo é obrigatório por constar no modelo. | Guia §§7.2–7.3, 10 e 11.4: **Sugestão**. | A base registrada no README não demonstra adoção integral desses modelos. |
| <a id="rnf-012"></a>RNF-012 | Consistência visual, feedback ao salvar/excluir, legibilidade e tarefas comuns com poucos cliques. Critério **proposto**: observar os princípios descritos; não há limite de cliques ou medida de contraste definida. | Guia §§11.5 e 14: **Sugestão**. Responsividade tem exigência própria em RNF-002. | Não demonstrado nas telas de negócio. |
| <a id="rnf-013"></a>RNF-013 | Paginação e busca em listas grandes. Critério **proposto**: disponibilizar esses recursos; não há definição de “grande”, tamanho de página ou tempo máximo de resposta. | Guia §14: **Sugestão**. | Não implementado nas funcionalidades de negócio conforme README. |
| <a id="rnf-014"></a>RNF-014 | Backup periódico do PostgreSQL. Critério **proposto**: realizar cópias periódicas; frequência, retenção e recuperação pendentes. | Guia §§12.4 (conteúdo sugerido) e 14: **Sugestão**. | Banco não implementado conforme README. |

As permissões de acesso estão nas RN-001 a RN-007; exclusão/desativação em RN-020. Os exemplos de endpoints do Guia §9.1 não aprovam o contrato sugerido do §9.3.

## Entregas e obrigações acadêmicas

Todos os RA têm classificação **Exigência acadêmica** e situação da definição **exigência documentada**. As opções sugeridas dentro das seções de origem não se tornam obrigatórias. Cumprimento não informado pelas fontes, exceto a documentação existente indicada em RA-003.

| ID | Obrigação e critério de verificação documental | Origem | Pendências ou limites |
|---|---|---|---|
| <a id="ra-001"></a>RA-001 | Equipe de 2 a 5 estudantes, liderança, responsabilidades, cronograma e reuniões definidos, com distribuição equilibrada do trabalho. | Guia §§2.1–2.2 e 13.3 | PD-R11; ferramenta específica não escolhida. |
| <a id="ra-002"></a>RA-002 | Beneficiário com ciência e anuência por escrito; CNPJ ativo, se pessoa jurídica. Critério: comprovação conforme guia. | Guia §2.3 | PD-R12; não há comprovação nas fontes consultadas. |
| <a id="ra-003"></a>RA-003 | Repositório atualizado, código-fonte, README de instalação/uso e histórico colaborativo; Sprint Reports e registros de reuniões. | Guia §§2.5, 13.1 e 13.4 | README, CONTRIBUTING e CHANGELOG existem; isso não comprova todas as entregas ou participação individual. Divergência de fluxo em PD-R01. |
| <a id="ra-004"></a>RA-004 | Documentar fluxos de integração. Critério: documentação dos fluxos; origem, transformação, validação, destino e erros são conteúdo sugerido, não formato obrigatório. | Guia §8.3 | A obrigação é acadêmica; modelo e pasta do mesmo §8.3 são **Sugestão**. |
| <a id="ra-005"></a>RA-005 | Comparar custos nas calculadoras AWS, Azure e Google Cloud e apresentar plano de implantação com configuração, gestão de recursos e execução contínua. | Guia §§12.3–12.4 | Serviços exemplificados são sugestões; PD-R06. |
| <a id="ra-006"></a>RA-006 | Entregas digitais no Classroom conforme calendário; apresentação com demonstração funcional, estrutura técnica, decisões e reflexão sobre impacto/desafios. | Guia §§2.1, 2.5–2.6 e 16 | PD-R13; critérios de avaliação completos permanecem no guia. |
| <a id="ra-007"></a>RA-007 | Vídeos de 3 a 5 minutos com participação de todos. Formação para a Vida exige que todos apareçam, sem vídeo feito por IA nem podcast só de voz; Diálogo com a Academia relaciona a apostila ao projeto e exige presença de todos. | Guia §2.7 | Pendente confirmar se são um ou dois vídeos e o tema de Formação para a Vida: PD-R14. |
| <a id="ra-008"></a>RA-008 | Cada estudante entrega relatório de extensão pela Intranet no momento da entrega do PI; aprovação necessária. Escolher um ou mais ODS e demonstrar a relação na apresentação e no relatório. | Guia §2.8 | PD-R15; ODS 8, 9 e 12 são **Sugestões**, não escolhas realizadas. |

<a id="pendencias"></a>
## Pendências e divergências técnicas, documentais e acadêmicas

Todos os registros abaixo têm classificação **Pendência** e situação **Pendente de definição**. As classificações dos trechos de origem são preservadas na descrição. As decisões de negócio ficam exclusivamente na [lista PD-N](regras-de-negocio.md#pendencias).

| ID | Decisão ou esclarecimento necessário | Origem e divergência |
|---|---|---|
| <a id="pd-r01"></a>PD-R01 | Confirmar a adoção das práticas de branches, commits e revisão por PR e reconciliar a redação dos documentos. | Guia §13.2: **Sugestão**; CONTRIBUTING, “Fluxo de trabalho” e “Padrões de código e commits”: redação normativa. Não há decisão explícita de aprovação nesta edição. |
| <a id="pd-r02"></a>PD-R02 | Confirmar as exclusões do escopo inicial. | Guia §1.4: **Sugestão** de excluir nota fiscal, integração de pagamentos e aplicativo nativo. |
| <a id="pd-r03"></a>PD-R03 | Reconciliar a classificação de manutenção. | Guia §14 agrupa TypeScript e componentes reutilizáveis como **Sugestão**; §7.1 trata TypeScript como **Definição da equipe** e §11.1 exige componentes reutilizáveis. RNF-001/RNF-006 mantêm as origens sem apagar a divergência. |
| <a id="pd-r04"></a>PD-R04 | Esclarecer o alcance das exigências de segurança e o mecanismo referido como “senhas criptografadas”. | Guia §8.2: **Exigência acadêmica**; §14: origem mista; §§5.1 e 9.4: proteção de telas/rotas sugerida. Políticas e permissões: PD-N01/PD-N02. |
| <a id="pd-r05"></a>PD-R05 | Confirmar se TypeScript, Vite, Tailwind e PostgreSQL constam no guia técnico do módulo. | Guia §§7.1 e 17. A escolha do rascunho não comprova exigência acadêmica. |
| <a id="pd-r06"></a>PD-R06 | Confirmar provedor, serviços e estratégia de execução automática. | Guia §§2.4 e 12.2: AWS Academy como plano A; nota do §12.1: “hospedagem oficial”; README, “Tecnologias”: plano A. PM2/serviço do sistema e serviços da tabela de custos são **Sugestões**. |
| <a id="pd-r07"></a>PD-R07 | Definir códigos da paleta da Seda e Couro. | Guia §§11.6 e 17; uso de variáveis do Tailwind é **Sugestão**. |
| <a id="pd-r08"></a>PD-R08 | Definir parâmetros de disponibilidade, desempenho, usabilidade e backup, caso sejam necessários para detalhar os critérios; aprovar os recursos sugeridos. | Guia §14 não fixa SLA, tempo de resposta, limite de cliques, tamanho de página, frequência ou retenção de backup. Não se presume que uma meta numérica seja exigência do guia. |
| <a id="pd-r09"></a>PD-R09 | Revisar e aprovar contratos da API, arquitetura, organização de pastas e modelo de dados sugeridos. | Guia §§7.2–7.3, 9.2–9.4, 10 e 11.4. Campos e relações de domínio: PD-N03. |
| <a id="pd-r10"></a>PD-R10 | Decidir adoção da consulta de CEP e da importação; confirmar existência de planilhas, provedor, colunas, formatos, tratamento de duplicados e falhas. | Guia §8.1: **Sugestão**; não há contrato detalhado. |
| <a id="pd-r11"></a>PD-R11 | Definir líder, papéis, ferramenta e cronograma, datas e frequência de reuniões. | Guia §§13.3 e 17; obrigação de organização acadêmica, escolhas ainda pendentes. |
| <a id="pd-r12"></a>PD-R12 | Confirmar anuência escrita e situação cadastral do beneficiário. | Guia §§2.3 e 17. Pendência de comprovação, sem afirmar ausência de consentimento fora das fontes. |
| <a id="pd-r13"></a>PD-R13 | Confirmar calendário e forma de anexar repositório e demais entregas no Classroom. | Guia §§2.1, 2.5 e 17. |
| <a id="pd-r14"></a>PD-R14 | Confirmar com o orientador se há um ou dois vídeos e definir o tema de Formação para a Vida. | Guia §§2.7 e 17 reconhecem a ambiguidade. |
| <a id="pd-r15"></a>PD-R15 | Escolher o(s) ODS do projeto. | Guia §§2.8 e 17; opções exemplificadas não foram aprovadas. |
| <a id="pd-r16"></a>PD-R16 | Definir domínio e hospedagem paga se houver uso real após o PI. | Guia §§12.5 e 17: **Definição da equipe condicional**, sem nome de domínio escolhido. GitHub Pages no §12.6 permanece demonstração complementar **sugerida**, não substituição da nuvem. |
