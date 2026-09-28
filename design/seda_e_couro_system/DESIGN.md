---
name: Seda e Couro System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fe'
  surface-container: '#ebeef8'
  surface-container-high: '#e5e8f3'
  surface-container-highest: '#dfe2ed'
  on-surface: '#181c23'
  on-surface-variant: '#444652'
  inverse-surface: '#2c3038'
  inverse-on-surface: '#eef0fb'
  outline: '#747683'
  outline-variant: '#c4c6d4'
  surface-tint: '#3759b3'
  primary: '#002c7c'
  on-primary: '#ffffff'
  primary-container: '#1d439c'
  on-primary-container: '#a0b6ff'
  inverse-primary: '#b4c5ff'
  secondary: '#605e59'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2db'
  on-secondary-container: '#66645f'
  tertiary: '#18325c'
  on-tertiary: '#ffffff'
  tertiary-container: '#314974'
  on-tertiary-container: '#a1b9eb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#194099'
  secondary-fixed: '#e6e2db'
  secondary-fixed-dim: '#c9c6bf'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#484742'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#afc7fa'
  on-tertiary-fixed: '#001b3f'
  on-tertiary-fixed-variant: '#2e4772'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#dfe2ed'
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

- **Primary (Cobalt Blue):** Extracted from the logo’s line art. This is used for key actions, brand accents, and structural borders to maintain a strong visual link to the illustration style.
- **Secondary (Warm Linen):** A soft, off-white background color that provides a more organic and premium feel than pure white. It serves as the primary canvas for the UI.
- **Tertiary (Dusty Blue):** A muted, lighter blue used for secondary backgrounds, hover states, and illustrative accents to add depth without increasing visual noise.
- **Neutral (Slate Carbon):** A high-contrast dark tone for typography and icons, ensuring maximum legibility while feeling softer and more intentional than pure black.

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

- **Tonal Layers:** Using the Secondary (Linen) for the main page and a slightly darker or lighter variant (Tertiary Blue at 5% opacity) for container surfaces.
- **Low-Contrast Outlines:** Elements like cards and inputs use subtle 1px borders in the Primary Blue (at 20% opacity) instead of shadows.
- **Intentional Overlaps:** Images may slightly overlap container edges to create a sense of physical, layered materials, mimicking the process of shoemaking.

## Shapes

The shape language reflects the organic curves found in the logo's shoe illustration. 

- **Radius:** A consistent 0.5rem (8px) base radius is used for most UI components (cards, inputs, buttons).
- **Lg Radius:** A 1rem (16px) radius is reserved for larger image containers and featured promotional banners.
- **Buttons:** Use the standard 8px radius to feel professional yet friendly, avoiding the overly-industrial sharp corner or the overly-casual full pill shape.

## Components

- **Buttons:** Primary buttons use a solid Primary Blue fill with Secondary (Linen) text. Secondary buttons use a Primary Blue 1px border and Primary Blue text.
- **Input Fields:** Styled with a Secondary (Linen) background and a soft Primary Blue border. Focus states should slightly thicken the border.
- **Cards:** Use a 1px Primary Blue border (low opacity) with a Secondary (Linen) background. No shadow. Product images within cards should have a consistent 4px internal margin to feel "framed."
- **Chips/Labels:** Used for material tags (e.g., "Seda", "Couro"). These use the Tertiary Blue as a soft background with Primary Blue text to indicate categories without high visual weight.
- **Decorative Lines:** Inspired by the wavy lines in the logo, thin horizontal dividers can use a subtle "wave" SVG instead of a straight line to reinforce the brand's unique identity.