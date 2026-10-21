# Regras de negócio — Seda e Couro

[Índice da documentação](README.md) · [Guia do Projeto](guia-do-projeto.md) · [Requisitos](requisitos.md)

## Leitura e situação atual

Este documento registra permissões, condições e relações entre os módulos da sapataria. As telas e os detalhes de interface estão nos requisitos; aqui são referenciados por identificador. Regras de convivência e contribuição permanecem no [CONTRIBUTING](../CONTRIBUTING.md).

Cada RN informa origem, classificação, situação da definição e limite do critério de aceitação. “Guia §…” remete à seção do Guia do Projeto. **Sugestão significa proposta não aprovada**, inclusive quando a fonte usa verbos afirmativos. As marcações dos §§3, 5, 6, 9.3 e 10 também abrangem tabelas e listas internas, conforme a [legenda documental](README.md#como-interpretar-as-classificacoes).

**Situação atual:** autenticação, operações de estoque e a integração financeira descrita nas decisões abaixo estão implementadas. Impostos, emissão fiscal e alertas de prazo continuam pendentes; alertas de estoque por mínimo cadastrado estão implementados.

Critérios de sugestões são propostos e condicionados à aprovação. Quando falta decisão, o texto registra **Pendente de definição**. A autorização de criação destes documentos não altera a classificação original.

## Permissões e identificação

### Decisões confirmadas e implementadas nesta etapa — acesso

- Login individual por **usuário e senha**, sem diferenciação de maiúsculas/minúsculas no usuário; e-mail obrigatório apenas para contato. Usuário único, perfis administrador/funcionario sem perfil padrão e ativo=true por padrão.
- Apenas Administrador acessa cadastro/listagem/edição/alteração de acesso de Funcionários (RN-001). Consulta individual e suas OS também são permitidas ao próprio Funcionário (RN-006). Os dois perfis autenticados podem operar Clientes, Materiais, Produtos, OS, Vendas e Movimentações, incluindo exclusões permitidas, cancelamentos e correções.
- Senha com 15–128 caracteres, armazenada como hash scrypt; sessão PostgreSQL com duração absoluta de 8h. Login inválido não revela se a pessoa existe ou está inativa. Limite de 10 tentativas por usuário e 50 por IP em 15min.
- Desativação e mudança de perfil invalidam sessões anteriores, verificadas em cada requisição. Reativação exige novo login. O logout encerra a sessão utilizada.
- Operações que alteram dados exigem token CSRF ligado ao cookie de sessão. Primeiro administrador criado apenas por comando local quando não há funcionários; nenhum cadastro público ou conta padrão.
- Recuperação de senha e exclusão física de funcionário não estão implementadas. A troca da própria senha foi implementada em 15/10/2026; consulte RN-004/PD-N02.

Essas decisões atualizam as pendências correspondentes de RN-001/RN-002/RN-004 e PD-N01/PD-N02; as referências ao guia abaixo são mantidas como origem histórica.

### Decisões operacionais confirmadas pelo Integrante 1 e implementadas

- RN-002: ambos os perfis operam os módulos de negócio; administração de funcionários continua exclusiva do administrador.
- RN-009: PIX, crédito, débito e dinheiro, representados por `pix`, `credito`, `debito`, `dinheiro`. Pagamento opcional na OS e obrigatório na venda. Parcelas, descontos e reembolsos não foram definidos.
- RN-010: OS nasce Aberta; sequência Aberta → Em andamento → Pronta → Entregue. Responsável ativo escolhido no cadastro. Edição e novos usos somente Aberta/Em andamento. Cancelamento permitido até Pronta; Entregue/Cancelada finais. Valor manual; cálculo automático adiado.
- RN-011: venda com pelo menos um produto, vendedor da sessão, preço do cadastro preservado em cada item e total calculado pela soma de quantidade × preço. Cadastro da venda e baixa são uma transação. Preço não pode ser sobrescrito na venda.
- RN-012: baixa no registro do uso efetivo, uma linha por uso. Cancelamento de OS não repõe materiais. Devolução de material não utilizado é registrada separadamente e limitada ao consumo ainda não revertido. Indicadores de custo/financeiro permanecem pendentes.
- RN-018/RN-019: materiais fracionáveis; produtos inteiros; valores monetários com até duas casas, zero permitido, negativos recusados. Saldos começam em zero quando o cadastro não informa saldo inicial, nunca ficam negativos; quantidade mínima não negativa. Entrada, uso, saída e venda exigem quantidade positiva. Custo do material corresponde à unidade informada. Saldo inicial positivo no cadastro cria uma entrada histórica na mesma transação.
- Entradas e saídas manuais registram motivo, data automática e saldo na mesma transação. Não há edição direta de saldo. OS e vendas também têm data automática.
- Correções preservam a origem e registram movimento inverso. Um movimento manual pode ser estornado integralmente uma vez; venda usa cancelamento próprio e consumo usa devolução própria. Venda cancelada repõe somente quantidades efetivamente devolvidas, informadas no cancelamento. Não se edita/apaga movimento original.
- RN-020: Clientes somente sem vínculos; Materiais/Produtos somente sem vínculos e com saldo zero. OS/Vendas são canceladas, funcionários desativados; histórico preservado.

### Registro de atividades e notificações — decisão de João Contin em 15/10/2026

- O Administrador pode consultar todas as atividades. O Funcionário consulta as ações próprias e atividades de OS atualmente atribuídas a ele. Cada pessoa consulta e atualiza somente as próprias notificações.
- O histórico registra eventos operacionais de OS, autenticação bem-sucedida, Clientes, Funcionários, materiais/produtos/fornecedores, movimentações de estoque e vendas. Senhas e dados pessoais dos formulários não são copiados. Não se registra tentativa de login inválida nesta entrega.
- Notificações: Administradores ativos recebem novas OS e cancelamentos de OS/venda; o Funcionário responsável ativo recebe atribuição de OS e mudanças de status da OS atualmente atribuída. O autor da ação não recebe aviso da própria ação.
- Alertas automáticos de prazo continuam pendentes conforme RN-013/PD-N08. O alerta de estoque abaixo do mínimo considera Materiais e Produtos com mínimo cadastrado e é atualizado junto aos dados da tela. A lista de atividades é limitada a 250 resultados por consulta e notificações a 100; filtros permitem localizar eventos anteriores.

Estas confirmações substituem as pendências correspondentes das sugestões originais abaixo. Financeiro, alertas automáticos e cadastro auxiliar de configurações continuam fora desta etapa.

### RN-001

**Cadastro de funcionários exclusivo do administrador.**

- **Origem:** Guia §§3, 4 e 5.5; a introdução do §4 ressalva expressamente essa permissão como definida no rascunho.
- **Classificação:** Definição da equipe. **Situação da definição:** definida no rascunho.
- **Regra e critério:** somente o administrador pode acessar o cadastro de funcionários. Isso não concede automaticamente acesso administrativo às outras áreas.
- **Implementado na API:** sem sessão válida retorna 401; perfil insuficiente retorna 403. Redirecionamento e menu da interface continuam pendentes.
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
| Controle financeiro | Somente Administrador; ver RN-003 | Decisão de João Franco em 01/10/2026 |

- **Pendente de definição:** aprovação dos perfis e da matriz de acesso; [PD-N01](#pd-n01). A exigência geral de acesso por perfil está em [RNF-005](requisitos.md#rnf-005), mas não aprova esta matriz específica.
- **Requisitos relacionados:** RF-001 a RF-011 no [catálogo](requisitos.md).

### RN-003

**Acesso a Configuração e Controle financeiro.**

**Decisão de João Franco em 01/10/2026, atualizada em 20/10/2026:** Financeiro exclusivo do Administrador. A interface `/financeiro` e a API protegida consultam lançamentos, parcelas e pagamentos reais do banco. A tela usa regime de caixa, mostra faturamento recebido, saídas, custos, despesas e lucros bruto/operacional. Impostos, emissão/armazenamento de notas fiscais e lucro líquido aguardam definição específica; a emissão fiscal permanece desabilitada na interface.

**Decisão do Integrante 1 em 15/10/2026 — Configurações:** ambos os perfis acessam `/configuracoes` para consultar os próprios dados de acesso, trocar a própria senha, manter preferências pessoais de notificações e tema e consultar o endereço comercial da loja. Essas preferências ficam salvas no navegador por usuário; notificações não geram alertas nesta etapa. Somente Administrador pode alterar o endereço; a API exige autenticação para consulta e verifica perfil administrativo na gravação. Esta decisão cobre somente as opções implementadas; catálogos e parâmetros financeiros sugeridos continuam pendentes.

- **Origem:** Guia §3 (tabela e nota), §4 e §17.
- **Classificação:** Financeiro definido pela decisão acima. Para Configuração, os acessos das preferências pessoais e dos dados comerciais foram definidos na decisão do Integrante 1 em 15/10/2026; demais opções continuam pendentes.
- **Divergência:** a tabela sugerida do §3 atribui todas as telas ao administrador; a nota dessa seção, o mapa do §4 e o §17 deixam estes acessos em aberto.
- **Critério de aceitação:** Financeiro visível e acessível somente ao Administrador; a futura API deve exigir o mesmo perfil. Ambos acessam as preferências pessoais e consultam o endereço comercial em Configurações; somente Administrador pode alterá-lo. Outros parâmetros/catálogos não estão habilitados.
- **Decisão necessária:** resolvida para essas áreas; qualquer opção futura de configuração deve ter seu acesso definido antes da implementação.
- **Requisitos relacionados:** [RF-010](requisitos.md#rf-010) e [RF-011](requisitos.md#rf-011).

### RN-004

**Proteção das telas por autenticação.**

- **Origem:** Guia §5.1, sob a marcação de sugestão da introdução do §5; §9.4 sugere rotas protegidas. Exigência geral de segurança no §8.2, com classificação mista no §14.
- **Classificação:** Sugestão para o comportamento específico de proteger as demais telas; Exigência acadêmica para segurança e acesso por perfil no §8.2. **Situação da definição:** comportamento proposto, com alcance a esclarecer.
- **Regra e critério propostos:** as telas além do Login só abrem para usuários autenticados.
- **Atualização:** mecanismo de login, expiração e limites confirmados na seção de decisões acima. Troca da própria senha implementada em 15/10/2026 com senha atual, nova senha e confirmação; política existente de 15–128 caracteres mantida e sessões invalidadas após o sucesso. Recuperação de senha permanece pendente.
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

**Decisão do Integrante 1 em 30/09/2026 — implementada no código:** Funcionário comum consulta somente o próprio perfil e suas OS; Administrador consulta todos. Edição pessoal (nome, e-mail, CPF e telefone), inclusive a própria, é exclusiva do Administrador e exige confirmação com sua senha. Essa decisão restringe a operação de edição pessoal e não concede mudança de usuário ou permissões. Em 15/10/2026, a troca da própria senha foi definida e implementada em operação separada para ambos os perfis (ver RN-003 e PD-N02). Limites de confirmação compartilhados com desativação: 10/Administrador e 50/IP em 15 minutos, incluindo sucessos, separados do login. CPF/telefone são obrigatórios em novos cadastros e na edição pessoal, preservando valores desconhecidos dos legados. Foto ficou fora do escopo por decisão explícita. Estas decisões atualizam as pendências históricas abaixo.

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

**Atualização aprovada:** Formas aceitas confirmadas e implementadas: pix, credito, debito e dinheiro; opcional em OS. Demais condições de pagamento continuam pendentes.

**Formas e condições de pagamento.**

- **Origem:** Guia §17; §§5.4, 5.6 e 5.10 sugerem campos e cadastro auxiliar de formas de pagamento.
- **Classificação:** Pendência. **Situação da definição:** Pendente de definição.
- **Decisão necessária:** definir as formas aceitas pela loja e os comportamentos de pagamento necessários ao registro; [PD-N05](#pd-n05).
- **Critério de aceitação:** não fechado. A fonte não autoriza presumir pagamento parcial, parcelamento, desconto, troco ou integração com meios de pagamento. A exclusão dessa integração também é apenas sugerida no Guia §1.4.
- **Requisitos relacionados:** [RF-018](requisitos.md#rf-018), [RF-020](requisitos.md#rf-020) e [RF-024](requisitos.md#rf-024).

### RN-010

**Atualização aprovada:** Estados e sequência confirmados e implementados conforme decisões operacionais acima. Cancelada encerra a OS, inclusive após início, preservando consumo já registrado.

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

**Atualização aprovada:** Registro, preço histórico, total e baixa confirmados e implementados. Apuração do painel financeiro continua pendente.

**Efeitos da venda independente.**

- **Origem:** Guia §§5.6, 5.8, 6.2 e 6.3; detalhes e fluxo sugeridos.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra proposta:** selecionar produtos e quantidades, informar a forma de pagamento e registrar a venda; o registro dá baixa no estoque de produtos e soma o valor ao faturamento.
- **Critério proposto:** observar os efeitos de estoque e faturamento no registro da venda, se esse fluxo for aprovado. A consistência geral possui exigência própria em RN-018 e RN-019.
- **Pendente de definição:** momento e condições definitivas da operação, correções e cancelamentos, pagamentos e apuração financeira; [PD-N05](#pd-n05), [PD-N06](#pd-n06) e [PD-N07](#pd-n07).
- **Requisitos relacionados:** [RF-020](requisitos.md#rf-020) e [RF-022](requisitos.md#rf-022).

## Estoques e indicadores financeiros

**Complemento confirmado por João Franco nesta implementação:** condições comerciais em campos opcionais separados por fornecedor: prazo de pagamento, meios de pagamento, desconto e moeda. Armazenadas como texto informativo, sem automatizar preços, compras, movimentações ou formas de pagamento de Vendas/OS. A solicitação sobre retirada de Material foi esclarecida como Registrar uma Saída: saldo zero mantém o cadastro e o histórico no banco, agora consultável pela ação Histórico na tela. Nenhuma mudança na exclusão física permitida por RN-020 foi aprovada; permanece saldo zero e ausência de vínculos.

**Decisão de João Franco em 13/10/2026 — implementada:** categorias continuam texto livre, com sugestões por tipo de estoque e categorias já cadastradas. Cola/Colas sugerem kg ou g para novos Materiais; outras categorias mantêm unidade informada. Produtos continuam em unidades inteiras. Material usa uma unidade de controle para saldo, mínimo, custo e consumo; sem conversão automática. Unidade não pode mudar quando houver saldo ou qualquer movimentação, mesmo com saldo novamente zero. A edição preserva unidades legadas, inclusive Cola cadastrada em L. A proteção usa bloqueio transacional e trigger no banco.

Cadastro/edição de item aceita fornecedores opcionais na mesma transação. Campo omitido preserva vínculos na edição; lista vazia remove os vínculos. Fornecedor continua com nome de exibição obrigatório; CNPJ, razão social, nome fantasia, CEP, número, e-mail e telefone são opcionais e validados quando informados. Omitir novos campos na edição preserva os valores anteriores; null ou texto vazio limpa explicitamente um campo opcional. CNPJ valida formato/dígitos, sem consulta cadastral; não foi aprovada unicidade de CNPJ. CEP tem oito números e telefone com DDD aceita dez ou onze números. Falha no ViaCEP não impede salvar. Dados bancários permanecem fora desta etapa; condições comerciais foram aprovadas no complemento acima.

**Decisão de João Franco em 02/10/2026 — implementada:** a tela principal de Estoque permite aos dois perfis autenticados operar Produtos para venda e Materiais, respeitando RN-018/RN-019/RN-020. Fornecedores têm cadastro pelo nome e associação opcional de vários fornecedores por item. Fornecedor associado não pode ser excluído; editar o nome não altera saldos ou preços. O lucro exibido por Produto é a diferença unitária venda − compra, e o percentual é calculado sobre o custo; custo zero não permite percentual. Esta informação prevista por produto não define lucro realizado, impostos ou indicadores financeiros de RN-014 a RN-017. A tela compara Materiais com seu mínimo cadastrado; Produtos não possuem mínimo, e não recebem limite inventado nem alerta automático.

**Decisão de João Franco em 15/10/2026 — implementada:** Produtos têm quantidade mínima inteira configurável por item; registros anteriores sem mínimo permanecem sem valor até serem editados, sem atribuição de limites presumidos. A tela destaca Materiais ou Produtos cujo saldo atual está abaixo do respectivo mínimo cadastrado. A compra exige um fornecedor e ao menos um item com quantidade e preço unitário; gera registros de compra, itens e entradas vinculadas na mesma transação. O preço da compra fica preservado no histórico e atualiza o custo atual pelo método de custo médio ponderado. A importação CSV valida os dados, rejeita duplicados e grava o lote integralmente ou não grava nada; quantidade inicial positiva cria movimento de entrada identificado como saldo inicial importado.

### RN-012

**Atualização aprovada em 20/10/2026:** Consumo efetivo, baixa, devolução e custo histórico por movimentação confirmados e implementados. O custo usado no financeiro é calculado pelo método de custo médio ponderado.

**Uso de materiais em OS.**

- **Origem:** Guia §§5.7 e 6.3.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** materiais usados em uma OS saem do estoque de materiais e entram no custo de Materiais do financeiro.
- **Implementado:** cada uso efetivo registra uma saída com custo unitário vigente; devoluções preservam a origem e o custo da movimentação revertida. [PD-N07](#pd-n07) continua tratando apenas de decisões futuras não relacionadas a este fluxo.
- **Requisitos relacionados:** [RF-018](requisitos.md#rf-018) e [RF-021](requisitos.md#rf-021).

### RN-013

**Alertas de estoque e prazo.**

- **Origem:** Guia §§1.2, 5.2, 5.7 e 5.8.
- **Classificação:** Sugestão. **Situação da definição:** proposta não aprovada.
- **Regra e critério propostos:** para materiais, alertar quando a quantidade estiver abaixo do mínimo. Para produtos, alertar estoque baixo; para OS, alertar proximidade do prazo.
- **Pendente de definição:** antecedência para alerta de prazo de OS; [PD-N08](#pd-n08). Alertas de materiais e produtos abaixo dos limites cadastrados foram aprovados e implementados em 15/10/2026.
- **Requisitos relacionados:** [RF-016](requisitos.md#rf-016), [RF-021](requisitos.md#rf-021) e [RF-022](requisitos.md#rf-022).

### RN-014

**Faturamento.**

- **Origem:** Guia §§5.11, 6.1 e 6.3.
- **Classificação:** Definição da equipe. **Situação da definição:** definida e implementada em 20/10/2026.
- **Regra:** faturamento é o total bruto efetivamente recebido no período, em regime de caixa. O cancelamento de venda gera estorno na data do cancelamento; OS cancelada sem pagamento não gera recebimento.
- **Implementado:** pagamentos são filtrados pela data de pagamento, e o painel exige perfil Administrador.
- **Requisito relacionado:** [RF-025](requisitos.md#rf-025).

### RN-015

**Indicador de materiais.**

- **Origem:** Guia §§5.7, 5.11 e 6.3.
- **Classificação:** Definição da equipe. **Situação da definição:** definida e implementada em 20/10/2026.
- **Regra:** compras são saídas de caixa/estoque; o custo entra no resultado quando o material é usado ou o produto é vendido. O método de custo é médio ponderado, preservando custo unitário e total nas movimentações.
- **Requisito relacionado:** [RF-025](requisitos.md#rf-025).

### RN-016

**Imposto e configuração financeira.**

- **Origem:** Guia §§5.10, 5.11 e 6.3; pendência explícita no §17.
- **Classificação:** Pendência. **Situação da definição:** imposto permanece aguardando definição da equipe.
- **Regra e critério propostos:** calcular imposto sobre o faturamento conforme parâmetro de Configuração, exemplificado como alíquota.
- **Pendente de definição:** regra efetiva de cálculo e parâmetro aplicável; [PD-N06](#pd-n06). Não se fixa percentual, fórmula completa, arredondamento ou obrigação fiscal.
- **Requisitos relacionados:** [RF-024](requisitos.md#rf-024) e [RF-025](requisitos.md#rf-025).

### RN-017

**Lucro.**

- **Origem:** Guia §5.11; pendência explícita no §17.
- **Classificação:** Definição da equipe. **Situação da definição:** definida e implementada em 20/10/2026.
- **Regra:** lucro bruto = faturamento recebido menos custo de produtos vendidos e materiais usados; lucro operacional = lucro bruto menos despesas operacionais pagas. Lucro líquido permanece indisponível enquanto impostos não forem definidos.
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

**Confirmação do Integrante 1 em 28/09/2026 — implementada:** desativação de outro funcionário exige a senha do Administrador autenticado; não pode desativar a própria conta. A regra vale na interface e em todas as rotas de desativação, incluindo a alteração de acesso existente. Preserva cadastro, perfil (na ação dedicada) e histórico, invalida sessões anteriores e mantém o funcionário visível como inativo. Senha incorreta não altera a conta. A confirmação tem limites de 10 tentativas por Administrador e 50 por IP em 15 minutos, separados do login, incluindo sucessos. Não é exclusão física nem uma implementação de recuperação/troca de senha.

**Atualização aprovada:** Exclusão sem vínculos e com saldo zero para estoques confirmada e implementada. Funcionários são desativados; OS/vendas canceladas.

**Remoção ou desativação por entidade.**

- **Origem:** Guia §9.1, no contexto da exigência acadêmica de métodos HTTP; DELETE é descrito como “Remover (ou desativar) um registro”. O §5.5 sugere ativar/desativar acesso de funcionários.
- **Classificação:** Pendência quanto à regra por entidade; a disponibilidade do método HTTP é Exigência acadêmica em [RNF-003](requisitos.md#rnf-003).
- **Situação da definição:** Pendente de definição.
- **Critério de aceitação:** não fechado para remoção/desativação. É necessário decidir o comportamento por recurso, sem presumir exclusão física, lógica ou tratamento de vínculos e históricos.
- **Decisão necessária:** [PD-N09](#pd-n09).

<a id="pendencias"></a>
## Decisões de negócio em aberto

A situação de cada registro abaixo indica o que foi resolvido e o que permanece pendente. Não são funcionalidades novas: registram lacunas ou dúvidas das fontes que impedem fechar regras e critérios. A ausência de uma política não autoriza implementá-la por inferência.

| ID | Decisão necessária | Origem e regras relacionadas |
|---|---|---|
| <a id="pd-n01"></a>PD-N01 | Resolvido: ambos os perfis operam Clientes/OS/Vendas/Estoques, incluindo exclusões, cancelamentos e correções permitidos; Gestão de Funcionários exclusiva do Administrador; consulta individual também permitida ao próprio Funcionário. Financeiro exclusivo do Administrador, confirmado por João Franco em 01/10/2026. Configurações: preferências pessoais e consulta do endereço comercial acessíveis a ambos; alteração do endereço somente pelo Administrador, conforme decisão do Integrante 1 em 15/10/2026. Futuras opções de catálogo/parâmetros ainda exigem definição específica. | Guia §§3, 4, 5.5, 9.3 e 17; RN-001, RN-002, RN-003 e RN-007. “Todas as telas” do administrador é sugestão em tensão com acessos explicitamente pendentes. |
| <a id="pd-n02"></a>PD-N02 | Resolvido para troca da própria senha em 15/10/2026: exige senha atual, nova senha e confirmação; mantém política de 15–128 caracteres e invalida as sessões ativas após o sucesso. Recuperação de senha permanece pendente. | Guia §§5.1, 5.5 e 5.9; RN-004. Mecanismo técnico de armazenamento de senha em [PD-R04](requisitos.md#pd-r04). |
| <a id="pd-n03"></a>PD-N03 | Resolvidos campos/obrigatoriedade e operações dos nove cadastros conforme modelo/API. Pendentes: vínculos Cliente–Venda e OS–Venda, autoedição por Funcionário comum não autorizada nesta etapa; demais cadastros auxiliares pendentes. | Guia §5 (validação exigida, detalhes sugeridos), §§5.3–5.4, 5.9, 10 e 17; RN-006 e RN-010. Listar um campo não o torna obrigatório. |
| <a id="pd-n04"></a>PD-N04 | Resolvidos estados, transições, edição e cancelamento da OS. Prazo permanece opcional, sem cálculo automático; catálogo de serviços não definido. | Guia §§6.1 e 17; RN-010. O guia define apenas significados sugeridos, não transições ou duração. |
| <a id="pd-n05"></a>PD-N05 | Formas aceitas resolvidas: PIX, crédito, débito, dinheiro. Pagamento opcional em OS, obrigatório em venda. Situações financeiras adicionais permanecem pendentes. | Guia §§5.4, 5.6, 6.1–6.2 e 17; RN-009 a RN-011. Não há política documentada de parcelamento ou pagamento parcial. |
| <a id="pd-n06"></a>PD-N06 | Aprovar critérios de faturamento e períodos, apuração de materiais, fórmula de lucro, custos incluídos e regra/parâmetro do imposto. | Guia §§5.11, 6.1, 6.3 e 17; RN-012 e RN-014 a RN-017. Definições atuais são sugestões; lucro e imposto são pendências explícitas. |
| <a id="pd-n07"></a>PD-N07 | Resolvido para esta etapa: baixas no uso/venda; operações atômicas; estoque não negativo; estorno de movimento manual; devolução de material não utilizado; cancelamento de venda com itens efetivamente devolvidos. | Guia §§5.6–5.8 e 6: **Sugestões**; §8.2: **Exigência acadêmica** de consistência; RN-011, RN-012, RN-018 e RN-019. Preservar ambas as classificações. |
| <a id="pd-n08"></a>PD-N08 | Parcialmente resolvido em 15/10/2026: materiais e produtos são alertados quando o saldo cai abaixo do mínimo cadastrado; Produtos possuem mínimo inteiro individual. Pendente: antecedência do alerta de prazo de OS. | Guia §§1.2, 5.2, 5.7 e 5.8; RN-013. |
| <a id="pd-n09"></a>PD-N09 | Resolvido: Clientes sem vínculos; Materiais/Produtos sem vínculos e com saldo zero; funcionários desativados; OS/vendas canceladas; movimentos preservados. | Guia §§5.5 e 9.1; RN-020. As alternativas não estão resolvidas por recurso. |
| <a id="pd-n10"></a>PD-N10 | Confirmar a classificação da frase sobre visibilidade de Funcionários no menu. | Guia §11.3; RN-005. Preservar a ambiguidade da marcação posterior ao esboço, sem enfraquecer a restrição de acesso de RN-001. |

Pendências de tecnologias, nuvem, identidade visual, colaboração e entregas acadêmicas estão no [catálogo de requisitos](requisitos.md#pendencias), para evitar duplicação.
