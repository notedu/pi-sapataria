# Guia do Projeto — Desenvolvimento de Soluções Web Inteligentes e Integradas

> Sistema web de gestão interna para a sapataria Seda e Couro, em Santa Cruz das Palmeiras – SP, desenvolvido no módulo Desenvolvimento de Aplicação Web do UNIFEOB.

**Versão 2.0** · Setembro de 2026 · Rascunho da equipe alinhado à Orientação dos Projetos Integrados (2º semestre de 2026)

## Como usar este documento

Este guia junta duas fontes: o **rascunho inicial da equipe** (o que o sistema deve ter, tecnologias e design) e a **Orientação para os Projetos Integrados – 2º semestre de 2026**, do UNIFEOB (as regras que o projeto precisa cumprir). Onde as duas se encontram, o guia mostra como o sistema vai atender à exigência da faculdade.

As marcações indicam a origem de cada informação:

- **[Orientação PI]**: exigência da faculdade. Precisa ser cumprida.
- **[Sugestão]**: proposta para a equipe validar, ajustar ou descartar.
- Sem marcação: definido no rascunho da equipe.

## Sumário

1. Visão geral
2. Orientação do Projeto Integrado (PI)
3. Perfis de usuário
4. Mapa de telas
5. Detalhamento das telas
6. Fluxos principais
7. Tecnologias e arquitetura
8. Integração de dados
9. API RESTful
10. Modelo de dados inicial
11. Front-end e design
12. Computação em nuvem, hospedagem e domínio
13. Controle de versão e gestão do projeto
14. Requisitos não funcionais
15. Etapas de desenvolvimento
16. Checklist final de entrega
17. Pontos em aberto

---

## 1. Visão geral

### 1.1 Contexto

A Seda e Couro é uma sapataria localizada em Santa Cruz das Palmeiras – SP. O sistema nasce para atender às necessidades de organização operacional, gestão de vendas, estoque e controle financeiro da empresa.

O projeto é desenvolvido como Projeto Integrado do módulo **Desenvolvimento de Aplicação Web**, da Escola de Negócios e Tecnologia do UNIFEOB, com o título **Desenvolvimento de Soluções Web Inteligentes e Integradas**.

### 1.2 Objetivo

Criar um sistema web de gestão interna, com páginas que auxiliem os funcionários nas tarefas realizadas no dia a dia da sapataria.

**[Orientação PI]** No lado acadêmico, o objetivo do módulo é desenvolver uma aplicação web completa que consuma dados de um banco de dados por meio de uma API, com interface de usuário interativa e responsiva. A aplicação deve explorar boas práticas de desenvolvimento web e computação em nuvem, além de estratégias eficientes de integração de dados.

**[Sugestão]** Para reforçar a ideia de solução "inteligente" do título, o sistema pode gerar alertas automáticos (estoque baixo, OS perto do prazo) e indicadores financeiros calculados a partir dos dados registrados.

### 1.3 Áreas atendidas

| Área | O que o sistema deve resolver |
|---|---|
| Organização operacional | Cadastro de clientes e funcionários, registro e acompanhamento das ordens de serviço (OS) |
| Gestão de vendas | Registro de vendas ligadas a uma OS e de vendas independentes (produtos de pronta entrega) |
| Estoque | Controle dos materiais usados nos serviços e dos produtos para venda |
| Controle financeiro | Acompanhamento de faturamento, lucro, imposto e gastos com materiais |

### 1.4 Escopo

**Dentro do escopo:** as 11 telas descritas na seção 4 e os componentes exigidos pela faculdade: integração de dados, API RESTful, front-end em React, computação em nuvem e vídeo de Diálogo com a Academia.

**Fora do escopo inicial** **[Sugestão]**: emissão de nota fiscal, integração com meios de pagamento e aplicativo mobile nativo.

---

## 2. Orientação do Projeto Integrado (PI)

**[Orientação PI]** Esta seção resume as regras da faculdade. As demais seções do guia mostram como o projeto vai cumpri-las.

### 2.1 Dados do módulo

| Item | Definição |
|---|---|
| Instituição | UNIFEOB, Escola de Negócios e Tecnologia |
| Módulo | Desenvolvimento de Aplicação Web |
| Título do projeto | Desenvolvimento de Soluções Web Inteligentes e Integradas |
| Equipe | De 2 a 5 estudantes |
| Orientação | Um docente orientador acompanha todo o projeto. Dúvidas gerais vão para o e-mail institucional do docente ou para os encontros de sexta-feira. Dúvidas técnicas podem ser tiradas com os docentes de cada unidade. Problemas de força maior vão para a coordenação |
| Entrega | Somente em formato digital, pelo Classroom, nas datas do Calendário Acadêmico |

### 2.2 Equipe e gestão

Cada equipe define a própria estrutura interna, usando algum método de gestão de tarefas e distribuindo as responsabilidades de forma equilibrada. Cada equipe deve:

- Definir um líder ou facilitador do grupo.
- Atribuir papéis e responsabilidades.
- Criar um cronograma de entregas em ferramentas como Trello, Jira, Notion ou GitHub Projects.
- Definir datas de reuniões internas para acompanhar o progresso.
- Manter um repositório GitHub atualizado, com todo o código-fonte e a documentação.

O não cumprimento do cronograma interno pode impactar a avaliação final da equipe.

### 2.3 Caráter extensionista e beneficiário

O PI tem caráter extensionista (Resolução nº 7, de 18 de dezembro de 2018): leva benefícios da pesquisa e da realização do projeto para quem está fora do UNIFEOB.

