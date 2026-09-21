# Documentação — Seda e Couro

Esta pasta organiza a documentação do sistema de gestão interna da sapataria Seda e Couro, desenvolvido no Projeto Integrado do UNIFEOB. Contexto e objetivo: **definição da equipe**, conforme o Guia do Projeto, §§1.1–1.3.

## Documentos existentes

| Documento | Finalidade |
|---|---|
| [Guia do Projeto](guia-do-projeto.md) | Fonte do escopo, das exigências acadêmicas, das definições do rascunho, das sugestões e dos pontos em aberto. |
| [Requisitos](requisitos.md) | Catálogo identificado do que o sistema deve oferecer, das restrições técnicas e das entregas acadêmicas. |
| [Regras de negócio](regras-de-negocio.md) | Regras, permissões e relações entre OS, vendas, estoques e financeiro; mantém explícitas as decisões em aberto. |
| [Arquitetura](arquitetura.md) | Partes do sistema, responsabilidades e comunicação previstas, com distinção entre planejamento, implementação e decisões pendentes. |
| [README do projeto](../README.md) | Apresentação, tecnologias e execução disponíveis no estágio atual. |
| [Como contribuir](../CONTRIBUTING.md) | Orientações de convivência, Issues, branches, commits e revisão. |
| [Histórico de mudanças](../CHANGELOG.md) | Mudanças registradas e situação dos lançamentos. |

Os requisitos apontam para regras por identificador, evitando repetir permissões, estados e cálculos. As regras de colaboração permanecem no CONTRIBUTING e não são regras de negócio da sapataria.

<a id="como-interpretar-as-classificacoes"></a>
## Como interpretar as classificações

| Classificação | Significado e situação da definição |
|---|---|
| **Exigência acadêmica** | Conteúdo atribuído à Orientação PI pelo guia; obrigação acadêmica documentada, mesmo quando sua solução concreta está pendente. |
| **Definição da equipe** | Conteúdo definido no rascunho da equipe, segundo a legenda do guia. Não significa implementação concluída. |
| **Sugestão** | Proposta presente na fonte, ainda não aprovada por esta documentação. |
| **Pendência** | Pendente de definição: decisão, confirmação ou esclarecimento ainda necessário. Não substitui a classificação do requisito ao qual se refere. |

Origem da legenda: Guia, “Como usar este documento”. A autorização para organizar estes arquivos não aprova sugestões nem resolve pendências. Nenhuma nova decisão de comportamento foi fornecida para esta edição.

As marcações também se aplicam a seções inteiras:

- **§2:** exigências acadêmicas, respeitando sugestões locais, como as opções de ODS do §2.8.
- **§4:** telas definidas pela equipe; acessos sugeridos, exceto Funcionários, exclusivo do administrador; Configuração e Financeiro permanecem pendentes.
- **§5:** objetivos definidos pela equipe; detalhes de conteúdo e funcionalidades sugeridos, inclusive nas subtelas. A exigência geral de validação e uso da API é acadêmica.
- **§6 e §10:** fluxos e modelo de dados são sugestões; estados, campos e relacionamentos não se tornam decisões por aparecerem em tabelas.
- **Demais seções:** preservar marcações locais e a coluna de origem, quando houver. Divergências de classificação são registradas, sem escolher silenciosamente uma versão.

## Definição e implementação são situações diferentes

O [README do projeto](../README.md), no aviso inicial e em “Tecnologias”, informa que existe a base React/TypeScript/Vite/ESLint, mas ainda não existem as telas de negócio, a API e o banco implementados. O [CHANGELOG](../CHANGELOG.md), em “Não lançado”, registra essa base e não registra versão publicada.

Essas são evidências documentais do estágio atual, não uma auditoria de código feita por estes documentos. Uma exigência ou definição pode estar documentada e ainda não implementada. Uma sugestão continua proposta, mesmo que conste em um roteiro de desenvolvimento.

Nos catálogos:

- `RF`: requisito funcional; `RNF`: requisito não funcional ou restrição técnica; `RA`: entrega ou obrigação acadêmica.
- `RN`: regra de negócio ou permissão; o prefixo não determina sua aprovação.
- `PD-R`: pendência técnica, documental ou acadêmica; `PD-N`: pendência de domínio ou permissão.
- Critérios de aceitação de sugestões são **critérios propostos**, condicionados à aprovação. Critérios incompletos apontam a decisão necessária, sem preencher lacunas.

A versão **2.0 do guia** é documental. Ela não corresponde a um lançamento do sistema; o CONTRIBUTING, em “Como atualizar o CHANGELOG”, também esclarece que `0.0.0` no pacote não comprova publicação.

## Documentação planejada

Os assuntos abaixo são previstos no guia, mas seus documentos ainda não estão presentes nesta pasta. Por isso, não há links para arquivos inexistentes.

| Assunto | Origem e classificação |
|---|---|
| Sprint Reports e registros de reuniões | Guia §§2.5 e 13.4: **exigência acadêmica**. Modelos do §13.4 e organização em pastas do §7.3: **sugestão**. |
| Fluxos de integração | Guia §8.3: **exigência acadêmica**. Campos do registro e pasta sugerida: **sugestão**. |
| Comparação de custos e plano de implantação em nuvem | Guia §§12.3–12.4: **exigência acadêmica**. Serviços exemplificados e estrutura detalhada do plano: **sugestão**. |

## Revisões e decisões futuras

Pendências técnicas e acadêmicas estão em [requisitos](requisitos.md#pendencias); pendências operacionais e de acesso estão em [regras de negócio](regras-de-negocio.md#pendencias). As duas listas conservam a origem de cada dúvida.

Ao incorporar uma decisão explicitamente fornecida pela equipe, registrar seu conteúdo e sua origem junto ao identificador afetado, distinguindo a decisão nova da classificação original do guia. Esta é uma convenção editorial para rastreabilidade, sem alteração do comportamento do sistema.

Há divergência entre as práticas **sugeridas** no Guia §13.2 e a redação normativa do CONTRIBUTING. Ela está registrada em [PD-R01](requisitos.md#pd-r01); estes documentos não presumem sua aprovação nem alteram as fontes.
