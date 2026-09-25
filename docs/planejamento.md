## Planejamento - Seda e Couro

Responsabilidades e implementação | Gerado em 25/09/2026 (America/Sao_Paulo).

## 1. Objetivo, decisões e ponto de partida

Meta confirmada pela equipe: concluir as funcionalidades previstas até 20/10/2026. Após essa data: revisão, correções e preparação da apresentação. Apresentações no começo de novembro de 2026, sem data exata informada. O cronograma abaixo é uma proposta ajustável, não uma garantia de entrega nem uma estimativa de disponibilidade diária.

Origem das decisões: solicitação da equipe nesta conversa, em 25/09/2026. A divisão abaixo, Node.js com Express, Stitch/Figma para design, o nome Administrador para o perfil do dono/gerente e a landing page pública estão confirmados. Isso não aprova políticas de senha, campos, permissões adicionais, fórmulas ou gatilhos de estoque.

Estágio conferido por leitura do código: React, TypeScript, Vite e ESLint já configurados em frontend/package.json; frontend/src/App.tsx ainda é a demonstração com contador. backend/.gitkeep apenas reserva a pasta. Não há API, autenticação, banco, telas de negócio ou implantação implementados no repositório consultado. Não foram executados testes da aplicação nesta tarefa.

A arquitetura ainda registra o framework HTTP como pendente e as fontes anteriores não incluem a landing page: este planejamento registra as novas decisões, sem alterar os demais documentos nesta tarefa. Atualizar os trechos relacionados junto à implementação, sem reabrir essas escolhas.

## 2. Responsabilidades confirmadas

| Integrante e módulos | Entregas verificáveis | Dependências |
| --- | --- | --- |
| 1 - autor da solicitação. Base Node.js/Express, autenticação, clientes, funcionários e landing page. | Base compartilhada executável; identificação de Administrador/funcionário; clientes cadastrados e consultados, demais operações previstas conforme regras; criação de conta, login, perfil de acesso e situação pelo Administrador; apresentação pública. | Campos/permissões e mecanismo de acesso; definição da senha inicial; padrões visuais por etapas. Não implementa sozinho toda a API. |
| 2 - João Contin. Design com Stitch/Figma, padrões e componentes de referência; OS. | Referência visual utilizável progressivamente; abertura e acompanhamento de OS conectados à API e banco; estados e consumo conforme regras adotadas. | Base compartilhada; clientes; estados/serviços da OS; acordo de consumo com João Franco. |
| 3 - João Franco. Cadastros e estoques; movimentações; vendas independentes. | Materiais e Produtos para venda cadastrados; entradas/saídas e vendas conectadas à interface, API e banco; saldos coerentes conforme regras adotadas. | Base compartilhada; unidades, pagamentos e momentos de baixa; integração com OS de João Contin. |

Materiais são itens utilizados nos serviços. Produtos para venda são itens vendidos avulsos, como palmilhas e cadarços. Padronizar os nomes não altera as regras de estoque. A landing page apenas apresenta o projeto: não é loja virtual, agendamento ou portal do cliente.


---

## 3. Marcos sugeridos até 20 de outubro

Referência inicial: 25/09/2026. Faixas são janelas de demonstração e podem se sobrepor; não estabelecem carga diária. Assuntos sem responsável não são atribuídos pela tabela. A equipe precisa definir sua cobertura para manter a meta do sistema completo.

