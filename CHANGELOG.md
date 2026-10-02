# Histórico de mudanças

Este arquivo registra mudanças relevantes para quem usa ou mantém o projeto Seda e Couro. O planejamento e as funcionalidades previstas ficam no [Guia do Projeto](docs/guia-do-projeto.md).

Ainda não há uma versão publicada registrada neste histórico. As mudanças abaixo compõem a base inicial em desenvolvimento.

## Não lançado

### Corrigido

- Configuração TypeScript compartilhada entre editor e `typecheck` no back-end, incluindo os tipos de sessão sem gerar arquivos compilados.

### Adicionado

u- Dashboard operacional com contagens de OS, busca de clientes/OS/páginas e telas de listagem, cadastro, edição e detalhes de OS. Fluxo de status e uso de material conectados à API existente, sem cálculos financeiros novos.
- Atalho para cadastrar cliente durante a abertura de OS, com retorno ao formulário, preservação dos campos e seleção do cliente criado.
- Máscara de reais e centavos no valor de cadastro e edição de OS, mantendo o envio decimal aceito pela API.
- Estoque funcional em `/estoque`, com Produtos para venda e Materiais, busca/categorias, cadastro/edição/exclusão, entradas e saídas integradas ao PostgreSQL. Fornecedores com vários vínculos por item; lucro unitário e percentual sobre custo. Preserva histórico e saldo não negativo. Migração de fornecedores aplicada; verificação integrada com dados fictícios e rollback.

- Tela Financeiro em `/financeiro` e no menu, exclusiva do Administrador em desenvolvimento e produção, com botão Voltar e detalhes por categoria. Mantém dados fictícios temporários autorizados e identificados, filtros, cartões, gráfico acessível e movimentações; reutiliza tema e componentes existentes. API/banco financeiro e fórmulas reais continuam pendentes.

- Funcionários: perfil com lupa, Meu perfil para ambos os perfis, edição pessoal com senha do Administrador, CPF/telefone obrigatórios e desativação no perfil. Formulário e confirmação reutilizáveis. Migração preparada, sem aplicação no banco existente; foto adiada.

- Componente Alerta compartilhado por Clientes e Funcionários: avisos verdes com barra regressiva e fechamento automático após cinco segundos; cores semânticas no tema.

- Perfil de Clientes reorganizado conforme referência visual, com cartões responsivos, observações e OS compactas; ação de lupa na lista. Edição dos sete campos integrada à API existente, usando formulário compartilhado com cadastro e tokens do tema.

- Botão de exclusão no perfil do cliente, com confirmação reutilizando Dialog, CSRF e tratamento de vínculos com OS e resultado incerto.

- Clientes com CPF obrigatório validado, máscaras de telefone/CPF/CEP, consulta ViaCEP reutilizável, perfil com data e histórico de OS. Migração preserva cadastros antigos e está preparada, sem aplicação no banco existente. Testes HTTP/PostgreSQL local e navegador.

- Listagem e cadastro de Clientes na interface para Administrador e Funcionário, integrados à API existente, com validações, mensagens de erro e bloqueio de reenvio em resultado incerto. Componente TextareaField reutilizável.

- Desativação de Funcionários com diálogo reutilizável, confirmação da senha do Administrador, bloqueio da própria conta e limites de tentativas. Preserva históricos e invalida sessões; a rota de alteração de acesso também exige confirmação ao desativar. Testes HTTP com PostgreSQL descartável.

- Listagem e cadastro de Funcionários com usuário/senha, exclusivos do Administrador, usando a API existente. Componentes reutilizados, seleção de perfil, validação e tratamento de duplicidade e resultado incerto; comunicação de cookie/CSRF compartilhada entre autenticação e cadastros.

- Layout e sidebar reutilizáveis, páginas “Em construção”, identificação do usuário pela API, verificação de sessão na navegação, restrição de Funcionários ao Administrador e logout com CSRF. Financeiro e Configurações permanecem desabilitados.

- Tela de login responsiva baseada no design Seda e Couro, com componentes de campo/botão, integração à API com cookie e CSRF, mensagens de erro e redirecionamento ao Dashboard após autenticação confirmada.

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
