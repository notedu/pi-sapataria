# Instruções para trabalhar no projeto Seda e Couro

## Comunicação

- Responda em português brasileiro.
- Explique as alterações com linguagem clara.
- Como este é um projeto acadêmico, explique a função das partes importantes do código e os motivos das escolhas.

## Documentação de referência

Use `docs/README.md` como índice e consulte somente as partes relacionadas à tarefa:

- `docs/README.md`: índice da documentação.
- `docs/guia-do-projeto.md`: contexto, escopo e orientações acadêmicas.
- `docs/requisitos.md`: comportamentos esperados do sistema.
- `docs/regras-de-negocio.md`: condições, restrições e permissões.
- `docs/arquitetura.md`: organização técnica e responsabilidades das partes.
- `docs/modelo-de-dados.md`: entidades, campos, relacionamentos e restrições.
- `docs/api.md`: operações, dados enviados, respostas e erros da API.
- `docs/telas-e-fluxos.md`: telas, navegação e fluxos de uso.
- `docs/planejamento.md`: responsabilidades confirmadas, sequência de trabalho e marcos sugeridos.
- `CONTRIBUTING.md`: padrões de colaboração e validação.

Não é necessário reler toda a documentação em cada alteração nem concluí-la integralmente antes de começar a implementação.

Se algum arquivo estiver ausente, informe a ausência. Não invente seu conteúdo.

## Responsabilidades e planejamento

- **Integrante 1:** base compartilhada Node.js/Express, autenticação, clientes, gerenciamento de funcionários e landing page pública de apresentação.
- **João Contin:** design do sistema e funcionalidades de ordens de serviço (OS).
- **João Franco:** estoques de materiais e produtos para venda, movimentações e vendas independentes.
- Cada integrante implementa também as operações de API e alterações de banco do próprio módulo. A base preparada pelo Integrante 1 não o torna responsável por toda a API.
- São responsabilidades principais, não exclusividade de edição. Uma solicitação explícita da equipe pode envolver qualquer módulo; não atribua responsabilidades adicionais por inferência.
- Considere a meta de **20/10/2026** para priorizar entregas pequenas e integração antecipada. Os marcos do planejamento são propostas ajustáveis; o prazo não autoriza remover requisitos, enfraquecer segurança ou declarar testes não executados.
- Use **Materiais** para itens utilizados nos serviços, **Produtos para venda** para itens vendidos avulsos e **Administrador** para o perfil administrativo. Os nomes não alteram regras ou permissões.

## Decisões e coerência

- Diferencie aprovado, proposto, pendente e efetivamente implementado.
- Não implemente sugestões como se já estivessem aprovadas.
- Não invente campos obrigatórios, permissões, fórmulas financeiras ou condições de movimentação de estoque.
- Não reabra decisões aprovadas nem crie novas pautas extensas. Pautas e sugestões são material de apoio, não impedimento geral à implementação.
- Quando faltar uma decisão de negócio, escopo ou arquitetura importante, peça somente o esclarecimento necessário antes de implementar a parte dependente; continue as partes independentes.
- Pendências não relacionadas à tarefa não bloqueiam seu desenvolvimento.
- Explique conflitos relevantes entre documentos ou entre documentação e código antes de alterar o comportamento afetado; não escolha silenciosamente uma versão.
- Mantenha modelo de dados, contrato da API e telas alinhados. Quando a equipe confirmar uma decisão durante a implementação, registre-a objetivamente apenas nos documentos relacionados.
- Não modifique uma regra documentada apenas para acomodar o código produzido.

## Implementação por funcionalidade

- Trabalhe em etapas pequenas e verificáveis, conectando interface, API e banco conforme necessário para o comportamento da etapa.
- Resolva detalhes comuns de programação seguindo a arquitetura e os padrões existentes.
- Mantenha as alterações relacionadas ao pedido.
- Antes de editar, confira as alterações existentes e preserve o trabalho de outras pessoas.
- Reutilize componentes e funções existentes quando forem adequados.
- Respeite a separação de responsabilidades definida na arquitetura.
- Preserve contratos compartilhados de autenticação/permissões, requisições/respostas, modelo de dados/migrações e componentes/padrões visuais. Antes de alterá-los, examine seus usos e explique impactos relevantes. Não peça aprovação para ajustes rotineiros já autorizados; esclareça apenas mudanças de comportamento não confirmadas, conflitos importantes ou decisões em aberto.
- Na integração OS–estoque, João Contin e João Franco coordenam o acordo comum. Reutilize a lógica de movimentação, respeite os gatilhos de consumo aprovados e evite baixas duplicadas ou implementações divergentes.
- O design evolui por etapas. Quando necessário, avance com interface funcional simples, identificando escolhas visuais provisórias sem apresentá-las como identidade aprovada.
- Siga o CONTRIBUTING para colaboração, branches e revisão, sem criar um processo paralelo.
- Validações na interface não substituem as verificações necessárias na API e no banco.
- Não acrescente bibliotecas ou serviços sem necessidade. Explique a justificativa quando uma nova dependência for necessária.

## Banco de dados

- Confira os requisitos e as regras antes de definir campos, relacionamentos e restrições.
- Registre alterações de estrutura em scripts versionados, conforme o padrão adotado no projeto.
- Use dados fictícios em exemplos e testes.
- Não apague dados nem execute alterações destrutivas em bancos existentes sem autorização explícita.
- Informe quando uma alteração foi apenas preparada e ainda não foi aplicada ao banco.

## Verificação

- Execute verificações disponíveis e proporcionais à alteração, cobrindo os comportamentos relevantes.
- Para mudanças no front-end, consulte os comandos atuais no README e no package.json.
- Compilar e passar no lint não comprovam, sozinhos, o funcionamento das regras de negócio.
- Verifique o comportamento esperado, incluindo situações de erro relevantes.
- Para regras de negócio, use cenários derivados das definições aprovadas.
- Não afirme que algo foi testado quando a verificação não foi executada.
- Informe limitações do ambiente que tenham impedido a validação.

## Entrega

Ao concluir, apresente de forma breve, sem exigir relatórios extensos:

- O resultado e o que foi alterado ou implementado.
- Quais requisitos e regras foram atendidos, usando os identificadores existentes.
- Como o resultado foi verificado.
- Quais pendências ou limitações permanecem.

Atualize a documentação afetada quando necessário, preservando a distinção entre comportamento planejado e implementado.