- O beneficiado pode ser pessoa física ou qualquer entidade jurídica formalmente constituída, com status **ATIVA** no CNPJ.
- Cabe ao estudante definir o beneficiário e fazer o contato, esclarecendo todas as questões do trabalho.
- O projeto só pode ser elaborado com o consentimento da parte beneficiada, com **ciência e anuência por escrito**.

> **Ação para a equipe:** o beneficiário deste projeto é a Seda e Couro. É preciso obter a anuência por escrito da sapataria e confirmar a situação cadastral dela (CNPJ ativo, se for pessoa jurídica) antes de avançar.

### 2.4 Unidades de estudo e o que cada uma exige

| Unidade de estudo | O que a orientação exige | Onde neste guia |
|---|---|---|
| Integração de Dados | Camada de integração: coleta, tratamento, armazenamento e disponibilização dos dados. Integrar bancos de dados, APIs e outras fontes, com transformação e validação. Documentar os fluxos. Garantir qualidade, segurança e consistência. Disponibilizar os dados para a API e para as interfaces | Seção 8 |
| Tecnologias para Desenvolvimento Web | API RESTful e manipulação eficiente de dados, com HTTP (GET, POST, PUT, DELETE), design e versionamento de endpoints | Seção 9 |
| Desenvolvimento de Interfaces de Usuário para Web | Front-end em React, com componentes reutilizáveis, navegação entre funcionalidades, formulários com validação, layout responsivo e integração com a API | Seção 11 |
| Computação em Nuvem | Hospedar aplicação e banco em provedor de nuvem com suporte a Node.js. Plano A: AWS Academy. Manter a API em execução automática. Levantar custos (AWS, Azure e Google Cloud) e apresentar um plano de implantação | Seção 12 |
| Diálogo com a Academia | Vídeo de 3 a 5 minutos, baseado na apostila "Compreendendo a Linguagem como Atividade Humana", relacionando os conceitos ao projeto | Seção 2.7 |

### 2.5 Entregas e regras de entrega

| Entrega | Conteúdo |
|---|---|
| 1. Repositório GitHub | Código-fonte; documentação técnica (README.md com instruções de instalação e uso); histórico de commits que evidencie o trabalho colaborativo |
| 2. Relatório de Progresso (entregas parciais) | Sprint Reports documentando o progresso; registros das reuniões da equipe, com ajustes e desafios enfrentados |
| 3. Apresentação final | Demonstração funcional; explicação da estrutura técnica e das decisões de desenvolvimento; reflexão sobre o impacto do projeto e os desafios enfrentados |

> **Atenção:** trabalhos em formato impresso ou entregues fora do prazo não são aceitos em nenhuma hipótese. Projetos fora das especificações da orientação são desconsiderados e recebem **nota zero**. Projetos sem registro adequado no GitHub não são validados pelos professores orientadores.

### 2.6 Avaliação

O PI vale **4,0 pontos da nota P2** de cada unidade de estudo do módulo, distribuídos de forma igual entre as unidades.

| Quesito | Pontos | Como é avaliado |
|---|---|---|
| Validação dos professores | 1,5 | Cada docente valida a participação da sua unidade no projeto: 0,3 ponto por unidade (são 5 unidades) |
| Apresentação | 2,0 | Avaliação individual de oratória, postura, slides (ou outra forma de apresentação) e conteúdo. Quem não comparecer fica sem a nota de apresentação |
| Vídeo de Formação para a Vida | 0,5 | Vídeo sobre o tema da Formação para a Vida escolhido para o projeto (veja a seção 2.7) |
| **Total** | **4,0** | |

Em caso de não entrega ou invalidação do PI, os estudantes ficam sem esses 4,0 pontos em todas as unidades. Os professores orientadores avaliam cada quesito e devolvem a composição das notas aos estudantes.

### 2.7 Vídeos

| Vídeo | Regras |
|---|---|
| Formação para a Vida | De 3 a 5 minutos. Sobre o tema da Formação para a Vida escolhido para o projeto. Entregue pelo Classroom. Todos os integrantes participam e **aparecem** no vídeo, sob pena de perder a nota (0,5). Não são aceitos vídeos feitos por Inteligência Artificial nem podcast só com a voz dos estudantes. Avalia-se a participação e a coerência com o solicitado |
| Diálogo com a Academia | De 3 a 5 minutos. Baseado na apostila "Compreendendo a Linguagem como Atividade Humana", apresentando os principais conceitos e relacionando-os ao projeto. O link é enviado pelo Classroom, no prazo do calendário. Avaliado pelos professores orientadores e por uma banca, que escolhe o melhor vídeo da Escola; a equipe vencedora é premiada. A presença de todos os integrantes é obrigatória, sob pena de perder a nota |

> **Ponto de atenção:** a orientação descreve os dois vídeos em seções diferentes e não deixa claro se são o mesmo vídeo ou dois vídeos separados. Confirmar com o professor orientador (veja a seção 17).

### 2.8 Relatório de Extensão e ODS

Além do PI, **cada estudante** entrega pela Intranet o Relatório Final das Atividades de Extensão, preenchido em um formulário.

- O formulário pede: descrição da atividade; ODS; docente responsável; identificação do relatório; beneficiado pela atividade; contextualização; desafios; cronograma das ações; síntese das ações; aspectos positivos; dificuldades encontradas; resultados atingidos; sugestões e outras observações; componentes da equipe.
- O preenchimento é feito **no mesmo momento** da entrega do PI. Sem a aprovação do relatório, o PI é invalidado.
- A coordenação (ou o docente designado) aprova ou invalida o relatório. Se for invalidado, o estudante corrige e reenvia dentro do prazo do Calendário Acadêmico.
- O não cumprimento da atividade de extensão e a não entrega do relatório impedem a conclusão do curso.

