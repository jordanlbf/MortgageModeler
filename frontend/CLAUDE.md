# Frontend Conventions

### Stack
- Next.js 19 (App Router), React 19, TypeScript (strict), Tailwind CSS 4

### Directory Structure

```
frontend/src/
  app/<feature>/page.tsx      — route entry, imports the feature view
  components/
    <feature>/
      <Feature>View.tsx       — page-level layout, owns the state hook
      <Feature>*.tsx          — sub-components specific to this feature
    layout/                   — Header, ThemeToggle
    ui/                       — shared primitives (GlassCard, Slider, Skeleton, etc.)
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

### Styling Rules

- Use Tailwind utility classes for all styling
- Theme colours via `t.*` tokens from `lib/theme.ts` or Tailwind theme classes — never hardcoded hex
- `mix()` helper from `lib/theme.ts` for opacity/blend variants
- No component-local CSS files (legacy CSS files are being migrated)

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