| Janela proposta | Resultado demonstrável | Coordenação |
| --- | --- | --- |
| 25 a 29/09 | Base Express e acordo de contrato/banco; primeira referência visual; primeiro cadastro/listagem de cliente persistido, com proteção conforme decisões da etapa. Confirmar acesso ao ambiente de nuvem desde já. | Integrante 1 na base/clientes; João Contin na referência visual; todos alinham interfaces comuns. Responsável de nuvem a confirmar. |
| 30/09 a 05/10 | Desenvolvimento paralelo: autenticação/funcionários/clientes; OS; cadastros de materiais/produtos e entradas. Primeira conexão real OS-consulta de materiais. Primeiro teste em nuvem: interface → API → banco, com dados fictícios. | Cada integrante no módulo confirmado. Contin e Franco verificam a conexão. Implantação depende de responsável e ambiente confirmados. |
| 06 a 11/10 | Demonstrar consumo em OS e venda independente com efeitos de estoque acordados; verificar erros e persistência juntos. Evoluir design e landing page em paralelo. Revisar cobertura de Dashboard, financeiro, configurações e perfil. | Contin + Franco na integração; Integrante 1 mantém autenticação/base compatíveis e seus módulos. Módulos em aberto só entram com atribuição confirmada. |
| 12 a 16/10 | Teste conjunto dos fluxos; permissões, falhas e consistência. Nova implantação da versão integrada e correções. Demonstrar módulos restantes que já tenham regras e responsáveis confirmados. | Todos nos próprios fluxos; responsável de implantação ainda a designar. |
| 17 a 20/10 | Reserva para integração final, correções e conferência da cobertura. Demonstração do conjunto e registro objetivo do que está concluído ou ainda falta. | Equipe; não reservar a primeira integração ou hospedagem para essa janela. |
| Após 20/10 até a apresentação | Revisar, corrigir, preparar demonstração e materiais acadêmicos; confirmar data oficial de novembro. | Participação da equipe conforme exigências; coordenação das entregas ainda a definir. |

Risco de prazo: o código está na base inicial e há módulos sem responsável e regras de estoque/financeiro em aberto. Não há evidência para garantir que todo o escopo caiba no prazo. Se um marco não for demonstrado, revisar capacidade e cobertura com a equipe, sem excluir exigências silenciosamente nem deslocar toda a integração para depois de 20/10.


---

## 4. Primeira etapa e acordos de integração

Início imediato: Integrante 1 prepara a base compartilhada Node.js/Express, organização e dependências necessárias, configuração sem segredos no repositório e acesso ao PostgreSQL. Aproveitar o front-end já configurado; não recriá-lo. Primeiro resultado integrado proposto: cadastrar cliente fictício e reencontrá-lo após nova consulta ao banco.

Em paralelo, João Contin prepara padrões visuais e componentes de referência suficientes para Login/Clientes e inicia a estrutura da OS. João Franco prepara os cadastros de Materiais/Produtos para venda e o fluxo de entradas. Cada um desenvolve interface, API e alterações versionadas de banco do próprio módulo; não precisa esperar todas as telas desenhadas.

Resolver somente os bloqueios da próxima tarefa: campos, formatos e obrigatoriedade de Cliente (PD-N03); quem cadastra/lista, identificação e mecanismo de autenticação (PD-N01/PD-N02/PD-R04); contrato e acesso/evolução do banco (PD-R09). Definição ou entrega da senha inicial será resolvida durante autenticação, sem senha padrão, envio ou troca obrigatória presumidos. Partes independentes continuam.

| Integração | Quem coordena e acordo necessário |
| --- | --- |
| Base, autenticação e contratos | Integrante 1 prepara a base; todos coordenam mudanças nas partes que consomem. Combinar identificação, erros, nomes/tipos e alterações de banco antes de integrar. Todos podem modificar o back-end de seus módulos. |
| Design e componentes | João Contin conduz a referência visual; demais integrantes coordenam seu uso. Entregas por etapas, sem bloquear programação pela ausência de protótipo completo. |
| Cliente e responsável da OS | Integrante 1 + João Contin alinham IDs, consulta autorizada e autoria. A seleção de responsável não pode liberar o cadastro administrativo de funcionários por atalho. |
| Consumo em OS e estoque | João Contin + João Franco coordenam um único acordo: momento da baixa, unidade, vínculo à OS e tratamento de falhas/correções. Não podem existir duas baixas incompatíveis. Registrar uso e efeito aprovado juntos ou desfazê-los juntos (RN-018); impedir saldo negativo (RN-019). |
| Venda e estoque | João Franco integra seus módulos; combinar contratos comuns com a equipe. Pagamento, total e gatilho de baixa dependem de PD-N05/PD-N06/PD-N07. Não enviar segunda baixa após uma venda que já a efetuou. |
| Nuvem e entrega conjunta | Responsável de implantação a confirmar; todos fornecem instruções e configuração de seus módulos. Confirmar com professor recursos/limites da AWS Academy e testar antes da reta final. |