O projeto deve atuar em um ou mais **Objetivos de Desenvolvimento Sustentável (ODS)** da ONU, ligados à Agenda 2030. A equipe escolhe o ODS que melhor se encaixa e o demonstra na apresentação e no relatório de extensão.

**[Sugestão]** ODS que combinam com o projeto:

| ODS | Por que pode se encaixar |
|---|---|
| 8. Trabalho decente e crescimento econômico | O sistema apoia a organização e a gestão de um pequeno negócio local |
| 9. Indústria, inovação e infraestrutura | Digitaliza os processos de uma empresa que hoje pode depender de controles manuais |
| 12. Consumo e produção responsáveis | A sapataria prolonga a vida útil dos calçados por meio de reparos, reduzindo o descarte |

**[Sugestão]** Anotar nos Sprint Reports as informações pedidas no formulário (desafios, cronograma, resultados) facilita o preenchimento do relatório no fim do projeto.

---

## 3. Perfis de usuário

**[Sugestão]** O rascunho define que o cadastro de funcionários é exclusivo do administrador. Isso indica a existência de pelo menos dois perfis de acesso:

| Perfil | Descrição | Acesso |
|---|---|---|
| Administrador | Responsável pela gestão do sistema | Todas as telas, incluindo Funcionários |
| Funcionário | Usa o sistema no dia a dia da loja | Telas operacionais (clientes, OS, vendas, estoques e perfil) |

> **Nota:** o acesso às telas de Configuração e Controle financeiro ainda precisa ser definido pela equipe (veja a seção 17).

---

## 4. Mapa de telas

Lista das telas que devem ser criadas. A coluna de acesso é uma **[Sugestão]**, exceto para Funcionários, que é definida no rascunho.

| # | Tela | Subtelas | Acesso |
|---|---|---|---|
| 1 | Login | — | Todos |
| 2 | Dashboard | — | Admin e funcionários |
| 3 | Cadastro de clientes | a) Página de clientes<br>b) Perfil do cliente | Admin e funcionários |
| 4 | Cadastro de OS | a) Página de OS<br>b) Detalhes da OS | Admin e funcionários |
| 5 | Cadastro de funcionários | a) Página de funcionários<br>b) Perfil de funcionário | Somente admin |
| 6 | Cadastro de vendas independentes | a) Página de histórico de vendas independentes | Admin e funcionários |
| 7 | Controle de estoque de materiais | — | Admin e funcionários |
| 8 | Controle de estoque de produtos para venda | — | Admin e funcionários |
| 9 | Perfil do usuário | — | Admin e funcionários |
| 10 | Configuração | — | A definir |
| 11 | Controle financeiro | a) Dashboard financeiro<br>b) Faturamento, Lucro, Imposto e Materiais | A definir |

---

## 5. Detalhamento das telas

Em cada tela, o **objetivo** vem do rascunho. Os itens listados em "O que a tela deve ter" são uma **[Sugestão]** de conteúdo e funcionalidades.

**[Orientação PI]** Todos os formulários do sistema devem ter validação (campos obrigatórios e formatos corretos), e todas as telas devem funcionar com dados vindos da API RESTful.

### 5.1 Login

**Objetivo:** identificar quem está usando o sistema.

O que a tela deve ter:

- Campos de usuário (ou e-mail) e senha.
- Mensagem clara de erro quando os dados estiverem incorretos.
- Redirecionamento para o Dashboard após o login.
- Proteção das demais telas: só abrem para usuários autenticados.

### 5.2 Dashboard

**Objetivo:** dar uma visão rápida da situação da sapataria.

O que a tela deve ter:

- Resumo do dia: OS abertas, OS prontas para retirada e vendas realizadas.
- Alertas de estoque baixo (materiais e produtos) e de OS com prazo próximo.
- Atalhos para as ações mais comuns: nova OS, novo cliente e nova venda.

### 5.3 Cadastro de clientes

**Objetivo:** manter os dados dos clientes organizados e acessíveis.

**a) Página de clientes**

- Lista de clientes com busca por nome ou telefone.
- Botão para cadastrar novo cliente.
- Acesso ao perfil de cada cliente.

**b) Perfil do cliente**

- Dados cadastrais: nome, telefone, e-mail e endereço.
- Histórico de OS e de compras do cliente.
- Campo de observações e opção de editar os dados.

### 5.4 Cadastro de OS

**Objetivo:** registrar e acompanhar os serviços realizados na sapataria.

**a) Página de OS**

- Lista de OS com filtros por status, cliente e data.
- Botão para criar nova OS.

**b) Detalhes da OS**

- Cliente e descrição do calçado.
- Serviço(s) a realizar e materiais utilizados.
- Valor, forma de pagamento, data de entrada e prazo de entrega.
- Status da OS (veja o ciclo de vida na seção 6.1) e observações.

### 5.5 Cadastro de funcionários (somente para o admin)

**Objetivo:** gerenciar quem tem acesso ao sistema.

**a) Página de funcionários**

- Lista de funcionários com busca.
- Indicação de funcionário ativo ou inativo.
- Botão para cadastrar novo funcionário.

**b) Perfil de funcionário**

