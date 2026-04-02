# How I Design

Design process framework for MortgageModeler. Decisions in deliberate order: structure before style, hierarchy before colour, restraint before decoration. Informed by *Refactoring UI* (Wathan & Schoger).

### 1. Start with content
Write out what the screen needs before touching layout: data, actions, use cases. Plain text only.

### 2. Establish hierarchy
Primary, secondary, tertiary. One focal point per screen. Decide explicitly before layout.

### 3. Layout in greyscale
Size, weight, spacing, contrast only. If it doesn't work in greyscale, colour won't fix it.

### 4. Start with too much whitespace
Tighten from excess, not from cramped.

### 5. Apply the design system
Every value from the constrained scales in DESIGN.md. No arbitrary pixels. No new colours. Add to the system deliberately, not ad hoc.

### 6. Add colour from the palette
Reinforce hierarchy, don't create it. Every colour-dependent meaning gets a redundant signal.

### 7. Check light and elevation
Consistent light source. Top edge highlight, bottom shadow. Cards, buttons, inputs all lit from the same place.

### 8. Review
- **Squint test.** Can you identify the focal point instantly?
- **Greyscale test.** Desaturate — does everything still communicate?
- **System audit.** Every value from the scales?