Colaboração: seguir CONTRIBUTING existente (Issues, branches, PR e revisão por outro integrante), sem criar outro processo. Atualizações breves dos documentos relacionados acompanham cada fluxo. Pautas e sugestões são apoio; não é necessário encerrar toda a documentação antes de programar.


---

## 5. Conclusão de funcionalidades e cobertura em aberto

Critérios comuns: fluxo principal funciona entre interface, API e banco; dados persistem e relações permanecem corretas; permissões aplicáveis são verificadas também na API; principais erros e estados de tela foram verificados; instruções e documentos relacionados refletem o resultado. Registrar limitações e diferenciar proposto de implementado. Compilar e passar no lint não substitui verificar comportamento. Usar dados fictícios e verificações proporcionais.

Responsabilidades ainda não atribuídas ou cobertas apenas em parte: os pontos abaixo permanecem para confirmação da equipe. Não bloqueiam as partes já distribuídas, mas a falta de cobertura ameaça a meta completa. Não se presume que o responsável pelos dados de origem implementará também todos os módulos que os consultam.

| Assunto previsto | Cobertura existente e lacuna |
| --- | --- |
| Dashboard (RF-002/RF-016) | Módulos fornecem dados de origem; responsável por painel, agregações e atalhos ainda não atribuído. Alertas continuam sujeitos às regras. |
| Financeiro (RF-011/RF-025) | OS/vendas/estoques fornecem parte dos dados; cálculo, consultas e telas sem responsável. Fórmulas, períodos e custos ainda precisam de decisão. |
| Configurações (RF-010/RF-024) | Serviços, pagamentos e categorias cruzam os módulos; falta confirmar responsável pela tela, API e parâmetros compartilhados. Não atribuir tudo a OS ou estoque por associação. |
| Perfil próprio (RF-009/RF-023) | Autenticação e conta administrativa são do Integrante 1; isso não confirma responsabilidade pela tela de autoedição e alteração de senha do próprio usuário. |
| Implantação e custos (RNF-008/RA-005) | Base do back-end não equivale a assumir nuvem. Falta responsável pelo ambiente, implantação, execução automática, comparação de custos e plano; backup conforme definição adotada. |
| Organização e entregas acadêmicas (RA-001 a RA-008) | Falta explicitar coordenação de liderança/reuniões, anuência, registros de progresso/integração, submissão, vídeos, ODS e apresentação. Participação nos vídeos e relatório de extensão individual já são obrigações; não estão dispensadas nem transferidas a uma pessoa. |

O começo de novembro é previsão de apresentação informada pela equipe, não substitui os prazos oficiais de Classroom/Intranet. Confirmar calendário e a questão de um ou dois vídeos com o professor. Não deixar obtenção de anuência ou obrigações com prazo anterior para depois de 20/10.

Rastreabilidade: responsabilidades e novas escolhas vieram da solicitação de 25/09/2026. Guia §§2, 5–8 e 12–13 fundamenta escopo, integrações e entregas. Requisitos RF-001 a RF-011, RNF-004/RNF-005/RNF-008 e RA-001 a RA-008; regras RN-001/RN-008/RN-018/RN-019 e pendências PD-N; arquitetura §§7/9/10/12; modelo de dados (etapas); API (operações e permissões); telas e fluxos (etapas e verificação). Estes documentos mantêm suas classificações; nenhuma proposta adicional é aprovada por este cronograma.

[Índice](README.md) · [Guia](guia-do-projeto.md) · [Requisitos](requisitos.md) · [Regras](regras-de-negocio.md) · [Arquitetura](arquitetura.md) · [Modelo de dados](modelo-de-dados.md) · [API](api.md) · [Telas e fluxos](telas-e-fluxos.md) · [Contribuição](../CONTRIBUTING.md) · [AGENTS](../AGENTS.md)
