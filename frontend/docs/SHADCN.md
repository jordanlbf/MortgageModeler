# shadcn/ui in MortgageModeler

Every UI control is a shadcn/ui component (Radix base) in `src/components/ui`,
themed by our tokens. This page lists the **custom variants** we added so v0
output and future work can reuse them instead of inventing new styles.

## How theming works

- `src/app/globals.css` maps every shadcn variable (`--primary`, `--card`,
  `--border`, `--ring`, `--chart-*`, `--sidebar-*`…) onto an existing `@theme`
  token. Our tokens are the source of truth; there are no colours in the bridge.
- The app is dark-only: the `dark:` variant always applies.
- Deliberately not taken from shadcn: its radius scale, its `--color-card`, and
  its base-layer `* { border-color; outline-color }` rule.

## Stock vs custom variants

Each component keeps shadcn's **stock** variants (`default`, `outline`,
`secondary`, `ghost`, `destructive`, `link`, …) with shadcn's own look and
default size, so code pasted from shadcn docs or v0 renders as designed.

Our **custom** variants reproduce this app's controls pixel-for-pixel. They get
only behaviour-level base classes (keyboard focus outline, disabled cursor) and
**no size classes** unless you pass `size`. Per-call-site layout (padding, font
size, gap) stays in `className`. See the header comment in `ui/button.tsx`.

Per-instance colours are CSS custom properties, not props:

```tsx
<Toggle variant="legend" style={{ "--legend-accent": SERIES.interest.color }} />
<Switch variant="accent" style={{ "--switch-accent": section.color }} />
```

`cn` merges like tailwind-merge (the last class in a group wins), so a
`className` overrides the variant. `asChild` (Radix Slot) only concatenates
classes, so put overrides on the shadcn component, not the child.

## Custom variants

### Button (`ui/button.tsx`)

| Variant | Look | Use for |
|---|---|---|
| `cta` | Brand-filled, brightens on hover | Primary step action (wizard Continue / Save / Calculate) |
| `cta-glow` | Brand-filled with glow, arrow slides on hover (`data-cta-arrow` child) | Auth submit buttons |
| `outline-action` | Subtle outline, filled hover | Page-header actions (Edit, Model new property) |
| `outline-subtle` | Hairline outline | Toolbar triggers (Edit Columns) |
| `outline-filled` / `outline-block` | Filled surface with outline; block is full width | Secondary auth actions (Google, "Use a different email") |
| `outline-icon` | Small outlined icon square | Year prev / next |
| `soft` | Surface fill, darker on hover | Low-emphasis full-width actions (drawer Reset) |
| `ghost-muted` | Text-only, muted | Back / Cancel |
| `ghost-brand` | Text-only, brand | Inline recovery ("Try again") |
| `ghost-icon` | Transparent icon button (flex) | Close, expand chevrons, focus mode |
| `icon-filled` / `icon-brand` / `icon-quiet` / `icon-subtle` / `tinted-icon` | Icon buttons: filled surface / brand fill / quiet hover / subtle / tinted by `--tint-accent` | Modal close / "+" new / sign-out & remove / sidebar chevron / scheme-card expand |
| `link-back` | 13px secondary link, arrow gap widens on hover | "← Back to sign in" |
| `link-back-footer` | Muted footer link with sliding arrow | "← All Tools" footers |
| `link-muted` / `link-subtle` / `link-quiet` | Text links at three emphasis levels | "Forgot?", "Sign in", "+ Add offset account" |
| `chip` | Small rounded chip | Quick-add presets |
| `disclosure` / `disclosure-row` | Section header / full-width row that toggles content | Collapsible headers and breakdown rows (use with `CollapsibleTrigger`) |
| `nav-item` / `nav-row` / `nav-utility` | Sidebar link, property row, footer utility link; active state via `aria-current` | Sidebar (use `asChild` on `Link`) |
| `nav-step` | Transparent overlay stretched over a row | Wizard step list |
| `legend-row` | Full-width legend row, `--legend-accent`, `data-highlighted`/`data-dimmed` | Chart legends that are clickable rows |

### Toggle / ToggleGroup (`ui/toggle.tsx`, `ui/toggle-group.tsx`)

