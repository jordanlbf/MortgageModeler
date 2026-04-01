## How I Design
 
Design process framework for MortgageModeler. Decisions are made in a deliberate order: structure before style, hierarchy before colour, restraint before decoration. Informed by *Refactoring UI* (Wathan & Schoger).
 
Engineering and process come more naturally to me than visual design, so I engineer my design process too. The steps below enforce a strict order that prevents me from jumping ahead to aesthetics before the foundations are solid.
 
### 1. Start with content
 
Write out what the screen needs before touching layout: what data is shown, what actions are available, what the user came here to do. Plain text only. 
 
### 2. Establish hierarchy
 
Decide what's primary, secondary, and tertiary. Every screen has one focal point: the thing the user's eye should land on first. Everything else supports it or stays out of the way. Make this decision explicitly before starting layout.
 
### 3. Layout in greyscale
 
Build the layout using only black, white, and shades of grey. This forces reliance on size, weight, spacing, and contrast to create hierarchy. If the design doesn't work in greyscale, colour won't fix it.
 
### 4. Start with too much whitespace
 
Give every element more room than it needs, then tighten. It's much easier to spot "that's too much space" than to notice "that needs a bit more." Cramped layouts are the fastest way to make something feel undesigned. Space can always be pulled back.
 
### 5. Apply the design system
 
Before reaching for any value (font size, spacing, colour, shadow, border), check the defined scales in this document. No arbitrary pixel values. No new colours. If the system doesn't have what's needed, add to the system deliberately, not to the component ad hoc.
 
### 6. Add colour from the palette
 
Colour comes last, pulled only from the defined ramps. Use colour to reinforce hierarchy that's already working, not to create it. Every use of colour to communicate meaning gets a redundant signal (icon, label, pattern) so the design works without colour too.
 
### 7. Check light and elevation
 
Every raised element gets a light top edge and bottom shadow. Every inset element inverts this. Check that the light source direction is consistent across the entire screen. Cards, buttons, sliders, and inputs should all feel lit from the same place.
 
### 8. Review
 
Before considering a design done, run three checks:
 
- **Squint test.** Blur eyes or step back from the screen. Can the primary focal point be identified instantly? If everything competes equally, the hierarchy has failed.
- **Greyscale test.** Screenshot the design and desaturate it. Does every element still communicate its meaning and importance? If something disappears or becomes ambiguous, the design is relying too heavily on colour.
- **System audit.** Check every value against the scales defined in this document. 