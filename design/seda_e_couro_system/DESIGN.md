---
name: Seda e Couro System
colors:
  surface: '#fff8f1'
  surface-dim: '#e9d8c8'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8eee5'
  surface-container: '#f1e3d6'
  surface-container-high: '#ead9c9'
  surface-container-highest: '#dfc9b6'
  on-surface: '#270f01'
  on-surface-variant: '#64422d'
  inverse-surface: '#291709'
  inverse-on-surface: '#fff8f1'
  outline: '#81553e'
  outline-variant: '#c7a88f'
  surface-tint: '#50311d'
  primary: '#50311d'
  on-primary: '#fff8f1'
  primary-container: '#64422d'
  on-primary-container: '#fff8f1'
  inverse-primary: '#d49f74'
  secondary: '#81553e'
  on-secondary: '#fff8f1'
  secondary-container: '#e9cdb5'
  on-secondary-container: '#270f01'
  tertiary: '#64422d'
  on-tertiary: '#fff8f1'
  tertiary-container: '#d9b99d'
  on-tertiary-container: '#270f01'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d49f74'
  primary-fixed-dim: '#9d6d51'
  on-primary-fixed: '#270f01'
  on-primary-fixed-variant: '#50311d'
  secondary-fixed: '#e9cdb5'
  secondary-fixed-dim: '#c79a76'
  on-secondary-fixed: '#270f01'
  on-secondary-fixed-variant: '#50311d'
  tertiary-fixed: '#e4c4a8'
  tertiary-fixed-dim: '#c79a76'
  on-tertiary-fixed: '#270f01'
  on-tertiary-fixed-variant: '#50311d'
  background: '#fff8f1'
  on-background: '#270f01'
  surface-variant: '#dfc9b6'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is built for a contemporary artisanal shoemaker, blending the precision of modern craftsmanship with a friendly, approachable boutique atmosphere. It targets a discerning audience that values quality, hand-finished details, and professional reliability.

The visual style is **Modern Minimalist with a Handcrafted Soul**. It utilizes generous whitespace, clean layouts, and a refined color palette to evoke a sense of calm and expertise. The "handcrafted" element is introduced through subtle line-work, soft shapes, and high-quality photography, steering clear of traditional "heavy" leather aesthetics in favor of a lighter, more sophisticated expression.

## Colors

The palette is derived directly from the brand’s core identity, emphasizing a professional yet warm environment.

- **Primary (Marrom Café, `#3C1E0C`):** Used for actions and brand accents, with the darker `#50311D` and `#64422D` supporting navigation and structure.
- **Secondary (Caramelo Queimado, `#9D6D51`):** Used for secondary surfaces and hover states.
- **Highlight (Caramelo Claro, `#D49F74`):** Used for emphasis, readable text and important controls against the dark brand background.
- **Deep backgrounds (`#291709` and `#270F01`):** Anchor the dark theme; the light theme uses warm off-white surfaces and dark brown text for comfortable reading.

## Typography

The typography system uses **Hanken Grotesk** exclusively to maintain a clean, sharp, and contemporary aesthetic. 

- **Headlines:** Set with tighter letter-spacing and heavier weights to provide a confident structural anchor.
- **Body:** Standardized with ample line-height to ensure readability and a "breathing" layout that feels premium.
- **Labels:** Utilized for navigational elements and metadata, often paired with slightly increased letter-spacing to distinguish them from body copy.

## Layout & Spacing

This design system employs a **Fluid Grid** model built on an 8px base unit. 

- **Desktop:** A 12-column grid with 24px gutters. Content should be centered within a 1200px max-width container for editorial-style clarity.
- **Mobile:** A single-column layout with 20px side margins. 
- **Rhythm:** Spacing should be used to group related handcrafted elements closely (e.g., product image and title) while using larger gaps (64px+) between sections to maintain the minimalist feel.

## Elevation & Depth

To maintain the "handcrafted" and professional aesthetic, this design system avoids heavy drop shadows. Depth is communicated through:

- **Tonal Layers:** Warm off-white surfaces distinguish sections in the light theme; layered browns distinguish containers in the dark theme.
- **Low-Contrast Outlines:** Elements like cards and inputs use subtle 1px brown or caramel borders instead of heavy shadows.
- **Intentional Overlaps:** Images may slightly overlap container edges to create a sense of physical, layered materials, mimicking the process of shoemaking.

## Shapes

The shape language reflects the organic curves found in the logo's shoe illustration. 

- **Radius:** A consistent 0.5rem (8px) base radius is used for most UI components (cards, inputs, buttons).
- **Lg Radius:** A 1rem (16px) radius is reserved for larger image containers and featured promotional banners.
- **Buttons:** Use the standard 8px radius to feel professional yet friendly, avoiding the overly-industrial sharp corner or the overly-casual full pill shape.

## Components

- **Buttons:** Primary buttons use a solid dark brown fill in the light theme and light caramel fill in the dark theme, each with a contrasting foreground. Secondary buttons use a subtle brown or caramel border.
- **Input Fields:** Styled with a surface-container background and a soft brown or caramel border. Focus states use the primary color.
- **Cards:** Use a subtle brown or caramel border with a surface-container background. Product images within cards should have a consistent 4px internal margin to feel "framed."
- **Chips/Labels:** Used for material tags (e.g., "Seda", "Couro"). These use a caramel-tinted background with contrasting brown text.
- **Decorative Lines:** Inspired by the wavy lines in the logo, thin horizontal dividers can use a subtle "wave" SVG instead of a straight line to reinforce the brand's unique identity.