- Dados pessoais e de contato.
- Perfil de acesso (administrador ou funcionário).
- Opção de ativar ou desativar o acesso.

### 5.6 Cadastro de vendas independentes

**Objetivo:** registrar vendas de produtos que não necessitam da criação de OS. Por exemplo: palmilhas, cadarços e calçados à pronta entrega no estoque da loja.

**a) Página de histórico de vendas independentes**

- Lista de vendas com data, itens, valor total, forma de pagamento e vendedor.
- Filtro por período.
- Botão para registrar nova venda: escolha dos produtos do estoque, quantidades e forma de pagamento.
- Baixa automática dos itens vendidos no estoque de produtos.

### 5.7 Controle de estoque de materiais

**Objetivo:** controlar os materiais consumidos na realização dos serviços.

O que a tela deve ter:

- Lista de materiais com nome, categoria, unidade, quantidade atual, quantidade mínima e custo.
- Registro de entradas (compras) e saídas (uso em serviços).
- Alerta quando a quantidade estiver abaixo do mínimo.
- O custo dos materiais alimenta o Controle financeiro.

### 5.8 Controle de estoque de produtos para venda

**Objetivo:** controlar os produtos disponíveis para venda na loja.

O que a tela deve ter:

- Lista de produtos com nome, categoria (palmilhas, cadarços, calçados etc.), quantidade, preço de custo e preço de venda.
- Registro de entradas (reposição de estoque).
- Saídas automáticas a cada venda independente.
- Alerta de estoque baixo.

### 5.9 Perfil do usuário

**Objetivo:** permitir que cada pessoa gerencie os próprios dados.

O que a tela deve ter:

- Dados do usuário que está logado.
- Alteração de senha.

### 5.10 Configuração

**Objetivo:** ajustar o funcionamento geral do sistema.

O que a tela deve ter:

- Dados da empresa.
- Cadastros auxiliares: tipos de serviço, formas de pagamento e categorias de produtos e materiais.
- Parâmetros financeiros, como a alíquota de imposto usada nos cálculos.

### 5.11 Controle financeiro

**Objetivo:** acompanhar a saúde financeira da sapataria.

**a) Dashboard financeiro**

- Totais do período (mês ou ano) e gráficos de evolução.

**b) Faturamento, Lucro, Imposto e Materiais**

- Detalhamento de cada indicador, com filtro por período.

Definição sugerida para os indicadores **[Sugestão]**:

| Indicador | Significado |
|---|---|
| Faturamento | Total recebido com OS entregues e vendas independentes no período |
| Materiais | Gastos com materiais usados nos serviços |
| Imposto | Valor calculado sobre o faturamento, conforme parâmetro definido em Configuração |
| Lucro | Faturamento menos materiais, imposto e demais custos que a equipe definir |

---

## 6. Fluxos principais

**[Sugestão]** Fluxos que mostram como as telas se conectam.

### 6.1 Ciclo de vida da OS

| Status | Significado |
|---|---|
| Aberta | OS registrada e calçado recebido |
| Em andamento | Serviço em execução |
| Pronta | Serviço concluído, aguardando retirada |
| Entregue | Cliente retirou e pagou; o valor entra no faturamento |
| Cancelada | OS encerrada sem execução do serviço |

### 6.2 Venda independente

1. O funcionário abre a tela de nova venda.
2. Seleciona os produtos do estoque e as quantidades.
3. Informa a forma de pagamento.
4. O sistema registra a venda, dá baixa no estoque de produtos e soma o valor ao faturamento.

### 6.3 Como os módulos se conectam

- **OS entregue:** gera faturamento.
- **Materiais usados em uma OS:** saem do estoque de materiais e entram no custo de Materiais do financeiro.
- **Venda independente:** sai do estoque de produtos e gera faturamento.
- **Configuração:** define parâmetros (como a alíquota de imposto) usados pelo Controle financeiro.

---

## 7. Tecnologias e arquitetura

### 7.1 Tecnologias

| Tecnologia | Papel no projeto | Origem |
|---|---|---|
| React | Biblioteca para construir as telas com componentes reutilizáveis | Orientação PI e rascunho |
| Node.js | Ambiente do back-end, onde roda a API. O ambiente de nuvem precisa suportar Node.js | Orientação PI e rascunho |
| API RESTful | Camada que recebe os pedidos do front-end e acessa o banco, usando HTTP | Orientação PI |
| Computação em nuvem | Hospedagem da aplicação e do banco de dados (Plano A: AWS Academy) | Orientação PI e rascunho |
| Git / GitHub | Versionamento, organização do código e evidência do trabalho colaborativo | Orientação PI e rascunho |
| PostgreSQL | Banco de dados relacional (clientes, OS, vendas, estoques e financeiro) | Rascunho |
| TypeScript | JavaScript com tipagem, que reduz erros e facilita a manutenção | Rascunho |
| Vite | Ferramenta de build e servidor de desenvolvimento do front-end | Rascunho |
| Tailwind CSS | Estilização com classes utilitárias, aplicando a paleta da Seda e Couro | Rascunho |

> **Nota:** o rascunho atribui todas essas tecnologias ao guia disponibilizado para o projeto integrado. A Orientação do PI cita explicitamente React, Node.js, API RESTful, banco de dados e nuvem, mas não menciona TypeScript, Vite, Tailwind CSS nem PostgreSQL. Vale confirmar que esses quatro constam no guia técnico do módulo (veja a seção 17).

### 7.2 Arquitetura geral

**[Sugestão]** Como as partes conversam entre si:

