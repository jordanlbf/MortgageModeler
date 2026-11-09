# Kitchen sink (`/kitchen-sink`)

## Purpose

An internal gallery of the design system, in six layers. Each layer has its own page and is built only from the layers before it:

| # | Layer | Page | What it holds | Edit |
|---|---|---|---|---|
| 1 | Foundations | `/kitchen-sink` | Type scale, colours, surfaces | Tokens in `src/app/globals.css` |
| 2 | Primitives | `/kitchen-sink/primitives` | shadcn controls and their variants, raw card surfaces, tables, overlays, skeletons | `src/components/ui/*` |
| 3 | Blocks | `/kitchen-sink/blocks` | Pieces that sit inside a card: titles and captions, numbers (`Stat`), lists (`KeyValueList`), alerts | `src/components/patterns/blocks/*` |
| 4 | Cards | `/kitchen-sink/cards` | Blocks in a box: `SectionCard` in every shape, KPI cards (`StatCard`), empty states | `src/components/patterns/cards/*` |
| 5 | Layouts | `/kitchen-sink/layouts` | Whole-page arrangements of cards: calculator, dashboard | `src/components/patterns/layouts/*` |
| 6 | Screens | `/kitchen-sink/screens` | The polished screens (Cashflow wizard and output, Purchase Costs, Tax, Amortisation), rendered by the app's own components on generic sample data | `src/components/{cashflow,purchase-costs,tax,amortisation}/*`, or the layer below that owns the piece |

Pages use the same files, so a change at any layer shows up in the gallery, on every page that uses it, and in every layer above it. For example, a change to `Stat` (a block) updates KPI cards (cards) and the dashboard layout, plus "Cash needed" and the Cashflow tiles in the app.

Primitives use realistic MortgageModeler data (worst-case values, QLD properties) to catch drift. Blocks, cards and layouts use generic dummy content, because they exist to tune the look. Screens use generic sample data too (round numbers on simple growth curves, `sections/screens-sample.ts`), passed in place of the API.

It's dense and label-first on purpose. No hero, no intro copy; documentation lives here.

## Access

