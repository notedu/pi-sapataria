---
name: Sapataria Pro
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#504441'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#827470'
  outline-variant: '#d4c3be'
  surface-tint: '#77574d'
  primary: '#442a22'
  on-primary: '#ffffff'
  primary-container: '#5d4037'
  on-primary-container: '#d4ada1'
  inverse-primary: '#e7bdb1'
  secondary: '#005faf'
  on-secondary: '#ffffff'
  secondary-container: '#54a0fe'
  on-secondary-container: '#003567'
  tertiary: '#1e333d'
  on-tertiary: '#ffffff'
  tertiary-container: '#354a54'
  on-tertiary-container: '#a3b9c4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#e7bdb1'
  on-primary-fixed: '#2c160e'
  on-primary-fixed-variant: '#5d4037'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a5c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#004786'
  tertiary-fixed: '#cfe6f2'
  tertiary-fixed-dim: '#b4cad6'
  on-tertiary-fixed: '#071e27'
  on-tertiary-fixed-variant: '#354a53'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

O sistema de design é fundamentado no conceito de "Oficina Moderna". Ele equilibra a tradição artesanal da sapataria com a eficiência de uma ferramenta de gestão contemporânea. A estética é **Corporate / Modern**, priorizando a funcionalidade extrema, clareza visual e uma organização sistemática que facilite o fluxo de trabalho intenso de uma operação de varejo e reparo.

O objetivo é evocar uma sensação de confiabilidade e durabilidade, espelhando a qualidade do trabalho manual em couro, mas através de uma interface digital precisa e limpa. A interface utiliza uma estrutura de grade rigorosa, espaços em branco generosos para reduzir a carga cognitiva e uma hierarquia visual clara para ações críticas de inventário e status de pedidos.

## Colors

A paleta de cores é extraída de elementos naturais da sapataria e da seriedade administrativa:

*   **Primary (Couro):** Um marrom profundo (#5D4037) usado para elementos de marca e cabeçalhos principais, ancorando o sistema na identidade do negócio.
*   **Secondary (Ação):** Um azul profissional (#1976D2) reservado para ações primárias, links e estados ativos, garantindo que os botões de interação se destaquem claramente.
*   **Tertiary (Slate):** Tons de cinza ardósia (#455A64) para ícones, subtítulos e elementos de interface secundários, proporcionando um contraste sofisticado.
*   **Neutral:** Uma base de cinzas frios e brancos puros para manter o ambiente de trabalho limpo e focado nos dados.
*   **Semantic:** Verde (Sucesso/Concluído), Amarelo (Em Reparo), e Vermelho (Atrasado/Urgente) são aplicados em badges de status com saturação moderada para não distrair excessivamente.

## Typography

A tipografia foca na legibilidade técnica e na hierarquia de dados:

*   **Hanken Grotesk:** Utilizada para títulos e cabeçalhos de seções. É uma fonte moderna e nítida que transmite profissionalismo sem ser excessivamente corporativa.
*   **Work Sans:** A fonte de trabalho para todo o corpo de texto e entradas de formulário. Sua natureza otimizada para telas garante que longas listas de pedidos sejam fáceis de ler.
*   **JetBrains Mono:** Utilizada para badges de status, códigos de rastreamento (SKUs) e etiquetas de preços. O estilo mono-espaçado auxilia na rápida identificação de números e identificadores únicos nos processos de reparo.

## Layout & Spacing

Este sistema utiliza uma **Grade Fluida de 12 colunas** para desktops e tablets, adaptando-se para uma coluna única em dispositivos móveis. O ritmo visual é construído sobre uma unidade base de 8px.

*   **Desktop:** Margens laterais de 32px para focar o conteúdo central. Tabelas de dados ocupam a largura total disponível para maximizar a visibilidade das colunas.
*   **Tablet:** Redução das margens para 24px e colapso de barras laterais de navegação em ícones compactos.
*   **Mobile:** Foco em "Cards" de pedidos em vez de tabelas, com margens de 16px.
*   **Densidade:** O sistema prioriza uma densidade de informações média-alta, permitindo que os funcionários vejam múltiplos pedidos simultaneamente sem necessidade de scroll excessivo.

## Elevation & Depth

A profundidade é comunicada através de **Camadas Tonais** e sombras sutis, evitando efeitos visuais pesados:

*   **Nível 0 (Fundo):** Cor neutra clara (#F5F5F5), servindo como tela base.
*   **Nível 1 (Cards e Tabelas):** Superfícies brancas puras (#FFFFFF) com um "Ghost Border" (contorno de 1px em cinza muito claro) para separação.
*   **Nível 2 (Modais e Popovers):** Sombras ambientais suaves (blur de 12px, 5% de opacidade preta) para destacar diálogos de confirmação e edição de status.
*   **Interatividade:** Elementos clicáveis não usam sombras para indicar elevação, mas sim mudanças sutis na cor de fundo (hover) para manter a estética plana e funcional.

## Shapes

O sistema de design adota um arredondamento **Soft (0.25rem)**. Esta escolha reflete a precisão das ferramentas de corte e a estrutura do calçado:

*   **Inputs e Botões:** Utilizam o raio padrão de 4px para um visual limpo e estruturado.
*   **Badges de Status:** Podem utilizar o estilo `rounded-xl` (12px) para criar um contraste visual com os elementos retangulares da tabela, facilitando a identificação rápida do estado do pedido.
*   **Cards de Dashboard:** Mantêm os 4px para preservar a integridade da grade.

## Components

*   **Data Tables:** Devem possuir linhas alternadas (zebra striping) em cinza muito claro. Cabeçalhos fixos com tipografia `label-md` em caixa alta.
*   **Status Badges:** Elementos cruciais. Devem usar cores semânticas com fundo claro e texto escuro (ex: Fundo verde claro com texto verde floresta para "Concluído").
*   **Form Fields:** Bordas de 1px sólidas. O estado de foco deve usar a `secondary_color` (azul) com um anel de foco suave.
*   **Buttons:**
    *   *Primary:* Marrom profundo com texto branco para ações definitivas (Salvar Pedido).
    *   *Secondary:* Azul para ações de navegação ou adição (Novo Item).
    *   *Ghost:* Apenas texto para ações de cancelamento.
*   **Dashboard Widgets:** Cards compactos exibindo métricas chave (ex: "Reparos para Hoje") usando `display-lg` para os números principais.
*   **List Items:** Itens de lista de materiais com controles de incremento/decremento de inventário integrados.