```
Fontes de dados (formulários do sistema, APIs externas, planilhas)
        |
        v
Camada de integração de dados (coleta, tratamento, validação)
        |
        v
Banco PostgreSQL  <--- consultas SQL --->  API RESTful (Node.js)
                                                   ^
                                                   |  HTTP (JSON)
                                                   v
                                    Front-end React (Vite + Tailwind)
```

Na etapa final, front-end, API e banco são hospedados na nuvem (seção 12).

### 7.3 Estrutura do repositório

**[Sugestão]** A estrutura abaixo já reserva as pastas para as entregas exigidas pela faculdade:

```
seda-e-couro/
|-- frontend/              # aplicação React (Vite)
|   |-- src/
|   |   |-- pages/         # uma tela por arquivo/pasta
|   |   |-- components/    # sidebar, barra de busca, tabelas, formulários
|   |   |-- services/      # chamadas à API
|   |   |-- types/         # tipos TypeScript
|   |-- index.html
|-- backend/               # API em Node.js
|   |-- src/
|   |   |-- routes/        # rotas da API (versionadas, ex.: /api/v1)
|   |   |-- controllers/   # lógica de cada rota
|   |   |-- integration/   # coleta, transformação e validação de dados
|   |   |-- database/      # conexão e scripts do PostgreSQL
|-- docs/
|   |-- sprints/           # Sprint Reports
|   |-- reunioes/          # registros das reuniões da equipe
|   |-- integracao/        # documentação dos fluxos de integração
|   |-- nuvem/             # levantamento de custos e plano de implantação
|-- README.md              # documentação técnica: instalação e uso
```

---

## 8. Integração de dados

**[Orientação PI]** Unidade de Integração de Dados. A equipe desenvolve a camada que coleta, trata, armazena e disponibiliza os dados do projeto, para consumo pela API e pelas telas.

### 8.1 Fluxos de integração

**[Sugestão]** Fluxos previstos para o sistema:

| Fluxo | Origem | Tratamento e validação | Destino |
|---|---|---|---|
| Cadastros feitos nas telas | Formulários do React | Campos obrigatórios, formatos (telefone, e-mail), remoção de espaços e padronização de textos | PostgreSQL, via API |
| Endereço por CEP | API pública de CEP (por exemplo, ViaCEP) | Validação do CEP e tratamento de erro se a API estiver fora do ar | Endereço do cliente |
| Importação de dados existentes | Planilhas CSV da sapataria, se existirem | Colunas obrigatórias, duplicados e conversão de tipos | Clientes e estoques |
| Movimentações automáticas | Vendas e OS | Baixa de estoque e cálculo de totais | Estoques e financeiro |
| Indicadores financeiros | OS, vendas e materiais | Agregação e cálculo por período | Dashboard financeiro |

### 8.2 Qualidade, segurança e consistência

**[Orientação PI]** A camada de integração deve garantir:

- **Qualidade:** dados validados e padronizados na entrada, com mensagem clara quando forem recusados.
- **Consistência:** operações ligadas acontecem juntas (uma venda e a baixa de estoque, por exemplo), com chaves estrangeiras no banco e quantidades que nunca ficam negativas.
- **Segurança:** senhas criptografadas, acesso por perfil, segredos fora do repositório e consultas parametrizadas para evitar SQL injection.

### 8.3 Documentação dos fluxos

**[Orientação PI]** Os fluxos de integração precisam ser documentados. **[Sugestão]** Para cada fluxo, registrar em `docs/integracao/`: origem, transformações aplicadas, validações, destino e o que acontece em caso de erro.

---

## 9. API RESTful

**[Orientação PI]** Unidade de Tecnologias para Desenvolvimento Web. A API é construída em Node.js, usa os métodos HTTP principais e tem endpoints bem desenhados e versionados.

### 9.1 Métodos HTTP

| Método | Uso | Exemplo |
|---|---|---|
| GET | Consultar dados | `GET /api/v1/clientes` |
| POST | Criar um registro | `POST /api/v1/clientes` |
| PUT | Atualizar um registro | `PUT /api/v1/clientes/12` |
| DELETE | Remover (ou desativar) um registro | `DELETE /api/v1/clientes/12` |

### 9.2 Versionamento

**[Sugestão]** Usar o prefixo `/api/v1` em todos os endpoints. Quando uma mudança quebrar a compatibilidade com o front-end, cria-se `/api/v2`, mantendo a versão anterior funcionando durante a transição.

### 9.3 Recursos previstos

**[Sugestão]**

| Recurso | Endpoint base | Tela relacionada |
|---|---|---|
| Autenticação | `/api/v1/auth` | Login |
| Dashboard | `/api/v1/dashboard` | Dashboard |
| Clientes | `/api/v1/clientes` | Cadastro de clientes |
| Ordens de serviço | `/api/v1/ordens-servico` | Cadastro de OS |
| Funcionários | `/api/v1/funcionarios` | Cadastro de funcionários |
| Vendas independentes | `/api/v1/vendas` | Vendas independentes |
| Materiais | `/api/v1/materiais` | Estoque de materiais |
| Produtos | `/api/v1/produtos` | Estoque de produtos |
| Financeiro | `/api/v1/financeiro` | Controle financeiro (somente consulta) |
| Configurações | `/api/v1/configuracoes` | Configuração |

### 9.4 Boas práticas

**[Sugestão]**