| Environment | `/kitchen-sink` |
|---|---|
| `next dev` | Always on (all six pages) |
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
  layout.tsx            bare layout: no app shell, noindex
  page.tsx              1 Foundations
  primitives/page.tsx   2 Primitives
  blocks/page.tsx       3 Blocks
  cards/page.tsx        4 Cards
  layouts/page.tsx      5 Layouts
  screens/page.tsx      6 Screens
  sections.ts           typed registry: one section list per layer, and PAGES (in order)
  sections/*.tsx        one file per section, independently importable
  sections/seed.ts      realistic sample data for primitives
  sections/dummy.tsx    generic dummy content for blocks, cards and layouts
  sections/screens.tsx  the real screens on sample data (no styling of their own)
  sections/screens-sample.ts  generic sample data for the screens
  _components/          SinkPage (layer switcher + nav + sections), SinkSection, VariantRow, SinkNav, Specimen
  __tests__/            render, env gating, per-section snapshots, axe on every page

src/components/patterns/
  blocks/               SectionTitle, InfoTip, Stat (+ StatDelta), KeyValueList (+ KeyValueRow), InlineAlert
  cards/                SectionCard, StatCard, PageBar, EmptyState
  layouts/              CalculatorLayout, DashboardLayout
  __tests__/layers.test.ts   each layer imports only from earlier layers
```

The Blocks page shows blocks on a plain `Specimen` surface, not in a card, so it never depends on the Cards layer.

## Tuning the look

| To change | Edit | Reaches |
|---|---|---|
| A colour, surface, radius or shadow | Token in `src/app/globals.css` | Everything using the token |
| A control (button, input, badge, switch) | Its variant in `src/components/ui/*` | Every use of that variant |
| Card titles | `blocks/SectionTitle.tsx` | Every `SectionCard` title, Tax card titles |
| Small caps captions | `Label variant="caps"` in `ui/label.tsx` | `Stat` captions, form field captions |
| Headline numbers and change arrows | `blocks/Stat.tsx` | KPI cards, cash needed, Cashflow equity / loan tiles |
| Label / value breakdowns | `blocks/KeyValueList.tsx` | Purchase Costs loan facts, Cashflow breakdowns and year summary |
| Field help (the "i" beside a label) | `blocks/InfoTip.tsx` | Tax income field and question help |
| Error / warning / info banners | `blocks/InlineAlert.tsx` | Every view's API error, sign in / sign up errors |
| Card box: padding, radius, surface, header | `cards/SectionCard.tsx` | Every card, including KPI cards |
| Page top bar (tool name, page title, page actions) | `cards/PageBar.tsx` | Cashflow |
| How a number sits in a KPI card | `cards/StatCard.tsx` | Every KPI card |
| Empty states | `cards/EmptyState.tsx` | Kitchen sink (no page has one yet) |
| Big $ amount fields, deposit slider and % chip | `domain/AmountSection.tsx` | Purchase Costs inputs |
| Calculator page: input column width, gaps, breakpoint | `layouts/CalculatorLayout.tsx` | Purchase Costs |
| Dashboard page: KPI strip, side panel, gaps | `layouts/DashboardLayout.tsx` | Kitchen sink (no page uses it yet) |
| A whole screen's arrangement (Cashflow wizard / output, Purchase Costs) | `components/cashflow/*`, `components/purchase-costs/*` | That screen, in the app and on the Screens page |

Edit the shared file, not the dummy section: the dummies only show what the shared files produce.

**Cards** are the most common composite, so the Section cards section covers every shape the app needs from one `SectionCard`: header (title, description, action), `size="default"`/`"sm"`, `flush` bodies (divided sections, tables), common contents (stat, list, chart, form) and cards in a grid. If a page needs a card shape that isn't there, add it to `SectionCard` and to this section rather than styling a one-off.

Not on the patterns yet (each has a deliberately distinct look): the Amortisation KPI and loan-control cards, the Tax rate pills and waterfall, and grant scheme cards. Move them over (Amortisation KPIs to `StatCard`) when their design is meant to match the rest. Cashflow is on the patterns: `PageBar` on top, then the wizard or one flush `SectionCard` dashboard (tabs, divided KPI row of `Stat`s, chart beside a `KeyValueList` breakdown).

## Screens: iterating on whole pages (v0 etc.)

The Screens page shows each polished screen exactly as the app renders it, because it **is** the app's code: `CashflowScreen` and `PurchaseCostsView` take an optional `source` (sample form values and data) that replaces the API, and the app passes nothing. So a tool like v0 can iterate on `/kitchen-sink/screens`, and any change it makes lands in the app, as long as the change goes into the shared files, not the kitchen sink:

- Change the screen's components (`src/components/cashflow/*`, `src/components/purchase-costs/*`) or the layer that owns the piece (a card → `patterns/cards`, a control → `components/ui`, a colour → `globals.css`).
- Never restyle inside `sections/screens.tsx`; it only renders the screens. Never copy a screen into the kitchen sink.
- `screens-sample.ts` is placeholder data. Change it only to show a state (e.g. a negative cashflow), not to change the look.

Only polished screens belong here (Cashflow and Purchase Costs today). When another feature is redesigned, give its view a `source` the same way and add it as a section.

## Iterating with v0

v0 gets the kitchen sink on its own, not the whole repo, and only its visual changes come back.

1. `npm run v0:export` writes `v0-export.zip` (and the same files in `v0-export/`, both git-ignored): every file the kitchen sink imports, at the same paths as the app, plus config, these docs and `V0.md` (the brief v0 reads). The root layout is a bare one (no login) and `/` opens `/kitchen-sink/screens`. The file list is worked out from the imports each time, so it never goes stale.
2. Upload the zip to v0 and ask for visual improvements. It runs with `npm install && npm run dev`; no backend needed.
3. Download v0's project and run `npm run v0:import <zip or folder>` (add `-- --dry-run` to preview). It compares against the export's fingerprints (`.v0-manifest.json`) and:
   - **applies** changes and new files under the visual paths: `src/app/globals.css`, `src/components/{ui,patterns,domain,cashflow,purchase-costs,tax,amortisation}/`;
   - **saves to `v0-incoming/` for review, never applies**: anything else (hooks, lib, the kitchen sink and its sample data, config), and **conflicts** (files you also changed since the export);
   - **lists only**: files v0 deleted, and new or changed packages (add those by hand).
4. **Every import gets a review (Claude does this each time):** read the whole diff of the applied files for anything that isn't visual (logic, data flow, props, removed accessibility) and back those parts out; check `v0-incoming/` and say whether anything there is worth porting by hand; then run `npx tsc --noEmit`, `npm run lint`, `npm test` and the visual tests, re-record baselines only for the intended changes, and commit. The visual paths limit where v0 can write, not what it writes, so this review is the real guard.

Export again after merging so v0's next round starts from the current app. The visual paths live in `scripts/v0-lib.mjs` (`VISUAL_PATHS`), and the brief in `scripts/v0-export.mjs`.

## Maintenance rule

**Every new design-system primitive or variant goes into the kitchen sink in the same PR.** That covers a new `components/ui` component, a new variant on an existing one, a new block, card or layout in `components/patterns` (in the right layer folder), or a new reusable domain component.

When a page needs a titled card, a headline number, a breakdown list, a banner or an empty state, use the pattern rather than restyling one by hand; otherwise tuning the pattern won't reach it.

Add this to the PR description:

- [ ] New or changed primitives/variants are shown in `/kitchen-sink`
- [ ] Section snapshots updated deliberately (`npx vitest run src/app/kitchen-sink -u`)

## Section ownership

| Page | Section | File | Covers |
|---|---|---|---|
| Foundations | Typography | `typography.tsx` | Type scale, `Label` variants |
| | Colors | `colors.tsx` | Foreground, brand, data, status, surface and border tokens |
| Primitives | Buttons | `buttons.tsx` | Stock variants x sizes, disabled, loading, icon sizes, every custom variant |
| | Inputs | `inputs.tsx` | `Input` variants x states, currency/percent, password, helper text, `EditableValue`, `MoneyInput`, `UnitInput`, `SliderField`, `AmountSection` / `PercentChip` |
| | Selects and toggles | `selects-and-toggles.tsx` | `NativeSelect`, `Checkbox`, `Switch`, `ToggleGroup`/`Toggle`, `Tabs`, `Slider` |
| | Badges and tags | `badges.tsx` | Stock and custom `Badge` variants, property tags |
| | Card surfaces | `card-variants.tsx` | Raw `Card`: `panel`, `glass`, `scheme`, `auth`, `default` |
| | Tables | `tables.tsx` | Empty, 1 row, 5 rows, truncation, sort indicators, `dense` with pinned column, skeleton |
| | Overlays | `overlays.tsx` | Confirm `Dialog`, `Tooltip`, `Popover`, `Sheet` |
| | Loading states | `loading-states.tsx` | `Skeleton`, KPI/table/chart skeletons, spinner, `Progress` |
| Blocks | Titles and captions | `titles.tsx` | `SectionTitle` variants, caps caption |
| | Numbers | `numbers.tsx` | `Stat` sizes and tones, `StatDelta`, delta / action / children |
| | Lists | `lists.tsx` | `KeyValueList` / `KeyValueRow`: sizes, divided, totals, tones, grouped |
| | Alerts and banners | `alerts.tsx` | `InlineAlert` tones and wrapping, full-width banner |
| Cards | Section cards | `cards.tsx` | `PageBar`; `SectionCard`: header options, sizes, flush, common contents, grid |
| | KPI cards | `kpi-cards.tsx` | `StatCard`: tones, action, delta, subtitle, sparkline, null, loading |
| | Empty states | `empty-states.tsx` | `EmptyState`: no data, no results, error, coming soon |
| Layouts | Calculator | `calculator.tsx` | `CalculatorLayout` with dummy cards |
| | Dashboard | `dashboard.tsx` | `DashboardLayout` with KPI strip, main cards and side panel |
| Screens | Cashflow · wizard / output, Purchase Costs · calculator, Tax · calculator, Amortisation · calculator | `screens.tsx` | `CashflowScreen` (empty wizard; finished output), `PurchaseCostsView`, `TaxView`, `AmortisationView`, on `screens-sample.ts` |

When you add a section, add it to its layer's list in `sections.ts`; the nav, tests and snapshots pick it up.

## Gaps (not in the design system yet)

The issue that introduced this page (#115) listed some primitives the app doesn't have. They're left out rather than invented here:

- **Combobox, radio group, textarea, toast**: no shadcn component installed yet. Add with `npx shadcn@latest add <name>` when a feature needs one, then add it here.
- **Spinner**: no primitive; the page shows lucide's `Loader2` with `animate-spin`, which is what the app uses.
- **Monospace type**: the app is Sora-only; numbers use `tabular-nums`.

Drift the page surfaced when it was built (worth fixing separately):

- Most custom `Button` variants (`soft`, `outline-action`, `outline-subtle`, `ghost-muted`, `link-*`) look the same when `disabled`.
- Custom `Input` variants (`form`, `filled`, `bar`, `underline`) have no `aria-invalid` (error) or `disabled` styling; only the stock `default` variant does.
