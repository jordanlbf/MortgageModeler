# How I Design

Design process framework for MortgageModeler. Decisions in deliberate order: structure before style, hierarchy before colour, restraint before decoration. Informed by *Refactoring UI* (Wathan & Schoger).

> **On GitHub issues:** The Design section of an issue is not a pre-specified plan. It is filled in — or linked to a chosen prototype — after step 5 is complete. Do not commit to component structure, layout patterns, or visual details in an issue before a prototype exists.

### 1. Start with content
Write out what the screen needs before touching layout: data, actions, use cases. Plain text only. Save as `{page}-content.md` in `frontend/docs/`.

### 2. Establish hierarchy
Primary, secondary, tertiary. One focal point per screen. Decide explicitly before layout.

### 3. Layout in greyscale
Size, weight, spacing, contrast only. If it doesn't work in greyscale, colour won't fix it.

### 4. Start with too much whitespace
Tighten from excess, not from cramped.

### 5. Build HTML prototypes
Explore layout directions as self-contained `.html` files. No codebase involvement at this stage.

- Build 2–3 distinct directions if the layout has real uncertainty
- Each prototype is throwaway — optimise for speed of exploration, not code quality
- Pick one direction before proceeding to step 6
- The chosen prototype is the design decision artefact; reference or describe it in the GitHub issue

### 6. Apply the design system
Every value from the constrained scales in DESIGN.md. No arbitrary pixels. No new colours. Add to the system deliberately, not ad hoc.

### 7. Add colour from the palette
Reinforce hierarchy, don't create it. Every colour-dependent meaning gets a redundant signal.

### 8. Check light and elevation
Consistent light source. Top edge highlight, bottom shadow. Cards, buttons, inputs all lit from the same place.

### 9. Review
- **Squint test.** Can you identify the focal point instantly?
- **Greyscale test.** Desaturate — does everything still communicate?
- **System audit.** Every value from the scales?