Single-choice groups render `role="radio"` with arrow-key navigation; ignore an
empty `onValueChange` unless clearing is intended. Multiple groups stay
`role="button"` + `aria-pressed`.

| Variant | Look | Use for |
|---|---|---|
| `pill` | Rounded chip, accent when on; `data-tone="negative"` for red | Filter chips, Yes/No (Grants) |
| `choice` | Large choice button | Wizard property type / purchase status |
| `segment` | Icon segmented control | Chart / Table switch |
| `segment-pill` | Pill segmented control | Repayment frequency |
| `solid` | Solid fill when on | Overview / Details |
| `legend` | Legend chip with dot (`ToggleLegendDot`), `--legend-accent` | Chart series toggles |

### Tabs (`ui/tabs.tsx`)

Mouse clicks don't show the keyboard focus ring (handled in `TabsTrigger`).

| Variant | Look | Use for |
|---|---|---|
| `underline` | Text tabs with brand underline; callers add `capitalize`, list sits in a row with `pb-3 border-b border-border-subtle` | Page-level view switches (Cashflow dashboard) |
| `stat` | Tabs that show a label and a value, `--tab-accent` | Section strips with totals (Tax) |
| `track` | Pills in a recessed track | Mode switches (Quick estimate / Custom) |

### Inputs and forms

| Component | Variant | Use for |
|---|---|---|
| Input | `filled` | Default form field (wizard) |
| Input | `form` | Bordered form field (auth, purchase costs) |
| Input | `bar` | Compact centred field inside a filter bar (Grants) |
| Input | `ghost` | Click-to-edit value (`data-editing="true"` while editing) |
| Input | `underline` | Inline value with an underline (wizard editable rows) |
| NativeSelect | `form` | Native `<select>` matching `form` inputs (keeps the browser's own dropdown) |
| Label | `field` / `form` / `caps` | Field caption / form label / small-caps group caption |
| Label | `bare` | Wraps a Switch or Checkbox row without changing line height |
| Switch | `accent` / `glow` | Switch tinted by `--switch-accent` / brand switch with glow |
| Slider | `accent` | Hairline slider tinted by `--slider-accent` (see `domain/SliderField`) |
| Checkbox | `md` / `lg` | Wizard checkbox / column-drawer row checkbox |

### Surfaces and feedback

| Component | Variant | Use for |
|---|---|---|
| Card | `glass` | Raised translucent panel with hover lift (most tool cards) |
| Card | `panel` | Dashboard panels and table shells |
| Card | `auth` | Auth form card (`asChild` to render as `<form>`) |
| Card | `scheme` | Grant scheme card |
| Badge | `count` / `stat` / `tag` / `tinted` | Count bubble / rate pill (`--badge-accent`) / "Coming soon" tag / state tag |
| Progress | `bar` / `meter` | Wizard progress / password strength (`--progress-accent`) |
| Skeleton | `inline` | Inline loading block with explicit `width` / `height` |
| Dialog / Sheet | `bare` | Content with no stock padding or close button; bring your own layout (`DialogContent` also takes `portal={false}` / `overlay={false}`) |
| Table | `dense` | Data tables (Cashflow): `data-tone`, `data-divider`, `data-state="selected"`, sticky first column |
| Table | `bare` | Grid-laid-out table with explicit ARIA roles (Amortisation schedule) |

## Domain components (`src/components/domain`)

App-specific building blocks composed from `ui/`: `SliderField` (labelled,
click-to-edit slider), `EditableValue`, `ErrorBoundary`.

## Adding a component

1. `npx shadcn@latest add <name>` (Windows filenames are case-insensitive:
   check nothing in `components/ui` has the same name in PascalCase).
2. Theme it: keep the stock variants; add custom variants for our looks using
   tokens only (`text-fg-*`, `bg-surface-*`, `brand`…). Never hard-code colours.
3. Never install another UI library.

## Known exceptions

- The Cashflow property table's "Tax" header hint is a CSS hover hint, not a
  Radix Tooltip: the Radix portal renders text with greyscale antialiasing,
  which can't match. Documented in the component.
- Hovering a `NativeSelect form` hides its chevron. This is a pre-existing quirk
  kept for parity; documented in `ui/native-select.tsx`.