- Códigos HTTP corretos: 200 (sucesso), 201 (criado), 400 (dados inválidos), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado) e 500 (erro interno).
- Respostas em JSON, sempre no mesmo formato.
- Validação dos dados recebidos antes de gravar no banco.
- Paginação e filtros nas listas grandes.
- Rotas protegidas por autenticação e por perfil de acesso.
- Documentação dos endpoints no README ou em uma ferramenta como Swagger (OpenAPI).

---

## 10. Modelo de dados inicial

**[Sugestão]** Entidades principais que o banco PostgreSQL deve ter. Os campos podem ser ajustados durante o desenvolvimento.

| Entidade | Principais campos | Relaciona-se com |
|---|---|---|
| Funcionário (usuário) | nome, e-mail, senha (criptografada), perfil, ativo | Registra OS e vendas |
| Cliente | nome, telefone, e-mail, endereço, observações | Possui várias OS |
| OS | cliente, descrição do calçado, serviço, valor, data de entrada, prazo, status, responsável | Cliente, funcionário e materiais |
| Material usado na OS | OS, material, quantidade usada | OS e material |
| Material | nome, categoria, unidade, quantidade, mínimo, custo | Estoque de materiais |
| Produto | nome, categoria, quantidade, preço de custo, preço de venda | Estoque de produtos |
| Venda independente | data, forma de pagamento, total, vendedor | Funcionário |
| Item da venda | venda, produto, quantidade, preço unitário | Venda e produto |
| Movimentação de estoque | tipo (entrada ou saída), item, quantidade, data, motivo | Material ou produto |

---

## 11. Front-end e design

### 11.1 Requisitos do front-end

**[Orientação PI]** Unidade de Desenvolvimento de Interfaces de Usuário para Web. O front-end deve:

- Ser desenvolvido em **React**, estruturado em **componentes reutilizáveis**.
- Ter **navegação** entre as funcionalidades.
- Ter **formulários com validação**.
- Ter **layout responsivo**.
- Integrar com a **API RESTful** do projeto, permitindo ao usuário realizar todas as operações previstas.

### 11.2 Identidade visual

O design e as cores seguem a paleta de cores da empresa, baseando-se na identidade da **Seda e Couro**. O visual deve ser **simples e intuitivo**.

### 11.3 Layout e navegação

- **Barra lateral à esquerda** para a navegação entre as páginas.
- A **página atual aparece em destaque** na barra lateral, indicando onde o usuário está.
- **Barra de busca** para navegar mais rapidamente entre as páginas.

**[Sugestão]** Esboço da estrutura de tela:

```
+--------------+----------------------------------------------+
|  LOGO        |  [ Buscar página...                      ]   |
|              +----------------------------------------------+
|  Dashboard   |                                              |
|  Clientes    |                                              |
|> Ordens de   |          Conteúdo da página atual            |
|  serviço     |                                              |
|  Vendas      |                                              |
|  Estoques    |                                              |
|  Financeiro  |                                              |
|  ...         |                                              |
+--------------+----------------------------------------------+
   O símbolo ">" representa a página ativa em destaque.
```

A ordem dos itens na barra lateral pode seguir a lista de telas da seção 4. O item Funcionários só aparece para o administrador.

### 11.4 Componentes reutilizáveis

**[Sugestão]** Componentes que aparecem em várias telas e devem ser criados uma só vez:

- **Sidebar:** barra lateral com o item ativo em destaque.
- **SearchBar:** busca para navegar entre as páginas.
- **DataTable:** tabela com busca, filtros e paginação, usada nas listas.
- **FormField:** campo de formulário com rótulo, validação e mensagem de erro.
- **ConfirmModal:** janela de confirmação para ações como excluir.
- **StatusBadge:** etiqueta colorida para status (OS, estoque, funcionário).
- **IndicatorCard:** cartão de indicador para os dashboards.

### 11.5 Princípios de design

**[Sugestão]**

- **Simplicidade:** poucas informações por tela e ações principais sempre visíveis.
- **Consistência:** mesmo padrão visual para botões, tabelas e formulários em todas as telas.
- **Feedback claro:** mensagens de sucesso e de erro sempre que o usuário salvar ou excluir algo.
- **Legibilidade:** bom contraste entre texto e fundo.
- **Responsividade:** uso confortável em computador, tablet e celular (exigida pela orientação).

### 11.6 Paleta de cores

A paleta será extraída da identidade visual da Seda e Couro. Sugere-se cadastrar as cores como variáveis do tema do Tailwind CSS, para manter a consistência em todo o sistema.

| Elemento | Onde é usado | Cor |
|---|---|---|
| Primária | Barra lateral e botões principais | A definir |
| Secundária | Elementos de apoio e detalhes | A definir |
| Destaque | Página ativa na barra lateral e alertas de atenção | A definir |
| Fundo | Fundo das páginas e dos cartões | A definir |
| Texto | Títulos e textos em geral | A definir |

---

## 12. Computação em nuvem, hospedagem e domínio

**[Orientação PI]** Unidade de Computação em Nuvem. A nuvem garante escalabilidade, segurança e redução de custos: a aplicação e o banco de dados ficam em um provedor de nuvem, sem infraestrutura física e com acesso sob demanda.

### 12.1 Fases da hospedagem

| Fase | Ambiente | O que acontece |
|---|---|---|
| 1. Desenvolvimento e testes | Local | O desenvolvimento e os testes ocorrem em ambiente local de teste e produção |
| 2. Etapa final | AWS Academy (Plano A) | Migração de front-end, API Node.js e banco de dados para a nuvem |
| 3. Uso real (depois do projeto) | Domínio próprio e hospedagem paga | Só se a equipe da sapataria realmente utilizar o sistema |

