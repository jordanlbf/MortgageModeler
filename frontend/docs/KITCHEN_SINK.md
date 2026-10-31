# Kitchen sink (`/kitchen-sink`)

## Purpose

Two internal pages that render the design system:

- **Primitives** (`/kitchen-sink`): every `components/ui` control and variant, plus the tokens, with realistic MortgageModeler data.
- **Components** (`/kitchen-sink/components`): the shared patterns in `components/patterns` (cards first) with dummy content, plus a whole dummy page built from them.

A switcher at the top moves between them. Use them to:

- **Catch design drift:** a variant that no longer matches its siblings shows up next to them.
- **Build pages faster:** find the variant you need, copy the markup, swap in real content. Each row's label is the prop to use (e.g. `variant="cta"`).
- **Have one source of truth** for what exists. `docs/SHADCN.md` explains each variant; this page shows it.

- **Tune the look of the whole app:** the **Components** page shows the shared building blocks in `src/components/patterns/` with dummy content. Pages use the same components, so editing one (or a `components/ui` variant, or a token in `globals.css`) changes it here and on every page at once. See [Tuning the look](#tuning-the-look).

It's dense and label-first on purpose. No hero, no intro copy, no prose in the route; documentation lives here.

## Access

| Environment | `/kitchen-sink` |
|---|---|
| `next dev` | Always on (both pages) |
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
  page.tsx            Primitives page
  components/page.tsx Components page
  sections.ts         typed registry: PRIMITIVES, COMPONENTS, PAGES (in page order)
  sections/*.tsx      one file per section, independently importable
  sections/seed.ts    realistic sample data for primitives (worst-case values, QLD properties)
  sections/dummy.tsx  generic dummy content for components (line items, placeholder boxes)
  _components/        SinkPage (switcher + nav + sections), SinkSection, VariantRow, SinkNav (sticky, scroll-spy)
  __tests__/          render, env gating, per-section snapshots, axe
```

## Tuning the look

Where to edit, depending on what you want to change:

| To change… | Edit | Reaches |
|---|---|---|
| A colour, surface, radius or shadow | Token in `src/app/globals.css` | Everything using the token |
| A control (button, input, badge, switch…) | Its variant in `src/components/ui/*` | Every use of that variant |
| Titled cards (padding, radius, surface, title type) | `patterns/SectionCard.tsx` (`SectionCard`, `SectionTitle`) | Purchase Costs cards, Tax card titles |
| Headline numbers and KPI tiles | `patterns/Stat.tsx` (`Stat`, `StatDelta`) | Cash needed, Cashflow equity / loan tiles |
| Label / value breakdowns | `patterns/KeyValueList.tsx` | Purchase Costs loan facts, Cashflow breakdowns and year summary |
| Error / warning / info banners | `patterns/InlineAlert.tsx` | Every view's API error, sign in / sign up errors |
| Empty states | `patterns/EmptyState.tsx` | Kitchen sink (no page has one yet) |
| Small caps captions | `Label variant="caps"` in `ui/label.tsx` | `Stat` captions and form field captions |

Edit the shared file, not the dummy section: the dummies only show what the shared files produce.

**Cards** are the most common composite, so the Cards section covers every shape the app needs from one `SectionCard`: header (title, description, action), `size="default"`/`"sm"`, `flush` bodies (divided sections, tables), common contents (stat, list, chart, form) and cards in a grid. If a page needs a card shape that isn't there, add it to `SectionCard` and to this section rather than styling a one-off.

Not on the patterns yet (each has a deliberately distinct look): the Amortisation KPI and loan-control cards, the Tax rate pills and waterfall, the Cashflow chart and year-panel headers, and grant scheme cards. Move them over when their design is meant to match the rest.

## Maintenance rule

**Every new design-system primitive or variant goes into the kitchen sink in the same PR.** That covers a new `components/ui` component, a new variant on an existing one, a new pattern in `components/patterns`, or a new reusable domain component.

When a page needs a titled card, a headline number, a breakdown list, a banner or an empty state, use the pattern rather than restyling one by hand; otherwise tuning the pattern won't reach it.

Add this to the PR description:

- [ ] New or changed primitives/variants are shown in `/kitchen-sink`
- [ ] Section snapshots updated deliberately (`npx vitest run src/app/kitchen-sink -u`)

## Section ownership

**Primitives** (`/kitchen-sink`)

| Section | File | Covers |
|---|---|---|
| Typography | `typography.tsx` | Type scale, `Label` variants |
| Colors | `colors.tsx` | Foreground, brand, data, status, surface and border tokens |
| Buttons | `buttons.tsx` | Stock variants × sizes, disabled, loading, icon sizes, every custom variant |
| Inputs | `inputs.tsx` | `Input` variants × states, currency/percent, password, helper text, `EditableValue`, `SliderField` |
| Selects and toggles | `selects-and-toggles.tsx` | `NativeSelect`, `Checkbox`, `Switch`, `ToggleGroup`/`Toggle`, `Tabs`, `Slider` |
| Badges and tags | `badges.tsx` | Stock and custom `Badge` variants, property tags |
| Card variants | `card-variants.tsx` | Raw `Card` surfaces: `panel`, `glass`, `scheme`, `auth`, `default` |
| Tables | `tables.tsx` | Empty, 1 row, 5 rows, truncation, sort indicators, `dense` with pinned column, skeleton |
| Overlays | `overlays.tsx` | Confirm `Dialog`, `Tooltip`, `Popover`, `Sheet` |
| Loading states | `loading-states.tsx` | `Skeleton`, KPI/table/chart skeletons, spinner, `Progress` |

**Components** (`/kitchen-sink/components`)

| Section | File | Covers |
|---|---|---|
| Cards | `cards.tsx` | `SectionCard`: header options, sizes, flush, common contents, grid |
| Numbers and KPIs | `stats.tsx` | `Stat` sizes and tones, `StatDelta`, KPI cards (value, delta, subtitle, sparkline, null, loading) |
| Lists | `lists.tsx` | `KeyValueList` / `KeyValueRow`: sizes, divided, totals, tones, grouped |
| Alerts and banners | `alerts.tsx` | `InlineAlert` tones and wrapping, full-width banner |
| Empty states | `empty-states.tsx` | `EmptyState`: no data, no results, error, coming soon |
| Example page | `example-page.tsx` | A whole dummy page built only from the patterns |

When you add a section, add it to `PRIMITIVES` or `COMPONENTS` in `sections.ts`; the nav, tests and snapshots pick it up.

## Gaps (not in the design system yet)

The issue that introduced this page (#115) listed some primitives the app doesn't have. They're left out rather than invented here:

- **Combobox, radio group, textarea, toast**: no shadcn component installed yet. Add with `npx shadcn@latest add <name>` when a feature needs one, then add it here.
- **Spinner**: no primitive; the page shows lucide's `Loader2` with `animate-spin`, which is what the app uses.
- **Monospace type**: the app is Sora-only; numbers use `tabular-nums`.

Drift the page surfaced when it was built (worth fixing separately):

- Most custom `Button` variants (`soft`, `outline-action`, `outline-subtle`, `ghost-muted`, `link-*`) look the same when `disabled`.
- Custom `Input` variants (`form`, `filled`, `bar`, `underline`) have no `aria-invalid` (error) or `disabled` styling; only the stock `default` variant does.
