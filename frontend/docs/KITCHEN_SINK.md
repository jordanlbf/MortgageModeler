# Kitchen sink (`/kitchen-sink`)

## Purpose

One internal page that renders every design-system primitive and its variants, with realistic MortgageModeler data. Use it to:

- **Catch design drift:** a variant that no longer matches its siblings shows up next to them.
- **Build pages faster:** find the variant you need, copy the markup, swap in real content. Each row's label is the prop to use (e.g. `variant="cta"`).
- **Have one source of truth** for what exists. `docs/SHADCN.md` explains each variant; this page shows it.

It's dense and label-first on purpose. No hero, no intro copy, no prose in the route; documentation lives here.

## Access

| Environment | `/kitchen-sink` |
|---|---|
| `next dev` | Always on |
| Production build (`NODE_ENV=production`, including Vercel previews) | 404 unless `NEXT_PUBLIC_SHOW_KITCHEN_SINK=true` |

Set the flag in the Vercel **Preview** environment only. The gate is `src/proxy.ts` (Next 16's replacement for `middleware.ts`), matched only on `/kitchen-sink`, using `isKitchenSinkEnabled()` from `src/lib/kitchen-sink-gate.ts`.

To check the gate locally:

```sh
npm run build && npx next start                                  # /kitchen-sink → 404
NEXT_PUBLIC_SHOW_KITCHEN_SINK=true npx next start                # /kitchen-sink → 200
```

## Structure

```
src/app/kitchen-sink/
  layout.tsx          bare layout: no app shell, noindex
  page.tsx            nav + sections
  sections.ts         typed registry (id, title, component), in page order
  sections/*.tsx      one file per section, independently importable
  sections/seed.ts    shared sample data (worst-case values, QLD properties)
  components/         SinkSection (anchor + header), VariantRow (label | variants), SinkNav (sticky, scroll-spy)
  __tests__/          render, env gating, per-section snapshots, axe
```

## Maintenance rule

**Every new design-system primitive or variant goes into the kitchen sink in the same PR.** That covers a new `components/ui` component, a new variant on an existing one, or a new reusable domain component.

Add this to the PR description:

- [ ] New or changed primitives/variants are shown in `/kitchen-sink`
- [ ] Section snapshots updated deliberately (`npx vitest run src/app/kitchen-sink -u`)

## Section ownership

| Section | File | Covers |
|---|---|---|
| Typography | `typography.tsx` | Type scale, `Label` variants |
| Colors | `colors.tsx` | Foreground, brand, data, status, surface and border tokens |
| Buttons | `buttons.tsx` | Stock variants × sizes, disabled, loading, icon sizes, every custom variant |
| Inputs | `inputs.tsx` | `Input` variants × states, currency/percent, password, helper text, `EditableValue`, `SliderField` |
| Selects and toggles | `selects-and-toggles.tsx` | `NativeSelect`, `Checkbox`, `Switch`, `ToggleGroup`/`Toggle`, `Tabs`, `Slider` |
| KPI cards | `kpis.tsx` | Value, delta, subtitle, sparkline, null, loading |
| Tables | `tables.tsx` | Empty, 1 row, 5 rows, truncation, sort indicators, `dense` with pinned column, skeleton |
| Badges and tags | `badges.tsx` | Stock and custom `Badge` variants, property tags |
| Feedback | `feedback.tsx` | Inline alerts, banner, confirm `Dialog`, `Tooltip`, `Popover`, `Sheet` |
| Empty states | `empty-states.tsx` | No data, no results, error, coming soon |
| Loading states | `loading-states.tsx` | `Skeleton`, KPI/table/chart skeletons, spinner, `Progress` |

When you add a section, add it to `sections.ts`; the nav, tests and snapshots pick it up.

## Gaps (not in the design system yet)

The issue that introduced this page (#115) listed some primitives the app doesn't have. They're left out rather than invented here:

- **Combobox, radio group, textarea, toast**: no shadcn component installed yet. Add with `npx shadcn@latest add <name>` when a feature needs one, then add it here.
- **Spinner**: no primitive; the page shows lucide's `Loader2` with `animate-spin`, which is what the app uses.
- **Monospace type**: the app is Sora-only; numbers use `tabular-nums`.

Drift the page surfaced when it was built (worth fixing separately):

- Most custom `Button` variants (`soft`, `outline-action`, `outline-subtle`, `ghost-muted`, `link-*`) look the same when `disabled`.
- Custom `Input` variants (`form`, `filled`, `bar`, `underline`) have no `aria-invalid` (error) or `disabled` styling; only the stock `default` variant does.