**[Orientação PI]** Se a equipe preferir usar um ambiente de testes já em nuvem durante o desenvolvimento, ela deve ser capaz de preparar esse ambiente sozinha, incluindo a configuração do banco de dados e dos demais serviços.

> **Ajuste em relação ao rascunho:** o rascunho previa o GitHub Pages para a apresentação. Como o GitHub Pages hospeda apenas arquivos estáticos (HTML, CSS e JavaScript), ele não roda a API em Node.js nem o PostgreSQL, e a orientação exige a aplicação e o banco em nuvem. Por isso, a hospedagem oficial é a AWS Academy. O GitHub Pages pode continuar como demonstração complementar do front-end (seção 12.6), se a equipe quiser.

### 12.2 Requisitos da nuvem

**[Orientação PI]**

- Hospedar a aplicação e o banco de dados em um provedor de nuvem.
- O ambiente escolhido deve dar suporte à execução de aplicações Node.js, para que o back-end e o front-end rodem corretamente.
- Plano A: usar a nuvem da parceria acadêmica com a AWS (AWS Academy).
- Definir uma estratégia para manter a API em execução de forma automática, evitando que a aplicação fique indisponível.

**[Sugestão]** Para manter a API no ar, pode-se usar um gerenciador de processos do Node.js (como o PM2) ou um serviço do sistema operacional com reinício automático. Ambientes acadêmicos costumam ter sessões e créditos limitados, então vale conferir as regras do AWS Academy usado pela turma e testar o que acontece quando a sessão é encerrada e reiniciada.

### 12.3 Levantamento de custos

**[Orientação PI]** A equipe deve levantar os custos do projeto nas calculadoras de preços da **AWS**, da **Microsoft Azure** e do **Google Cloud**, comparando os modelos de precificação e se familiarizando com o nome dos serviços de cada provedor, mesmo que a hospedagem final seja só na AWS.

**[Sugestão]** Tabela de equivalência de serviços para começar a comparação (os valores mensais saem das calculadoras):

| Necessidade | AWS | Azure | Google Cloud |
|---|---|---|---|
| Servidor para a API Node.js | EC2 | Virtual Machines | Compute Engine |
| Banco PostgreSQL gerenciado | RDS for PostgreSQL | Azure Database for PostgreSQL | Cloud SQL for PostgreSQL |
| Arquivos estáticos do front-end | S3 | Blob Storage | Cloud Storage |
| Custo mensal estimado | A preencher | A preencher | A preencher |

### 12.4 Plano de implantação

**[Orientação PI]** A equipe deve apresentar um plano de implantação que detalhe a configuração dos serviços escolhidos, a gestão dos recursos em nuvem e a estratégia para manter a aplicação em execução contínua.

**[Sugestão]** Conteúdo do plano (em `docs/nuvem/`):

- Serviços escolhidos e a função de cada um.
- Configuração de rede e segurança (acessos liberados, variáveis de ambiente).
- Passo a passo para publicar front-end, API e banco.
- Estratégia de execução contínua da API (seção 12.2).
- Gestão dos recursos: o que ligar, desligar e monitorar para controlar custos.
- Backup e recuperação do banco de dados.

### 12.5 Domínio e hospedagem paga

Se o projeto for realmente utilizado pela equipe da sapataria, a equipe buscará um domínio e uma hospedagem paga. Isso fica para depois da entrega do PI.

### 12.6 GitHub Pages (opcional)

**[Sugestão]** Para publicar o front-end (Vite) no GitHub Pages, é preciso informar o caminho base do repositório:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],            // habilita o suporte ao React
  base: '/nome-do-repositorio/', // caminho base usado pelo GitHub Pages
})
```

Como o GitHub Pages não lida com as rotas internas do React, uma opção simples é usar o `HashRouter` (endereços do tipo `/#/clientes`). Nessa demonstração, o front-end precisa apontar para a API hospedada na nuvem ou usar dados simulados.

---

## 13. Controle de versão e gestão do projeto

### 13.1 Git e GitHub

O código será versionado e organizado com **Git** e **GitHub**.

**[Orientação PI]** O repositório deve ficar sempre atualizado, com todo o código-fonte e a documentação (README.md com instruções de instalação e uso). O histórico de commits precisa evidenciar o trabalho colaborativo, e projetos sem registro adequado no GitHub não são validados.

### 13.2 Boas práticas

**[Sugestão]**

| Prática | Como aplicar |
|---|---|
| Commits de todos | Cada integrante faz commits com a própria conta do GitHub, para o histórico mostrar o trabalho de cada um |
| Branch principal | `main` guarda sempre a versão estável do projeto |
| Branches de trabalho | Uma branch por funcionalidade, por exemplo `feature/tela-clientes` |
| Commits | Mensagens curtas e claras, como `feat: cria página de clientes` ou `fix: corrige busca` |
| Pull Requests | Toda alteração entra na `main` por Pull Request, revisada por um colega |
| Arquivos ignorados | `.gitignore` com `node_modules` e `.env` |
| Segredos | Senhas, chaves e dados de acesso ao banco nunca vão para o repositório |

### 13.3 Gestão da equipe

**[Orientação PI]** Itens que a equipe precisa definir logo no início:

| Item | O que definir | Definição da equipe |
|---|---|---|
| Líder ou facilitador | Quem coordena o grupo | A definir |
| Papéis e responsabilidades | Quem cuida de front-end, API, banco, integração, nuvem e documentação | A definir |
| Cronograma de entregas | Ferramenta (Trello, Jira, Notion ou GitHub Projects) e prazos | A definir |
| Reuniões internas | Datas e frequência | A definir |

