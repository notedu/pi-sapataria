# Instruções para trabalhar no projeto Seda e Couro

## Comunicação

- Responda em português brasileiro.
- Explique as alterações com linguagem clara.
- Como este é um projeto acadêmico, explique a função das partes importantes do código e os motivos das escolhas.

## Documentação de referência

Antes de implementar uma funcionalidade, consulte os documentos relacionados:

- `docs/README.md`: índice da documentação.
- `docs/guia-do-projeto.md`: contexto, escopo e orientações acadêmicas.
- `docs/requisitos.md`: comportamentos esperados do sistema.
- `docs/regras-de-negocio.md`: condições, restrições e permissões.
- `docs/arquitetura.md`: organização técnica e responsabilidades das partes.
- `CONTRIBUTING.md`: padrões de colaboração e validação.

Consulte as partes da documentação relevantes à tarefa; não é necessário reler todos os documentos em cada alteração.

Se algum arquivo estiver ausente, informe a ausência. Não invente seu conteúdo.

## Respeito às decisões

- Diferencie decisões aprovadas, sugestões e pendências.
- Não implemente sugestões como se já estivessem aprovadas.
- Não invente campos obrigatórios, permissões, fórmulas financeiras ou condições de movimentação de estoque.
- Peça esclarecimento quando a dúvida afetar comportamento de negócio, escopo ou uma decisão arquitetural importante, antes de implementar a parte que depende dela.
- Continue as partes independentes quando isso for possível.
- Se houver conflito entre documentos, apresente a divergência em vez de escolher silenciosamente uma versão.
- Resolva detalhes comuns de programação seguindo a arquitetura e os padrões existentes.

## Implementação

- Mantenha as alterações relacionadas ao pedido.
- Reutilize componentes e funções existentes quando forem adequados.
- Respeite a separação de responsabilidades definida na arquitetura.
- Validações na interface não substituem as verificações necessárias na API e no banco.
- Não acrescente bibliotecas ou serviços sem necessidade. Explique a justificativa quando uma nova dependência for necessária.
- Não modifique uma regra documentada apenas para acomodar o código produzido.

## Banco de dados

- Confira os requisitos e as regras antes de definir campos, relacionamentos e restrições.
- Registre alterações de estrutura em scripts versionados, conforme o padrão adotado no projeto.
- Use dados fictícios em exemplos e testes.
- Não apague dados nem execute alterações destrutivas em bancos existentes sem autorização explícita.
- Informe quando uma alteração foi apenas preparada e ainda não foi aplicada ao banco.

## Verificação

- Execute as verificações disponíveis e pertinentes à alteração.
- Para mudanças no front-end, consulte os comandos atuais no README e no package.json.
- Verifique o comportamento esperado, incluindo situações de erro relevantes.
- Para regras de negócio, use cenários derivados das definições aprovadas.
- Não afirme que algo foi testado quando a verificação não foi executada.
- Informe limitações do ambiente que tenham impedido a validação.

## Entrega

Ao concluir, apresente:

- O que foi implementado.
- Quais requisitos e regras foram atendidos, usando os identificadores existentes.
- Como o resultado foi verificado.
- Quais pendências ou limitações permanecem.

Atualize a documentação afetada quando necessário, preservando a distinção entre comportamento planejado e implementado.
