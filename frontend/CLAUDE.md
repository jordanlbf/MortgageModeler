# Frontend Conventions

### Stack
- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4
- shadcn/ui (Radix base) for every UI control, lucide-react icons, recharts charts

### Directory Structure

```
frontend/src/
  app/<feature>/page.tsx      — route entry, imports the feature view
  components/
    <feature>/
      <Feature>View.tsx       — page-level layout, owns the state hook
      <Feature>*.tsx          — sub-components specific to this feature
    layout/                   — AppShell, Sidebar, PageHeader
    ui/                       — shadcn/ui primitives, themed via tokens (button, card, tabs, …)
    domain/                   — app-specific components built from ui/ (SliderField, EditableValue, ErrorBoundary)
  hooks/
    use<Feature>State.ts      — form state + API call + derived data
    useApiCall.ts             — shared debounce + abort + { data, error, loading }
    useHighlight.ts           — shared hover/pin/dim logic
    useEditableInput.ts       — shared inline-edit behaviour
  lib/
    api.ts                    — typed API client (all fetch functions live here)
    formatters.ts             — currency/number formatting (single source of truth)
    theme.ts                  — theme tokens (t.*) and SERIES config
    types.ts                  — shared domain types
    <feature>-types.ts        — feature-specific types
    <feature>-calculations.ts — feature-specific pure functions
```

### Feature Module Pattern

Every feature should follow this structure:

1. **State hook** (`use<Feature>State`) returns `{ data, error, loading, inputs, setters }` using `useApiCall` for the fetch layer
2. **Error display** — every view renders `error` in a styled banner:
   ```tsx
   {error && (
     <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[14px] text-red-400/80">
       {error}
     </div>
   )}
   ```
3. **Loading state** — use `Skeleton` components or equivalent while `loading` is true
4. **Leaf components** wrapped in `React.memo()` if they receive callbacks

### UI Components (shadcn/ui)

- UI primitives are shadcn/ui components in `components/ui`, themed via our tokens:
  every shadcn CSS variable is mapped onto an existing token in `globals.css`.
- Domain components live in `components/domain` and compose `ui/` parts.
- Never hand-roll a control (raw `<button>`, `<input>`, `<select>`, `<table>`, dialog,
  tabs, tooltip…) in a feature folder — use the shadcn component and a variant.
- Our looks are **custom variants** (e.g. `<Button variant="cta">`, `<Card variant="glass">`,
  `<Tabs variant="underline">`, `<ToggleGroup>` + `<Toggle variant="pill">`). They're listed,
  with when to use each, in `docs/SHADCN.md`. Reuse one before adding another.
- Stock variants (`default`, `outline`, `ghost`…) keep shadcn's look and sizes; custom
  variants carry no size classes. Per-instance colours go in CSS custom properties
  (`style={{ "--pill-accent": color }}`), not props.
- Adding a component: `npx shadcn@latest add <name>` (check for a PascalCase file with the
  same name first — Windows is case-insensitive), then theme it with tokens and add any
  custom variants to the component file. Never install another UI library.
- v0 output should use these components and variants; replace any raw colours it emits
  with tokens.
- Visual regression: `npm run test:visual` (needs the dev stack running) compares against
  `docs/design/_baseline`. Re-record only deliberate design changes.

### Styling Rules

- Use Tailwind utility classes for all styling
- Theme colours via `t.*` tokens from `lib/theme.ts` or Tailwind theme classes — never hardcoded hex
- `mix()` helper from `lib/theme.ts` for opacity/blend variants
- No component-local CSS files; keep `globals.css` to tokens and genuinely global utilities

### Formatting & Parsing

- All currency formatting goes through `lib/formatters.ts`
- Never define local `parseCurrency` / `formatCurrency` in components
- `parseCurrencyInput` — form string to number (safe, returns 0)
- `formatDollars` — display with `$`, empty on 0
- `formatDollarsSigned` — display with unicode minus `−$` for negatives
- `formatCurrencyShort` — `Intl.NumberFormat`, no decimals
- `formatCurrency` — `Intl.NumberFormat`, 2 decimals

### API Layer

- All fetch functions live in `lib/api.ts` with typed request/response interfaces
- Never use raw `fetch()` in components — always go through `lib/api.ts`
- All hooks use `useApiCall` for debounce + abort + error handling
- Shared types (e.g. `StepId`, `ViewMode`) live in `lib/<feature>-types.ts`

### Accessibility

- Range inputs: `aria-label` + `aria-valuetext`
- Toggle buttons: `aria-pressed`
- Decorative SVGs: `role="img"` + `aria-label`
- Interactive SVGs: keyboard support