**[Sugestão]** O GitHub Projects fica no mesmo lugar do código, o que facilita ligar tarefas, commits e Pull Requests. Todos os integrantes devem ter tarefas de desenvolvimento, para a distribuição ser equilibrada.

### 13.4 Sprint Reports e registros de reunião

**[Orientação PI]** Fazem parte do Relatório de Progresso: os Sprint Reports e os registros das reuniões da equipe, com ajustes e desafios enfrentados.

**[Sugestão]** Modelo simples para cada documento:

- **Sprint Report:** período, objetivos, tarefas concluídas, pendências, desafios e próximos passos.
- **Registro de reunião:** data, participantes, pauta, decisões, ajustes combinados e responsáveis.

---

## 14. Requisitos não funcionais

| Requisito | Descrição | Origem |
|---|---|---|
| Responsividade | Funcionamento em diferentes tamanhos de tela | Orientação PI |
| Disponibilidade | API em execução automática, sem ficar indisponível | Orientação PI |
| Qualidade dos dados | Validação e padronização na entrada e no tratamento | Orientação PI |
| Segurança | Senhas criptografadas, rotas protegidas por login e permissões por perfil de acesso | Orientação PI e sugestão |
| Usabilidade | Tarefas comuns realizadas com poucos cliques | Sugestão |
| Desempenho | Listas grandes com paginação e busca | Sugestão |
| Manutenção | Código em TypeScript, com componentes reutilizáveis | Sugestão |
| Backup | Cópia periódica dos dados do banco PostgreSQL | Sugestão |

---

## 15. Etapas de desenvolvimento

**[Sugestão]** As datas reais vêm do Calendário Acadêmico da Escola de Negócios e Tecnologia. Em todas as etapas, a equipe registra os Sprint Reports e as reuniões.

| Etapa | Entregas |
|---|---|
| 1. Planejamento e organização | Líder, papéis, cronograma e reuniões definidos; repositório no GitHub; beneficiário e anuência por escrito; ODS escolhido; protótipo das telas, paleta de cores e modelo de dados |
| 2. Base do projeto | Projeto local com Vite, React, TypeScript e Tailwind; API em Node.js conectada ao PostgreSQL; layout com barra lateral e busca; tela de Login com autenticação |
| 3. Integração de dados e API | Estrutura do banco, camada de integração, endpoints versionados com GET, POST, PUT e DELETE, documentação dos fluxos |
| 4. Cadastros | Clientes, funcionários, perfil do usuário e configuração (telas e API) |
| 5. Operação | Cadastro de OS e vendas independentes |
| 6. Estoques | Controle de estoque de materiais e de produtos para venda |
| 7. Financeiro | Dashboard, Dashboard financeiro e páginas de Faturamento, Lucro, Imposto e Materiais |
| 8. Nuvem | Migração para a AWS Academy, execução automática da API, levantamento de custos e plano de implantação |
| 9. Finalização | README completo, testes, vídeos, relatório de extensão de cada estudante, ensaio da apresentação e entrega no Classroom |

---

## 16. Checklist final de entrega

| Item | Onde | Observação |
|---|---|---|
| Repositório GitHub | GitHub, com entrega pelo Classroom | Código, README.md com instalação e uso, histórico de commits de todos |
| Relatório de Progresso | Classroom | Sprint Reports e registros das reuniões |
| Apresentação final | No dia definido pelo calendário | Demonstração funcional, estrutura técnica, impacto e desafios. Nota individual: todos presentes |
| Vídeo de Formação para a Vida | Classroom | De 3 a 5 minutos, todos aparecem, sem IA nem podcast |
| Vídeo de Diálogo com a Academia | Classroom (link) | De 3 a 5 minutos, apostila relacionada ao projeto, todos aparecem |
| Levantamento de custos e plano de implantação | Apresentação e `docs/nuvem/` | Calculadoras da AWS, Azure e Google Cloud |
| Anuência do beneficiário | Guardar o comprovante por escrito | Obtida antes de desenvolver o projeto |
| Relatório de Extensão | Intranet, um por estudante | Preenchido junto com a entrega do PI. Sem aprovação, o PI é invalidado |

---

## 17. Pontos em aberto

Itens que a equipe ainda precisa definir ou confirmar:

- Paleta de cores oficial da Seda e Couro (códigos das cores).
- Anuência por escrito da sapataria e situação cadastral dela (CNPJ ativo, se for pessoa jurídica).
- ODS escolhido para o projeto.
- Tema da Formação para a Vida escolhido para o projeto.
- Datas de entrega, apresentação e vídeos no Calendário Acadêmico.
- Se o vídeo de Formação para a Vida e o de Diálogo com a Academia são o mesmo vídeo ou dois.
- Como anexar o repositório e os demais itens no Classroom (confirmar com o professor orientador).
- Se TypeScript, Vite, Tailwind CSS e PostgreSQL constam no guia técnico do módulo.
- Líder, papéis, ferramenta de cronograma e datas das reuniões internas.
- Estratégia de execução contínua da API no AWS Academy.
- Quais perfis podem acessar Configuração e Controle financeiro.
- Campos exatos da OS (por exemplo: tipos de serviço e prazos padrão).
- Fórmula do lucro e regra de cálculo do imposto.
- Formas de pagamento aceitas pela loja.
- Nome do domínio, caso o projeto siga para o uso real.
