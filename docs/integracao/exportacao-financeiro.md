# Fluxo de exportação do Financeiro

**Situação:** implementado para o Financeiro, conforme decisão do usuário em 09/11/2026. Este registro atende ao fluxo acadêmico RA-004; não altera as regras financeiras já aprovadas.

## Finalidade

Permitir que o Administrador leve os dados consultados no Financeiro para planilhas Excel ou ferramentas que aceitam CSV. A exportação é uma consulta: não cria nem altera lançamentos, pagamentos, parcelas ou fechamentos.

## Fluxo

| Etapa | Descrição |
|---|---|
| Origem | API `GET /api/v1/financeiro`, que consulta os pagamentos, lançamentos e parcelas existentes no banco para o período selecionado. A rota exige sessão de Administrador (RN-003). |
| Transformação | A tela usa os dados já recebidos. O resumo contém os indicadores existentes, exceto impostos e lucro líquido, que permanecem sem definição. Movimentações recebem os filtros locais de tipo e origem; contas/parcelas correspondem ao período consultado. Não há recálculo financeiro na exportação. |
| Validação | A API valida as datas do período e a interface interpreta a resposta conforme os tipos de Financeiro. Os botões ficam indisponíveis enquanto os dados carregam ou quando a consulta falha. |
| Destino | O Excel é um arquivo `.xlsx` com abas `Resumo`, `Movimentações` e `Contas`. O resumo usa valores em reais, período legível e layout A4 retrato; os detalhes usam A4 paisagem, cabeçalhos repetidos nas páginas e filtros para consulta na tela. O CSV gera um arquivo UTF-8 com BOM por conjunto, com colunas separadas por ponto e vírgula e cabeçalhos. Os valores numéricos do CSV usam vírgula decimal. |
| Erros | Falhas da consulta são exibidas pela própria tela e impedem exportar dados ausentes. A geração ocorre no navegador, sem nova chamada à API; o navegador pode rejeitar ou interromper o download, caso em que o usuário pode tentar novamente. |

## Limites

- A exportação mantém o acesso exclusivo do Administrador.
- O período segue o filtro ativo. Os filtros de tipo e origem se aplicam às movimentações; resumo e contas não são alterados por esses filtros.
- Os valores e regras são os mesmos da consulta do Financeiro. O arquivo não acrescenta fórmulas para impostos, lucro líquido ou outras métricas pendentes.
- Nenhuma estrutura do banco ou contrato de API foi alterada para criar esta exportação.
