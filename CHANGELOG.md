# Histórico de mudanças

Este arquivo registra mudanças relevantes para quem usa ou mantém o projeto Seda e Couro. O planejamento e as funcionalidades previstas ficam no [Guia do Projeto](docs/guia-do-projeto.md).

Ainda não há uma versão publicada registrada neste histórico. As mudanças abaixo compõem a base inicial em desenvolvimento.

## Não lançado

### Corrigido

- Configuração TypeScript compartilhada entre editor e `typecheck` no back-end, incluindo os tipos de sessão sem gerar arquivos compilados.

### Adicionado

- Cadastros/edição/exclusão de Materiais e Produtos e exclusão de Clientes sem vínculos.
- Abertura, edição, sequência de estados, cancelamento, consumo e devolução de materiais de OS.
- Vendas com preço histórico, total calculado no PostgreSQL, baixa atômica e cancelamento com devoluções explícitas.
- Entradas, saídas e estornos com histórico, validação de quantidades/valores e proteção contra concorrência; alteração incremental em `operacoes.sql` aplicada ao Supabase sem inserir dados.

- Sete tabelas restantes de negócio aplicadas no Supabase, com obrigatoriedade confirmada, nove relacionamentos, estoque inicial zero e vínculo exclusivo nas movimentações.
- Consultas autenticadas de Materiais, Produtos, OS, Vendas, itens/usos vinculados e Movimentações; ampliadas pelas operações registradas acima.

- Funcionários e login por usuário/senha na aplicação Express, com sessões PostgreSQL, hash scrypt, controle de perfil, CSRF e limite de tentativas; tabelas aplicadas no Supabase.
- Comando local `npm run criar:admin` para a primeira conta, sem senha padrão, e `npm run typecheck`.
- Clientes agora exige login; alterações exigem token CSRF. Fluxo verificado com dados temporários revertidos.

- Certificado oficial do Supabase configurado por `DATABASE_CA_CERT`, sem pasta de certificados, com conexão TLS validada.

- Model, Controller e rotas locais de Clientes para cadastro, listagem, consulta e edição; Tabela aplicada no Supabase com obrigatoriedade confirmada; persistência verificada sem manter dados de teste.

- Servidor Express com `GET /api/v1/health`, porta configurável e comandos `npm run dev` e `npm start` no back-end.

- Base do front-end em React e TypeScript, com Vite e ESLint, ainda com a tela de exemplo.
- Guia do Projeto com escopo, requisitos e planejamento acadêmico.
- Documentação de apresentação e execução local no README, regras de contribuição no CONTRIBUTING e estrutura do histórico de mudanças.

<!--
Orientações de manutenção:
- Registre somente mudanças concluídas e relevantes, em linguagem clara.
- Use apenas as categorias necessárias: Adicionado, Alterado, Descontinuado,
  Removido, Corrigido e Segurança.
- Não transforme este arquivo em lista de tarefas ou cópia do histórico de commits.
- Ao publicar uma versão, crie uma seção "## [X.Y.Z] - AAAA-MM-DD" abaixo de
  "Não lançado", com o número e a data reais, e mova os itens correspondentes.
- Liste versões da mais recente para a mais antiga.
- Destaque mudanças incompatíveis e instruções de migração, quando existirem.
-->
