# Como contribuir

Este documento orienta a colaboração no projeto **Seda e Couro**, tanto para integrantes do UNIFEOB quanto para colaboradores externos. Você pode ajudar com código, documentação, relatos de problemas e sugestões de melhoria.

Leia o [README](README.md) para preparar o ambiente e o [Guia do Projeto](docs/guia-do-projeto.md) para conhecer o escopo. O guia distingue exigências acadêmicas, definições da equipe e sugestões; itens marcados como sugestão não são decisões definitivas.

## Convivência e organização

- Trate todas as pessoas com respeito. Discuta o código e as ideias, sem ataques pessoais.
- Explique decisões e dúvidas de maneira clara, considerando que este é um projeto de aprendizagem.
- Antes de começar, consulte as Issues e Pull Requests (PRs) para evitar trabalho duplicado. Registre na Issue que pretende trabalhar nela.
- Discuta mudanças de escopo, arquitetura ou dependências em uma Issue antes de implementá-las.
- Cada integrante deve usar sua própria conta e autoria nos commits, para manter o registro da participação acadêmica.
- Registre decisões que afetem o planejamento na documentação da equipe. Mantenha Sprint Reports e registros de reuniões atualizados conforme o guia.

## Relatar problemas e propor melhorias

Abra uma Issue com título objetivo e contexto suficiente para outra pessoa entender o pedido.

**Para um problema**, informe os passos para reproduzir, o resultado esperado, o resultado observado e o ambiente (navegador, sistema e versão do Node.js, quando relevantes). Inclua capturas de tela ou logs sem dados pessoais ou segredos.

**Para uma melhoria**, descreva a necessidade, quem será beneficiado e a relação com o escopo do projeto. As funcionalidades ainda não implementadas estão descritas no guia; confirme se já existe uma tarefa antes de abrir outra.

## Fluxo de trabalho

1. **Obtenha uma cópia:** integrantes com permissão podem clonar o repositório; colaboradores externos devem criar um fork e clonar o próprio fork.
2. **Parta da `main` atualizada:** no clone da equipe, use `git switch main` e `git pull --ff-only origin main`. Em um fork, sincronize primeiro sua `main` com a do repositório original.
3. **Crie uma branch para a tarefa:** use nomes descritivos, como `feature/tela-clientes`, `fix/validacao-cliente` ou `docs/instalacao`.
4. **Implemente uma mudança de escopo pequeno**, seguindo os padrões existentes e atualizando a documentação afetada.
5. **Valide a alteração**, registre os commits e envie a branch para seu repositório.
6. **Abra uma PR para a `main` do repositório original**, explique a mudança e aguarde a revisão de outro integrante antes da integração.

A `main` deve permanecer utilizável. Envie alterações por PR e responda às observações da revisão antes de integrá-las. A integração das contribuições externas fica a cargo da equipe responsável pelo projeto.

Exemplo de branch e commit, a partir da raiz do repositório:

```bash
# Isole a tarefa em uma branch própria.
git switch -c docs/instalacao

# Após editar, confira as diferenças e selecione o arquivo alterado.
git diff
git add README.md

# Descreva o resultado e publique a branch no seu origin.
git commit -m "docs: esclarece instalação do front-end"
git push -u origin docs/instalacao
```

## Padrões de código e commits

- Siga o estilo dos arquivos existentes e as regras do ESLint e do TypeScript.
- Prefira nomes claros, componentes reutilizáveis e funções com responsabilidades bem definidas.
- Nas telas novas, considere responsividade, rótulos nos formulários, validação e mensagens de erro compreensíveis.
- Evite incluir refatorações e mudanças de formatação sem relação com a tarefa.
- Ao alterar dependências, mantenha `package.json` e `package-lock.json` consistentes e explique a necessidade na PR.
- Não envie `node_modules/`, builds, senhas, tokens, credenciais nem dados reais de clientes e funcionários. Use dados fictícios nos exemplos e testes.
- Caso introduza arquivos `.env`, configure a exclusão no `.gitignore` e forneça um `.env.example` apenas com valores fictícios. A configuração atual ainda não ignora `.env` explicitamente.

Use mensagens curtas no formato `tipo: descrição`:

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Funcionalidade | `feat: adiciona formulário de clientes` |
| `fix` | Correção | `fix: corrige validação de telefone` |
| `docs` | Documentação | `docs: explica execução local` |
| `refactor` | Reorganização sem mudar o comportamento | `refactor: extrai campo reutilizável` |
| `test` | Testes | `test: cobre cálculo do total da venda` |
| `chore` | Manutenção e configuração | `chore: atualiza configuração do eslint` |

Esses exemplos ilustram o padrão e não representam funcionalidades já disponíveis.

## Validação e envio da PR

Para mudanças de código no front-end, execute dentro de `frontend/`:

```bash
# Verifique os padrões e possíveis problemas no código.
npm run lint

# Verifique os tipos e a geração do build.
npm run build
```

Teste também o comportamento alterado no navegador, incluindo situações de erro e diferentes tamanhos de tela, quando aplicável. Ainda não há script de testes automatizados no projeto; lint e build não substituem testes de comportamento. Para alterações apenas de documentação, confira comandos, links e coerência com o código.

Antes de solicitar revisão:

- [ ] A PR explica o problema, a solução e como verificar o resultado.
- [ ] A Issue relacionada está vinculada, quando houver.
- [ ] As verificações aplicáveis foram executadas e seus resultados foram informados.
- [ ] Mudanças visuais incluem capturas de tela com dados fictícios.
- [ ] A documentação foi atualizada quando necessário.
- [ ] O [CHANGELOG](CHANGELOG.md) registra a mudança, se ela for relevante para usuários ou mantenedores.
- [ ] Não há arquivos gerados, dados pessoais ou segredos no diff.

## Como atualizar o CHANGELOG

Inclua mudanças concluídas em **Não lançado**, na categoria correspondente. Descreva o efeito para quem usa ou mantém o projeto; não copie uma lista de commits nem registre tarefas futuras como entregas.

Ao publicar uma versão, a equipe deve mover os itens para uma seção com o número da versão e a data real de lançamento (`AAAA-MM-DD`), mantendo **Não lançado** no topo para as próximas alterações. O número `0.0.0` do `package.json` é o valor inicial do projeto e, por si só, não representa uma versão publicada.
