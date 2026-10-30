# shadcn/ui Migration Inventory

This inventory drives the move from hand-rolled primitives to shadcn/ui (Radix base). The goal is **exact visual parity**: every replacement must render pixel-identically, which the Playwright suite in `e2e/visual.spec.ts` checks.

- Scope: `src/components/**` and `src/app/**` as of branch `feat/purchase-costs-polish` (commit `4330c94`).
- Line numbers point at the opening tag or definition and were checked against the source.
- Status: shadcn is **not installed yet**. `package.json` has no `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` or `components.json`.

Legend for "Replacement" columns:

- `Button/<variant>` means shadcn `Button` with that custom variant. `asChild` means it wraps a Next `<Link>`.
- `ToggleGroup/<variant>` means shadcn ToggleGroup, with `single` or `multiple` noted.
- `Tabs/<variant>` means shadcn Tabs, used when the control switches between content panes.
- **KEEP** means it stays custom: data-viz, or no reasonable shadcn equivalent.

---

## 0. Pre-flight: global setup risks (read first)

These risks apply to the whole app before any single component is swapped.

| # | Risk | Detail | Recommendation |
|---|------|--------|----------------|
| G1 | **`--color-card` collision** | `globals.css:35` already defines `--color-card: rgba(24,24,27,0.80)`. It is used as `bg-card` in `CashflowDashboard.tsx:288/448/564`, `CashflowDataTable.tsx:147`, and as `var(--color-card)` in `AuthCard`, `Sidebar` and `ColumnDrawer` (via `t.card.base`). shadcn's `@theme inline` block also emits `--color-card: var(--card)`. | Set `--card: rgba(24,24,27,0.80)` (or `var(--color-card)` before the shadcn block) so the value doesn't change. Do the same mapping for every shadcn semantic var (see the G4 table). |
| G2 | **Undefined tokens that shadcn would suddenly define** | These classes are no-ops today because no theme var exists: `bg-border` (`KpiTile.tsx:13`, `PurchaseCostsView.tsx:257`, the deposit/costs divider, which is currently **invisible**), `caret-accent` (`EditableValue.tsx:26`, `GrantsView.tsx:54`), `border-t-accent-border` (`GrantsView.tsx:151`), `bg-subtle` (`PurchaseCostsView.tsx:28`, `AmortisationTable.tsx:36`), `border-strong` (`wizard/shared.tsx:119`), `border-default` (`PurchaseCostsView.tsx:265`). shadcn adds `--color-border` and `--color-accent`, so `bg-border` and `caret-accent` would start rendering. | Before init, decide per class: either keep the no-op (rename the class to a real token, or delete it) or fix it on purpose and update the snapshots. Don't let shadcn change these silently. |
| G3 | **shadcn base layer** | `@layer base { * { @apply border-border outline-ring/50 } body { @apply bg-background text-foreground } }` changes the default border colour. Tailwind 4 preflight uses `currentColor`, which every bare `border`/`border-b` with no colour class depends on. It also changes focus outlines on every element. | **Omit the `*` rule** from the shadcn CSS, or set `--border` so it reproduces the current look, then audit. Keep body colours on the existing `--color-surface-app` / `--color-fg-primary`. |
| G4 | Token mapping | shadcn components reference `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-muted-foreground`, `border-input`, `ring-ring`, `bg-popover` and so on. | Map them in `:root`/`.dark`: `--background`→surface-app `#09090b`, `--foreground`→fg-primary, `--primary`→brand `#34d399`, `--primary-foreground`→brand-contrast `#022c22`, `--border`→border-default, `--input`→input-bg, `--ring`→focus-ring, `--card`→card, `--popover`→card-elevated, `--muted-foreground`→fg-muted, `--destructive`→data-negative. Every **custom** variant below should still use the existing `fg-*`/`surface-*`/`brand` tokens directly. |
| G5 | `cn()` / tailwind-merge | Many components concatenate classes by hand. | Adopt `cn()`. tailwind-merge handles arbitrary values such as `text-[13px]`. Custom colour tokens (`text-fg-primary`) are classified as colours, which is fine. Watch out for `font-[inherit]` vs `font-medium`: tailwind-merge treats both as the same group and **keeps only the last**. `Input.tsx:11/14` uses both, so tailwind-merge would drop one and the input's look would change. |
| G6 | Inline `style` + JS hover | About a dozen controls mutate `e.currentTarget.style` in `onMouseEnter`/`onMouseLeave` (listed per item below). | Turn them into `hover:` classes inside the variant. The hover look must match exactly, including the transition duration. |
| G7 | Per-instance accent colours | `PillButton.color`, `Slider.accent`, `Toggle.accent`, the ChartLegend series colour, the AdvancedColumn section colour, the DenseSchemeCard state colour. | Pass the colour as a CSS custom property (`style={{"--accent-c": color}}`) and write variant classes against `var(--accent-c)` with `color-mix()`. This replaces the current `mix(accent, n)` inline styles. |

---

## 1. Custom primitives (`src/components/ui/*`)

### 1.1 Summary

| Primitive | What it does | Props surface | Import sites | Replacement | Status |
|---|---|---|---|---|---|
| `ColumnDrawer.tsx` (`ColumnDrawer`, `ColumnDrawerTrigger`, types `ColumnConfig`, `ColumnKey`) | Right-hand slide-in drawer (w-72) that lists table columns grouped by `group`, with toggle rows and a Reset footer. Locks body scroll and closes on Escape and on an overlay click. The trigger is an outline button with a count badge. | Drawer: `columns: ColumnConfig[]`, `visibleColumns: Record<string,boolean>`, `onToggleColumn(key)`, `onReset()`, `isOpen`, `onOpenChange(open)`. Trigger: `visibleCount`, `totalCount`, `onClick`. | `cashflow/CashflowDataTable.tsx:13` (both components), `cashflow/table/columns.ts:1` (type only) | **Sheet** (`side="right"`, `w-72`). Rows become **Checkbox**/`Label` rows (or `Toggle`/`option-row`). Reset becomes `Button/secondary`. Close becomes `Button/ghost-icon`. Trigger becomes `Button/outline` + `Badge/brand` | Live |
| `DeltaPill.tsx` (+ `YOY_OUTLIER_THRESHOLD`) | Inline YoY % label that is coloured only when \|value\| ≥ 5. | `value: number`, `direction?: "positive"\|"negative"` | **none** | (would be `src/components/domain/`) | **DEAD**: delete |
| `EditableValue.tsx` | Read-only text input that turns editable on click/focus. Uses `useEditableInput`. | `display`, `onCommit(raw)`, `parse(display)`, `className?` | `amortisation/KpiCards.tsx:10` (used at :56) | Stays custom and moves to `src/components/domain/EditableValue.tsx`. It may render shadcn `Input/ghost` internally | Live |
| `ErrorBoundary.tsx` | Class error boundary with a default "Something went wrong / Try again" fallback. | `children`, `fallback?(error, reset)` | `amortisation/AmortisationView.tsx:13` (used at :213), `tax/TaxView.tsx:8` (used at :111), `ui/__tests__/ErrorBoundary.test.tsx:3` | Stays custom and moves to `src/components/domain/`. The internal "Try again" `<button>` (:41) becomes `Button/ghost` (brand text) | Live |
| `GlassCard.tsx` | `div.glass-card rounded-2xl backdrop-blur-md` with `background: t.surface.raised`. forwardRef. The `.glass-card` CSS (`globals.css:456`) adds a shadow and a hover lift. | `children`, `className?`, `style?`, `ref` | `amortisation/AmortisationView.tsx:12` (:106), `amortisation/KpiCards.tsx:9` (:50/:70/:99), `amortisation/LoanControls.tsx:6` (:62/:120/:155), `tax/AdvancedColumn.tsx:6` (:236), `tax/TaxBreakdown.tsx:3` (:316), `ui/__tests__/GlassCard.test.tsx:4` | **Card**, variant `glass`. Must keep the ref, the hover translate and the shadow. Callers pass `borderTop` via `style`. | Live |
| `Input.tsx` | Styled text input. Sizes `md`/`sm` and an optional right-aligned `suffix`. forwardRef. | all input attributes; `size?: "sm"\|"md"` (**`sm` unused**), `suffix?: string` | `cashflow/wizard/shared.tsx:2` (used in `InputField` :28) | **Input** variant `filled` (current md look) + **Label**. The `suffix` becomes an `InputGroup`/adornment wrapper. Drop `sm`. | Live |
| `KpiTile.tsx` | Centred KPI cell (label, value, children slot) with an optional left divider. | `label`, `value`, `color?`, `divider?`, `children?` | `cashflow/CashflowKpiStrip.tsx:8`, and that file is **itself unused** | (would be domain) | **DEAD (transitively)**: its only consumer is dead. Delete it, or move it to domain only if the KPI strip is revived |
| `PillButton.tsx` | Rounded-full toggle chip, 26px high, with an accent-coloured tinted active state. | `active`, `color?`, `onClick`, `children` | `grants/GrantsView.tsx:10` (used at :172, :191, :202) | **Button** variant `pill`. In practice use **ToggleGroup** items with variant `pill` (see §2 Grants). | Live |
| `Skeleton.tsx` | Inline-block pulsing span. Width and height passed explicitly, `bg = t.border.default`, `rounded-md`. | `width`, `height`, `className?` | `amortisation/KpiCards.tsx:11` (used at :62, :65, :94, :104, :107) | **shadcn Skeleton**. Override the bg to `--color-border-default` and render as `span inline-block` (shadcn renders a block `div`, which risks a layout change inside text lines). | Live |
| `Slider.tsx` | Labelled range slider. An opacity-0 native `<input type=range>` (:119) sits over a custom 2px track, a fill and a 10px ring thumb, plus an editable value text input (:83 default, :49 compact). | `label`, `value`, `display`, `min`, `max`, `step`, `onChange`, `editable?`, `parseDisplay?`, `accent?`, `variant?: "default"\|"compact"` (**`compact` never used**) | `amortisation/LoanControls.tsx:7` (7 instances :65–:157), `ui/__tests__/Slider.test.tsx:3` | **Slider** (custom track, range and thumb styles; accent via CSS var) + `Input/ghost` for the value. Drop the `compact` branch. See risk R1. | Live |
| `TableCell.tsx` | `<td>` with tone (`data`/`emphasis`) and column fade-in animation. | `tone?`, `animated?`, all td attributes | **none** | Table `TableCell` | **DEAD**: delete. Also delete `.animate-col-fade-in` (globals.css:434–438), whose only consumer is this file |
| `Toggle.tsx` | Switch: a `role="switch"` button (:13), 36×20 track, 14px thumb, with a label (normal or `reverse` layout). | `label`, `checked`, `onChange`, `accent?` (unused by callers), `reverse?` | `tax/AdvancedColumn.tsx:7` (used at :342 with `reverse`), `ui/__tests__/Toggle.test.tsx:3` | **Switch** variant `default` + **Label**. Accent via CSS var. | Live |
| `UnderlineTabs.tsx` | Tab row with a 0.5px brand-hover underline on the active item and an optional hint. | `tabs[{key,label,hint?}]`, `activeKey`, `onChange` | **none** | Tabs/`underline` | **DEAD**: delete. Its look is **not** the same as the live dashboard underline tabs (see §3) |
| `wizard/ModalWizardShell.tsx` | Centred modal: fixed overlay (`bg-black/60 backdrop-blur-md`), glass card (max-w 920, min-h 640), close X button. Escape closes it and body scroll is locked. Returns `null` when closed. | `isOpen`, `onClose`, `children`, `maxWidth?`, `minHeight?` | `cashflow/CashflowView.tsx:5` (used at :105) | **Dialog** (`DialogContent` restyled: no default padding/border/close, custom overlay). Close becomes `Button/ghost-icon` (`DialogClose asChild`). | Live |
| `wizard/WizardShell.tsx` | Wizard step frame: header ("Step N of M", title, subtitle), scrollable body, footer with Back (:82) and CTA (:92). | `stepTitle`, `stepSubtitle?`, `stepIndex`, `totalSteps`, `children`, `bodyAlign?`, `ctaLabel`, `ctaDisabled?`, `onContinue`, `showBack?`, `backLabel?`, `backIcon?`, `onBack?` | `cashflow/CashflowWizardStep.tsx:6` (used at :55) | Keep the layout component. Back becomes `Button/ghost`, CTA becomes `Button/default` (brand) | Live |
| `wizard/WizardSidebar.tsx` (+ types `WizardSidebarStep`, `WizardSidebarProgress`) | 260px aside with a progress header (bar :119) and a step list of dot-indicator buttons (:67), plus a custom `renderStepBody` slot. | `steps`, `currentStepId`, `isComplete(id)`, `selectable(id)`, `onSelect(id)`, `renderStepBody?`, `progress?`, `className?` | `cashflow/CashflowSidebar.tsx:6-10` (used at :212) | Keep the layout. Step buttons become `Button/nav-step`. The progress bar becomes **Progress** (`h-1.5`, `bg-white/[0.06]`, brand indicator, 500ms transition) | Live |
| `wizard/useWizardSteps.ts` (+ `UseWizardStepsResult`) | Derives the natural step, completion and validity from a step list and state. | `(steps, state)` | `cashflow/CashflowView.tsx:5`, `cashflow/CashflowWizardStep.tsx:6`, `cashflow/CashflowSidebar.tsx:8` | Hook. **Out of scope**, untouched. It can move to `src/hooks/` | Live |
| `wizard/types.ts` (`WizardStep`) | Step descriptor type. | n/a | `cashflow/cashflow-steps.ts:14`, `wizard/useWizardSteps.ts:5` | Type. Untouched | Live |
| `wizard/index.ts` | Barrel. | n/a | as above | Keep, or re-point it | Live |

Tests that must be rewritten or updated when their primitive changes:

- `ui/__tests__/ErrorBoundary.test.tsx`
- `ui/__tests__/GlassCard.test.tsx`
- `ui/__tests__/Slider.test.tsx`
- `ui/__tests__/Toggle.test.tsx`

The Toggle test exercises the non-`reverse` layout, which no production code uses.

### 1.2 Raw controls inside the primitives themselves

| File:line | What | Replacement |
|---|---|---|
| `ui/ColumnDrawer.tsx:64` | Overlay div (onClick closes) | `SheetOverlay` (bg `t.surface.overlay`, `animate-overlay-in`) |
| `ui/ColumnDrawer.tsx:74` | `role="dialog"` drawer panel, `translateX` 300ms ease-out, `backdrop-blur(12px)`, `t.elevation.float` shadow | `SheetContent side="right"` (override the default slide animation duration and easing) |
| `ui/ColumnDrawer.tsx:87` | Decorative drag-handle bar | Keep as markup |
| `ui/ColumnDrawer.tsx:110` | Close X button, 32×32 rounded-lg, **JS hover** bg | `Button/ghost-icon` size `icon-sm` (`SheetClose asChild`) |
| `ui/ColumnDrawer.tsx:148` | Column option row: full-width button, brand-tinted bg + brand border when on, check square | `option-row` (label + **Checkbox** variant `lg`) or `Toggle/option-row` |
| `ui/ColumnDrawer.tsx:195` | "Reset to Default": full-width, `surface.hover` bg, **JS hover** → `surface.active` | `Button/secondary` size `block-sm` |
| `ui/ColumnDrawer.tsx:225` | Trigger "Edit Columns" + count badge, border-subtle, **JS hover** bg | `Button/outline` (border-subtle override) + `Badge/brand` |
| `ui/ErrorBoundary.tsx:41` | "Try again" button | `Button/ghost` (text-brand/60) |
| `ui/PillButton.tsx:15` | Pill toggle button | `Button/pill` / `ToggleGroupItem/pill` |
| `ui/Slider.tsx:49`, `:83` | Click-to-edit value text inputs | `Input/ghost` |
| `ui/Slider.tsx:119` | Invisible native range input | Radix `Slider` root/thumb |
| `ui/Toggle.tsx:13` | `role="switch"` button | `Switch` |
| `ui/EditableValue.tsx:15` | Click-to-edit text input | `Input/ghost` |
| `ui/UnderlineTabs.tsx:21` | Tab buttons | (dead) |
| `ui/wizard/ModalWizardShell.tsx:47` | `role="dialog"` overlay wrapper | `Dialog` |
| `ui/wizard/ModalWizardShell.tsx:67` | Close X: 32×32, `bg-white/[0.04]`, `hover:scale-105` | `Button/ghost-icon` (filled) |
| `ui/wizard/WizardShell.tsx:82` | Back button (ghost) | `Button/ghost` |
| `ui/wizard/WizardShell.tsx:92` | Continue/Save/Calculate CTA (brand filled, `hover:enabled:brightness-110`, `disabled:opacity-40`) | `Button/default` |
| `ui/wizard/WizardSidebar.tsx:67` | Step list button (dot + body slot, `bg-brand/[0.08]` current, disabled when not selectable) | `Button/nav-step` |
| `ui/wizard/WizardSidebar.tsx:119` | Progress bar | `Progress` |

---

## 2. Hand-rolled controls in feature folders

### 2.1 Amortisation (`src/components/amortisation/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `AmortisationChart.tsx:31` | `ChartTooltip`: recharts custom tooltip content | **KEEP** (recharts) | Out of scope |
| `AmortisationChart.tsx:100` | `ChartLegend` series toggle chips: `aria-pressed`, dot + label, series-coloured tint/border when active, **JS hover** (:110) | `ToggleGroup type="multiple"` / `Toggle` variant `legend` (series colour via CSS var) | `toggleSeries` refuses to remove the last series. A controlled ToggleGroup must keep that rule in `onValueChange`. |
| `AmortisationView.tsx:124`, `:145` | Segmented control **Chart / Table** with inline SVG icons. Active: brand 12% bg, 40% border, glow. Inactive: `rgba(255,255,255,.04)` | `ToggleGroup type="single"` variant `segment-glow` | Missing `aria-pressed` today. Radix adds `aria-checked`/radio semantics. Prevent deselect (`onValueChange` ignore empty). |
| `AmortisationView.tsx:169` | Focus-mode icon button with native `title` tooltip (:173) | `Button/ghost-icon` (+ optional `Tooltip`) | `title` → Tooltip is a visible behaviour change (styled popup, delay). Optional. |
| `AmortisationView.tsx:106` | `GlassCard` toolbar card | `Card/glass` | |
| `AmortisationTable.tsx:16-47` | Schedule "table" built from CSS grid divs (`grid-cols-[52px_1fr…]`). The header sits outside the scroll container. | **Table** variant `schedule` *(optional)* | Risk R6: a real `<table>` changes column sizing and needs a sticky `<thead>` to keep the header fixed while the body scrolls. It can stay as divs. |
| `KpiCards.tsx:56` | `EditableValue` (repayment) | domain `EditableValue` | |
| `KpiCards.tsx:62/65/94/104/107` | `Skeleton` placeholders | shadcn `Skeleton` | |
| `KpiCards.tsx:78` | Segmented control **frequency** (Weekly/Fortnightly/Monthly from `FREQ_OPTIONS`): rounded-full, padding 14px 4px, brand border/tint/glow, bold when active | `ToggleGroup type="single"` variant `segment-glow` size `pill-lg` | Missing `aria-pressed` today. Inactive border is `rgba(255,255,255,.12)`, a different alpha from AmortisationView (.07); expose it as a size or shape modifier. |
| `KpiCards.tsx:50/70/99` | `GlassCard`s | `Card/glass` | |
| `LoanControls.tsx:65,78,91,104,123,137,157` | 7× `Slider` (purchase price, deposit, rate, term, offset balance, contribution, appreciation), all `editable`. Offset and equity use a series accent. | shadcn `Slider` (custom) | Risk R1 |
| `LoanControls.tsx:62/120/155` | `GlassCard`s | `Card/glass` | |

### 2.2 Auth (`src/components/auth/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `AuthCard.tsx:28/32` | Card surface rendered as `<form>` or `<div>` (radius 12, padding 28, max-w 400, custom shadow) | `Card` variant `auth` (`asChild` with form) | Not a control, but it is a card surface |
| `BackToSignIn.tsx:7` | "← Back to sign in" Link. **JS hover** (:21) changes colour and widens the gap 6→8px | `Button/link-back` `asChild` | The gap animation must become `hover:gap-2 transition-[color,gap]` |
| `ForgotPasswordSent.tsx:102` | "Use a different email": full-width h-44 transparent outline button, **JS hover** (:118) bg surface-hover + border-strong | `Button/outline` size `lg-block` | |
| `ForgotPasswordView.tsx:39` | `<label htmlFor="forgot-email">` | `Label` variant `form` (13px, fg-secondary, mb-6px) | |
| `ForgotPasswordView.tsx:51` | `<input type=email className="form-input">` | `Input/form` | |
| `ForgotPasswordView.tsx:63` | `PrimaryButton` submit | `Button/cta-glow` | |
| `GoogleButton.tsx:12` | "Continue/Sign up with Google": full-width h-44, bg `--color-control`, border default, **JS hover** (:32) | `Button/outline` + `bg-control` → variant `outline-filled` size `lg-block` | Shares its shape with ForgotPasswordSent:102 |
| `LoginView.tsx:61` | "Sign up" brand text link | `Button/link` (brand) `asChild` | Optional; a plain Link is fine |
| `LoginView.tsx:89`, `:123` | `<label>` Email / Password | `Label/form` | |
| `LoginView.tsx:101`, `:147` | `form-input` email / password | `Input/form` | |
| `LoginView.tsx:129` | "Forgot?" link, 12px fg-tertiary, **JS hover** (:137) → fg-secondary | `Button/link-muted` `asChild` (size xs) | |
| `LoginView.tsx:160` | `PrimaryButton` | `Button/cta-glow` | |
| `OrEmailDivider.tsx:7` | Line + text + line divider | `Separator` ×2 *(optional)* | |
| `PasswordStrength.tsx:47` | Strength meter bar (3px, colour by score, width transition) | `Progress` variant `meter` *(optional)* | Indicator colour is dynamic. Radix Progress animates by `transform: translateX`, but the current one animates `width` (risk R7) |
| `PrimaryButton.tsx:17` | `.auth-cta` button + `.auth-cta-arrow` (globals.css:471–511): h-46, brand, emerald glow shadow, arrow slides 3px on hover, `active:scale-.99`, focus ring | `Button` variant `cta-glow` size `lg-block` | Move the CSS into the cva variant and delete `.auth-cta*` from globals |
| `SignupView.tsx:62` | "Sign in" brand link | `Button/link` `asChild` *(optional)* | |
| `SignupView.tsx:90`, `:100`, `:114` | `form-input` full name / email / password (aria-label, no visible label) | `Input/form` | |
| `SignupView.tsx:139`, `:151` | Terms / Privacy underlined links | Keep as Link (or `Button/link-underline`) | |
| `SignupView.tsx:165` | `PrimaryButton` | `Button/cta-glow` | |
| `ProtectedRoute.tsx` | not a control | n/a | **DEAD**: no import sites |

### 2.3 Cashflow, top level (`src/components/cashflow/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `CashflowDashboard.tsx:229` | **View-mode tabs** (summary/property/tax/equity/deductions/costs): text-sm, `border-b-2` brand on active, fg-tertiary inactive, `pb-3 -mb-3` overlapping the row's bottom border | `Tabs/underline` | This is the **canonical `underline` look** (UnderlineTabs is dead and different). The content area isn't a TabsContent pane (it drives chart config), so use `Tabs` with `value` only, or `ToggleGroup/underline`. |
| `CashflowDashboard.tsx:247` | **Overview / Details** segmented toggle: `rounded-md px-3 py-1.5 text-xs`, active **solid brand fill** + brand-contrast text | `Tabs` variant `solid` (switches panes at :262 / :627) | |
| `CashflowDashboard.tsx:295`, `:370` | Expand/collapse chevron icon buttons (Net Equity / Loan Balance breakdown), `p-0.5 rounded hover:bg-surface-hover`, rotating chevron | `Collapsible` + `CollapsibleTrigger asChild` → `Button/ghost-icon` size `icon-xs` | Content :343, :421 becomes `CollapsibleContent` (currently unanimated conditional render, so don't add an animation) |
| `CashflowDashboard.tsx:329`, `:404` | LVR bar and loan-paid bar (the loan bar has **two stacked segments**: paid + offset) | **KEEP** (custom). LVR bar could be `Progress` | Radix Progress has one indicator, and the two-segment bar doesn't fit it |
| `CashflowDashboard.tsx:288`, `:448`, `:564` | Panels `bg-card border border-border-subtle rounded-xl` | `Card` variant `panel` | |
| `CashflowDashboard.tsx:477-558` | recharts Bar/Composed charts, `Cell` hover/click | **KEEP** | Out of scope |
| `CashflowDashboard.tsx:570`, `:582` | Year prev/next icon buttons: `p-1.5 rounded-lg border border-border-default disabled:opacity-30` | `Button/outline` size `icon-sm` | No `aria-label` today; add one |
| `CashflowDashboard.tsx:645` | `Row`, `Section` local display helpers | **KEEP** | Not controls |
| `CashflowDataTable.tsx:137` | `ColumnDrawerTrigger` | `Button/outline` + `Badge` | |
| `CashflowDataTable.tsx:147` | Table card wrapper `bg-card border border-border-subtle rounded-xl overflow-hidden` | `Card/panel` | |
| `CashflowDataTable.tsx:158` | `ColumnDrawer` | `Sheet` | |
| `CashflowDataTable.tsx:113` | `getRowClass`: row `h-8 hover:bg-white/[0.02]`, selected `bg-brand/[0.04]`. Clickable rows | `TableRow` + `data-state="selected"` | |
| `CashflowSidebar.tsx:140` | `<span role="button" tabIndex=0>` expand/collapse details chevron (20×20, `bg-white/[0.04]`), nested inside the WizardSidebar step `<button>` | `CollapsibleTrigger`, rendered as a non-button (`asChild` span), or restructure | **Nested interactive** (button inside button) is an a11y issue today. It can't become a real `<button>` without moving it out of the step button. |
| `CashflowSidebar.tsx:160` | Collapsible detail lines (`max-h` + opacity transition 200ms) | `CollapsibleContent` | Keep the max-h transition. Radix's `--radix-collapsible-content-height` anim is different. |
| `CashflowSidebar.tsx:212` | `WizardSidebar` | rebuilt WizardSidebar | |
| `CashflowView.tsx:69` | Inline wizard container: `rounded-2xl border-white/[0.06] bg-surface-raised/60 backdrop-blur-xl shadow-float` | `Card` variant `wizard` (shares its look with the ModalWizardShell card) | |
| `CashflowView.tsx:105` | `ModalWizardShell` edit modal | `Dialog` | Risk R3 |
| `CashflowWizardStep.tsx:55` | `WizardShell` | rebuilt WizardShell | |
| `CashflowChart.tsx` (whole file) | recharts chart | n/a | **DEAD**: no import sites |
| `CashflowKpiStrip.tsx` (whole file) | KPI strip using `KpiTile` + `KpiSparkline` | n/a | **DEAD**: no import sites |
| `KpiSparkline.tsx:47` | Interactive SVG sparkline overlay | n/a | **DEAD (transitively)**: only imported by the dead `CashflowKpiStrip` |

### 2.4 Cashflow tables (`src/components/cashflow/table/`)

All six sub-tables share one structure:

- `<table className="w-full text-[12px] table-fixed">`
- `<th>`: `px-3 py-2 text-[11px] uppercase tracking-wider`, bg `t.surface.subtle`, colour fg-tertiary. "Total" headers use fg-secondary 600; "net" headers use brand 600.
- The first column is sticky (`sticky left-0 z-10 w-16`, bg `t.card.base`, or `t.surface.hover` when selected).
- `<td>`: `px-3 py-2 text-right text-[12px] tabular-nums border-t`, `borderColor: t.border.subtle`.
- Group dividers use `border-l` (or `border-l-2` with `t.border.default`).
- The net column is 13px / 600.

| File:line | What | Replacement |
|---|---|---|
| `CostsTable.tsx:33` | `<table>` (thead :34, tbody :47, rows :52) | `Table` variant `dense` |
| `DeductionsTable.tsx:19` | `<table>` (thead :20, tbody :35, rows :43) | `Table/dense` |
| `EquityTable.tsx:39` | `<table>` (thead :40, tbody :50, rows :60) | `Table/dense` |
| `EquityTable.tsx:15` | `GainCell`: muted YoY % to the left of the value | **KEEP** (domain cell content) |
| `PropertyTable.tsx:30` | `<table>` (thead :31, tbody :60, rows :75) | `Table/dense` |
| `PropertyTable.tsx:43-50` | **Hand-built CSS tooltip** on the "Tax" header: `group-hover:visible` absolute span, bg `t.card.elevated`, border, `elevation.raised`, text "Tax refund (+) or additional tax (−)" | **Tooltip** variant `surface` (match the bg, border, 11px text and **zero delay**: `delayDuration={0}`) |
| `SummaryTable.tsx:18` | `<table>` (thead :19, tbody ~:98, rows :102) | `Table/dense` |
| `TaxTable.tsx:21` | `<table>` (thead :22, tbody :34, rows :44) | `Table/dense` |
| `helpers.ts:200-327` | `getValueClass`, `getLvrClass`, `getLvrColor`, `thClass`, `thStyle`, `tdClass`, `tdStyle`, `gainCls`, `gainStyle`, `growthPct` | **DEAD exports**: only `yoyPct` and `fmtYoY` are imported (by `EquityTable.tsx:5`). Delete. A `Table/dense` variant replaces what `thClass`/`tdClass` were attempting. |

Table variants needed:

- `TableHead` tones: `default`, `total`, `net`, plus `groupStart` (border-l) and `groupStartStrong` (border-l-2).
- `TableCell` tones: `default`, `out` (data-negative), `total` (500), `net` (13px/600), plus `sticky`.

### 2.5 Cashflow wizard (`src/components/cashflow/wizard/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `shared.tsx:12` | `InputField`: label + hint + `ui/Input` | `Label` variant `field` (`text-xs font-medium text-fg-secondary`) + `Input/filled` (+ suffix adornment) | `<label>` (:25) has **no `htmlFor`**. Wire up an `id` during the migration. |
| `shared.tsx:33` | `ModeToggle`: track `p-1 rounded-lg bg-zinc-900/50 w-fit` | `TabsList` variant `track` | |
| `shared.tsx:47` | `ModeButton`: `px-3 py-1.5 rounded-md text-sm`, active `bg-zinc-800 text-fg-primary`, inactive fg-muted | `TabsTrigger` variant `track` | Switches Quick/Custom panes, so Tabs fits. Missing `type="button"`. |
| `shared.tsx:58` / `:89` | `EditableRow`: label + inline right-aligned text input. Transparent, border-b transparent → `hover:border-zinc-700` → `focus:border-brand` | `Input` variant `underline` | Same look as the DepreciationStep inputs |
| `shared.tsx:102` / `:113` / `:119` | `Checkbox`: visually hidden native checkbox + `peer-checked` 18px box with a CSS-drawn tick | shadcn **Checkbox** variant `default` (18px, `border-strong`, brand fill, brand-contrast tick) + `Label` | `border-strong` is an **undefined token** today (G2). Check what border colour actually renders. The tick is drawn with CSS borders while shadcn uses a lucide `Check`, so match stroke and size (risk R8). |
| `SetupStep.tsx:124` / `:130` | **Local `PillButton`** (not ui/PillButton): `px-5 py-2.5 rounded-lg text-sm`, active `bg-brand/[0.12] text-brand ring-1 ring-brand/30`, inactive `bg-zinc-800/40` | `ToggleGroup type="single"` variant `choice` | Uses :20, :25 (Investment / Owner-occupied), :37, :42 (New purchase / Existing property). Must **not** allow deselect. |
| `SetupStep.tsx:95,96,100,101,102,103` | `InputField` ×6 | `Label` + `Input/filled` | |
| `IncomeStep.tsx:11`, `:17` | `InputField` ×2 (one with `%` suffix) | `Label` + `Input/filled` | |
| `LoanStep.tsx:54` | `<label>` "Loan amount" over static text (not a control) | `Label/field` (or span) | Label with no control |
| `LoanStep.tsx:59,66,103,104,129` | `InputField` ×5 | `Label` + `Input/filled` | |
| `LoanStep.tsx:85`, `:112` | "+ Add offset account" / "+ Add extra repayments": text-sm fg-muted, `hover:fg-secondary`, Plus icon | `Button/link-muted` | Missing `type="button"` |
| `LoanStep.tsx:94`, `:121` | Disclosure header buttons ("Offset account" / "Extra repayments"): full-width, justify-between, `hover:bg-zinc-800/20`, rotated chevron. Clicking **closes and clears** the section | `Button` variant `disclosure` | It is a remove toggle, not a real Collapsible, so keep the custom handler |
| `CostsStep.tsx:35-41` | `ModeToggle`/`ModeButton` Quick / Custom | `Tabs/track` | |
| `CostsStep.tsx:88`, `:162` | `Checkbox` strata | `Checkbox` | |
| `CostsStep.tsx:95,96,97,99,101,103` | `EditableRow` ×6 | `Input/underline` | |
| `CostsStep.tsx:129,130,135,137,143,151,170` | `InputField` ×7 | `Label` + `Input/filled` | |
| `RentalStep.tsx:32-38` | `ModeToggle`/`ModeButton` | `Tabs/track` | |
| `RentalStep.tsx:74`, `:154` | `Checkbox` property manager | `Checkbox` | |
| `RentalStep.tsx:81,87,95` | `EditableRow` ×3 | `Input/underline` | |
| `RentalStep.tsx:139,144,160` | `InputField` ×3 | `Label` + `Input/filled` | |
| `DepreciationStep.tsx:36-42` | `ModeToggle`/`ModeButton` | `Tabs/track` | |
| `DepreciationStep.tsx:155`, `:167` | Building name / cost inline inputs | `Input/underline` | |
| `DepreciationStep.tsx:235`, `:246`, `:259` | Asset name / cost / life inline inputs | `Input/underline` | |
| `DepreciationStep.tsx:179`, `:272` | "×" remove-row buttons: fg-muted `hover:text-red-400`, text-lg | `Button/ghost-icon` tone `danger` | No `aria-label` today |
| `DepreciationStep.tsx:195`, `:289` | "+ Add building" / "+ Add asset": text-sm fg-muted `hover:text-brand` | `Button/link-muted` (brand hover modifier) | |
| `DepreciationStep.tsx:315` | Quick-add preset chips: `text-xs px-2 py-0.5 rounded bg-zinc-800/50` | `Button` variant `chip` | |
| `DepreciationStep.tsx:226` | Asset header row (flex spans, not a table) | **KEEP** | |

### 2.6 Grants (`src/components/grants/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `GrantsView.tsx:20` / `:23` | **Local `TriPill`**: same shape as ui/PillButton, plus a red "No" active state | `ToggleGroupItem` variant `pill` with `tone="negative"` | Missing `type="button"` |
| `GrantsView.tsx:73` | `TriField` (Yes/No with null deselect), used at :208, :210, :212, :217 | `ToggleGroup type="single"` variant `pill` | Radix single ToggleGroup **allows deselect** (value `""`), which matches today's toggle-off-to-`null` behaviour |
| `GrantsView.tsx:76` | `<label>` over a pill group (labels nothing) | Plain text, with `aria-label` on the ToggleGroup | |
| `GrantsView.tsx:49` / `:53` | **`BarInput`**: centred 30px input, `bg-white/[0.04]`, border white/6, focus brand/40 + 2px ring, used at :152, :154, :159 | `Input` variant `bar` | `<label>` :52 has no `htmlFor` |
| `GrantsView.tsx:67` | `Divider` (w-px h-7) | `Separator orientation="vertical"` *(optional)* | |
| `GrantsView.tsx:167` | `<label>` "State" over pills | text + `aria-label` | |
| `GrantsView.tsx:172` | Region pills (multi-select, per-state accent colour) using ui/PillButton | `ToggleGroup type="multiple"` variant `pill` (accent CSS var) | |
| `GrantsView.tsx:183`, `:191` | Property type pills New/Existing/Land/OTP (single, deselectable) | `ToggleGroup type="single"` variant `pill` | |
| `GrantsView.tsx:199`, `:202` | Buyer pills Individual/Couple (single, deselectable) | `ToggleGroup type="single"` variant `pill` | |
| `GrantsView.tsx:151` | Filter-bar surface (`border-t-accent-border`, an undefined token, G2) | `Card` variant `toolbar` *(optional)* | |
| `GrantsView.tsx:251` | "← All Tools" footer link (fg-primary/30 → `hover:brand/70`, arrow nudge) | `Button/link-back` `asChild` | Same as PurchaseCostsView:321 |
| `DenseSchemeCard.tsx:157` | State badge (`h-9 rounded-[14px]`, state-colour tint) | `Badge` variant `tinted` *(optional)* | |
| `DenseSchemeCard.tsx:167` | Expand/minimise icon button (36×36, `rounded-[14px]`, state-colour tint/border, `hover:-translate-y-px`), `aria-expanded` | `Button` variant `tinted-icon` (accent CSS var) | Becomes `DialogTrigger` |
| `DenseSchemeCard.tsx:194` | Compact card with **JS hover** shadow (:197) and `hover:-translate-y-0.5` | `Card` variant `scheme` | |
| `DenseSchemeCard.tsx:210` | **Expanded overlay modal** (fixed, `bg-black/65 backdrop-blur-sm`, card pop-in, Escape + outside mousedown close). The compact card stays as an `invisible` placeholder. | **Dialog** | Risk R3. The header's close button is the same button rendered again inside the dialog. |

### 2.7 Layout (`src/components/layout/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `Sidebar.tsx:85` | "New analysis" `+` icon Link (brand bg, `hover:bg-brand-hover`, `hover:scale-105`) with native `title` (:88) | `Button/default` size `icon-sm` `asChild` (+ optional Tooltip) | |
| `Sidebar.tsx:144` | `PropertyRow` nav Link | `Button` variant `nav` `asChild` *(optional; can stay custom)* | shadcn `Sidebar` is **not recommended** (heavy, different structure) |
| `Sidebar.tsx:166` | Draft dot with `title="Draft"` | Keep (or Tooltip) | |
| `Sidebar.tsx:180` | `NavItemRow` Link, active `bg-surface-active` | `Button/nav` `asChild` *(optional)* | |
| `Sidebar.tsx:221` | Sign-out icon button with `title` (:225) | `Button/ghost-icon` size `icon-xs` | No `aria-label` |
| `Sidebar.tsx:232` | "Sign in" Link | `Button/link-muted` `asChild` | |
| `Sidebar.tsx:243`, `:250` | Settings / Help utility Links | `Button` variant `ghost` size `xs` `asChild` | |
| `AppShell.tsx`, `PageHeader.tsx` | no controls | n/a | |
| `GlobalsTray.tsx:5` | Renders an **empty** absolutely-positioned div | n/a | **Dead stub**: delete it, or leave it for future use |

### 2.8 Purchase costs (`src/components/purchase-costs/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `PurchaseCostsView.tsx:17` / `:19` | **Local `Toggle`** (a `<button>` with **no `role="switch"`/`aria-pressed`**): w-9 h-5 track **with border**, active `bg-brand/35 border-brand/50`, 16px thumb with brand glow, inactive `bg-brand/12`. Used at :224–:227 (First Home / Owner Occupied / Couple / LMI Exempt) | `Switch` variant `glow` + `Label` (13px) | A different look from ui/Toggle (border, 1px inset, glow), so it gets its own variant. `bg-subtle/50` thumb (:28) is an **undefined token** (G2). |
| `PurchaseCostsView.tsx:64` | `BreakdownRow` header: a **clickable `<div>`** (no button, no keyboard support) with a rotating chevron; details at :81 | `Collapsible` + `CollapsibleTrigger` → `Button` variant `disclosure-row` | Rows without details are still `cursor-pointer` (keep as-is or fix on purpose) |
| `PurchaseCostsView.tsx:198,206,210,214` | `<label>` State / Purchase Price / Deposit / Type (no `htmlFor`) | `Label` variant `caps` (11px, semibold, uppercase, tracking-widest, fg-primary/50) | |
| `PurchaseCostsView.tsx:199`, `:215` | **Native `<select className="form-select">`** State / Type | shadcn **NativeSelect** pattern, variant `form` | **Parity risk R2.** Do not use Radix Select. |
| `PurchaseCostsView.tsx:207`, `:211` | `form-input` price / deposit | `Input/form` | |
| `PurchaseCostsView.tsx:195`, `:271` | Card shells (`rounded-2xl bg-surface-raised` + `CARD_SHADOW`) | `Card` variant `raised` | |
| `PurchaseCostsView.tsx:257` | Divider `w-px h-9 bg-border` (**currently invisible**, G2) | `Separator` *(decide visibility)* | |
| `PurchaseCostsView.tsx:321` | "← All Tools" Link | `Button/link-back` `asChild` | |

### 2.9 Tax (`src/components/tax/`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `AdvancedColumn.tsx:243` / `:248` | **Section tab strip** (Income / Deductions / Adjustments). Each tab has two lines: label + aggregate value. The active tab is filled with the section colour and its text is surface-app. Track is `rgba(255,255,255,.03)`. | `Tabs` variant `stat` (colour per trigger via CSS var) | Behaviour: Radix Tabs adds arrow-key roving focus and `role="tab"`, a minor visible keyboard change |
| `AdvancedColumn.tsx:282` | Progress dots / check per tab | **KEEP** | |
| `AdvancedColumn.tsx:145` / `:194` | `EditableField`: status dot + label + click-to-edit 90px input (editing: `bg-white/6` + 1px section-colour ring) | `Input/ghost` + data-editing styles (CSS var colour) | |
| `AdvancedColumn.tsx:342` | `ui/Toggle` `reverse` (PHI / SAPTO) | `Switch/default` + `Label` (justify-between) | |
| `AdvancedColumn.tsx:236` | `GlassCard` | `Card/glass` | |
| `TaxBreakdown.tsx:47` / `:61` | Interactive SVG donut (hover/click arcs) | **KEEP** (data-viz) | No keyboard support (CLAUDE.md a11y rule); out of scope |
| `TaxBreakdown.tsx:172`, `:204`, `:232` | Clickable waterfall bar rows (`<div onClick>`, hover) | **KEEP** (data-viz) | |
| `TaxBreakdown.tsx:330`, `:337` | Effective / Marginal rate pills (display only) | `Badge` variant `stat` *(optional)* | |
| `TaxBreakdown.tsx:358` | Legend rows: clickable `<div>` (hover highlight, click pins) | **KEEP**, or `Button` variant `legend-row` | No keyboard access |
| `TaxBreakdown.tsx:316` | `GlassCard` | `Card/glass` | |
| `TaxView.tsx:111` | `ErrorBoundary` | domain `ErrorBoundary` | |

### 2.10 App routes (`src/app/**`)

| File:line | What | Replacement | Notes |
|---|---|---|---|
| `(app)/cashflow/page.tsx:32` | "Edit" header action: h-9 px-3.5 rounded-md 13px outline, **JS hover** border → strong (:43) | `Button/outline` size `sm` | |
| `(app)/cashflow/page.tsx:54` | "Model new property": same look, **JS hover** (:65) | `Button/outline` size `sm` | |
| `(app)/[tool]/page.tsx:22` | "Coming soon" placeholder card | `Card/glass` *(optional)* | |
| `(app)/[tool]/page.tsx:39` | "Coming soon" tag | `Badge` variant `muted` *(optional)* | |
| `(app)/page.tsx:7` | Dashboard placeholder box | n/a | |
| `(auth)/layout.tsx`, `layout.tsx`, other `page.tsx` | no controls | n/a | |

### 2.11 Tooltips

| Source | Location | Plan |
|---|---|---|
| `.tip` / `data-tip` CSS utility (`globals.css:243-269`) | **0 usages** in TSX | **Dead CSS**: delete. Add shadcn `Tooltip` in its place. |
| CSS group-hover tooltip | `cashflow/table/PropertyTable.tsx:43-50` | `Tooltip` variant `surface`, `delayDuration={0}` |
| Native `title` | `AmortisationView.tsx:173`, `Sidebar.tsx:88`, `:166`, `:225` | Optional `Tooltip`. Leaving `title` means zero visual change. |
| recharts `<Tooltip>` | `AmortisationChart.tsx:272`, `CashflowDashboard.tsx:488`, `:537` | **KEEP** (recharts) |

### 2.12 Counts

| Area | Raw controls / control-like items inventoried | Live files touched |
|---|---|---|
| ui primitives (internal) | 20 | 11 live primitives |
| Amortisation | 12 rows (2 segmented groups, 1 legend toggle group, 1 icon button, 7 sliders, 1 editable value, skeletons, 1 div-table) | 5 |
| Auth | 21 (6 inputs, 3 labels, 3 PrimaryButtons, 2 outline buttons, 5 links, 1 meter, 1 divider) | 9 |
| Cashflow top level | 17 (6 view tabs + 2 segment, 2 collapsible icon btns, 2 year-nav btns, sheet trigger, drawer, modal, nested `role=button`, panels) | 5 |
| Cashflow tables | 6 `<table>` + 1 CSS tooltip + dead helpers | 6 |
| Cashflow wizard | about 58 call sites (31 InputField, 9 EditableRow, 8 ModeButton, 4 Checkbox, 4 local PillButton, 5 underline inputs, 4 add/link, 2 disclosure, 2 remove, 1 chip group) | 7 |
| Grants | 13 (pill groups ×7 fields, 3 BarInputs, 1 icon btn, 1 modal, link) | 2 |
| Layout | 8 (links, icon buttons, logout) | 1 |
| Purchase costs | 12 (4 switches, 2 native selects, 2 inputs, 4 labels, disclosure rows, link) | 1 |
| Tax | 9 (3-tab stat strip, EditableField ×12 instances, 2 switches, legend, waterfall, donut) | 3 |
| App routes | 2 buttons (+ 2 optional card/badge) | 1 |

---

## 3. Proposed variants table

The shared variants are consolidated here. "Look" is what the cva classes must reproduce; inline values come from `lib/theme.ts` / `globals.css`.

### Button

| Variant | Size(s) | Call sites | Look to reproduce |
|---|---|---|---|
| `default` (brand) | `default`, `icon-sm` | `WizardShell.tsx:92`, `Sidebar.tsx:85` | `bg-brand text-brand-contrast rounded-lg px-5 py-2.5 text-sm font-semibold`, `hover:enabled:brightness-110`, `disabled:opacity-40 disabled:cursor-not-allowed`. Sidebar: `p-2 hover:bg-brand-hover hover:scale-105` |
| `cta-glow` | `lg-block` (h-46 w-full) | `auth/PrimaryButton.tsx:17` (used by Login/Signup/Forgot) | `.auth-cta`: brand bg, 600 14px, `-0.005em` tracking, emerald glow shadow (`0 4px 16px rgba(52,211,153,.18)` + inset highlight), hover brand-hover + bigger glow, `active:scale-[.99]`, focus-visible 3px focus-ring. Trailing arrow `translate-x-[3px]` on hover |
| `outline` | `sm` (h-9 px-3.5 rounded-md 13px), `lg-block` (h-11 w-full rounded-lg 14px), `icon-sm` | `cashflow/page.tsx:32`, `:54`; `ForgotPasswordSent.tsx:102`; `CashflowDashboard.tsx:570`, `:582`; `ColumnDrawer.tsx:225` (+ border-subtle and hover-bg override) | Transparent, 1px `border-default`, fg-primary 500. Hover: `border-strong` (header actions) / `+ bg-surface-hover` (auth). Year nav: `p-1.5 disabled:opacity-30` |
| `outline-filled` | `lg-block` | `GoogleButton.tsx:12` | As `outline` lg-block but `bg-control`. Hover `bg-surface-hover border-strong` |
| `secondary` | `block-sm` | `ColumnDrawer.tsx:195` | `bg-surface-hover text-fg-secondary rounded-lg py-2.5 text-[12px] font-medium`, hover `bg-surface-active` |
| `ghost` | `default`, `xs` | `WizardShell.tsx:82`, `ErrorBoundary.tsx:41` (brand text), `Sidebar.tsx:243/250` | `text-fg-tertiary hover:text-fg-primary hover:bg-white/[0.04] rounded-lg px-4 py-2 text-sm`. ErrorBoundary: `text-brand/60 text-[12px]` |
| `ghost-icon` | `icon-xs` (p-0.5 / p-1), `icon-sm` (w-8 h-8), `icon` (p-2); tone `danger`; modifier `filled` | `ModalWizardShell.tsx:67` (filled: `bg-white/[0.04] hover:bg-white/[0.08] hover:scale-105`), `ColumnDrawer.tsx:110`, `AmortisationView.tsx:169` (`text-fg-primary/25 hover:text-fg-primary/50 active:scale-90`), `CashflowDashboard.tsx:295`, `:370` (`hover:bg-surface-hover`), `Sidebar.tsx:221`, `DepreciationStep.tsx:179`, `:272` (danger: `hover:text-red-400`) | Transparent square/rounded-lg icon button, muted fg, hover fg up + subtle bg |
| `tinted-icon` | `icon-lg` (w-9 h-9 rounded-[14px]) | `DenseSchemeCard.tsx:167` | Accent var: border 24%, bg 12%, colour 100%, `hover:-translate-y-px` |
| `pill` | `default` (h-[26px] px-2.5 min-w-[72px] 14px 600 rounded-full); tone `negative` | `ui/PillButton.tsx` → `GrantsView.tsx:172`, `:191`, `:202`; `GrantsView.tsx:23` (TriPill) | Inactive: transparent, fg-primary 50%, border `rgba(255,255,255,.07)`. Active: accent 14% bg, accent text, 25% border, `0 0 8px` accent 10% glow. Negative: data-negative 12/25/8 |
| `chip` | `xs` | `DepreciationStep.tsx:315` | `text-xs px-2 py-0.5 rounded bg-zinc-800/50 text-fg-muted hover:text-fg-secondary hover:bg-zinc-800` |
| `link-muted` | `sm` (text-sm), `xs` (12px); hover modifier `brand` | `LoanStep.tsx:85`, `:112`; `DepreciationStep.tsx:195`, `:289` (brand hover); `LoginView.tsx:129`; `Sidebar.tsx:232` | Text-only, fg-muted/tertiary, `hover:text-fg-secondary` (or `hover:text-brand`), optional leading icon gap-1.5 |
| `link-back` | `default` | `GrantsView.tsx:251`, `PurchaseCostsView.tsx:321`, `BackToSignIn.tsx:7` | Grants/Purchase: 14px 500 fg-primary/30 → `hover:text-brand/70` (300ms) + arrow `group-hover:-translate-x-1`. BackToSignIn: 13px fg-secondary → fg-primary, `gap-1.5 → gap-2`. Two looks, so use one variant with size `sm` for BackToSignIn |
| `disclosure` | `block` | `LoanStep.tsx:94`, `:121`; `PurchaseCostsView.tsx:64` (`disclosure-row`: px-7 py-3.5, `hover:bg-brand/[0.04]`, 15px 600) | Full-width, justify-between, chevron, subtle hover bg |
| `nav-step` | n/a | `WizardSidebar.tsx:67` | `w-full flex gap-3 px-3 py-2.5 rounded-lg text-left`, current `bg-brand/[0.08]`, clickable `hover:bg-white/[0.03]`, disabled `cursor-default` (no opacity change) |
| `nav` *(optional)* | n/a | `Sidebar.tsx:144`, `:180` | `px-2.5 py-2 rounded-lg text-[13px]`, active `bg-surface-active text-fg-primary`, hover `bg-surface-subtle` / `surface-hover` |
| `legend` (Toggle) | n/a | `AmortisationChart.tsx:100` | `rounded-md px-2.5 py-1 13px 600`, dot. Active: series 12% bg + 25% border + series text. Hover-inactive: series 50% text + 5% bg. Inactive `t.chart.legendInactive` |

### ToggleGroup / Tabs

| Component | Variant | Call sites | Look |
|---|---|---|---|
| ToggleGroup | `pill` (single and multiple; tone `negative`) | `GrantsView.tsx:78-79` (TriField ×4), `:172` (regions, multiple), `:191`, `:202` | Same as Button/`pill`. Gap 1.5 (fields) / 5 (regions grid) |
| ToggleGroup | `segment-glow`; size `sm` (rounded-lg px-3.5 py-1.5 11px), `pill-lg` (rounded-full flex-1 py-[14px] 11px) | `AmortisationView.tsx:124`, `:145`; `KpiCards.tsx:78` | Active: brand 12–15% bg, brand border (40% or 100%), brand text, brand glow (`0 0 10–12px`). Inactive: `rgba(255,255,255,.04)` / transparent bg, white/.35–.4 text, white/.07–.12 border. Frequency: bold 700 when active |
| ToggleGroup | `choice` | `SetupStep.tsx:130` (×4 uses) | `px-5 py-2.5 rounded-lg text-sm 500`. Active `bg-brand/[0.12] text-brand ring-1 ring-brand/30`. Inactive `bg-zinc-800/40 text-fg-secondary hover:bg-zinc-800/60 hover:text-fg-primary` |
| Tabs | `underline` | `CashflowDashboard.tsx:229` (dead `UnderlineTabs` would have been the other) | `flex gap-6`, triggers `pb-3 -mb-3 text-sm font-medium border-b-2 capitalize`. Active fg-primary + brand border. Inactive fg-tertiary + transparent. The list sits in a row with `border-b border-border-subtle` |
| Tabs | `solid` | `CashflowDashboard.tsx:247` | `gap-1.5`, triggers `px-3 py-1.5 rounded-md text-xs font-medium capitalize`. Active `bg-brand text-brand-contrast`, inactive transparent fg-secondary. No list background |
| Tabs | `track` | `wizard/shared.tsx:33/47` → Costs/Rental/Depreciation steps | List `flex gap-1 p-1 rounded-lg bg-zinc-900/50 w-fit`. Trigger `px-3 py-1.5 rounded-md text-sm 500`, active `bg-zinc-800 text-fg-primary`, inactive `text-fg-muted hover:text-fg-secondary` |
| Tabs | `stat` | `AdvancedColumn.tsx:243/248` | List `flex gap-[3px] p-[3px] rounded-[10px] bg-white/[0.03]`. Trigger `flex-1 flex-col rounded-[8px] py-[10px] px-3`, 2 lines (12px label, 17px value). Active bg = section colour, text surface-app. Inactive label colour 55%, value 50% / fg 20% |

### Inputs and form

| Component | Variant | Call sites | Look |
|---|---|---|---|
| Input | `filled` (+ suffix adornment) | `ui/Input.tsx` via `wizard/shared.tsx:28` (31 InputField uses) | `py-3 px-4 bg-input-bg border-0 rounded-lg text-base font-medium tabular-nums`, `focus:bg-input-bg-focus focus:ring-1 focus:ring-brand/25`, placeholder fg-muted. Suffix: abs right-3.5, 13px fg-tertiary, input `pr-10 w-full` |
| Input | `form` | auth (6), `PurchaseCostsView.tsx:207`, `:211` | `.form-input`: h-44 px-16 rounded-8, 1px border-default, bg surface-raised, 15px 500 tabular. Hover border-strong + bg surface-hover. Focus brand 50% border, brand 5% bg, 3px focus-ring. Placeholder fg-secondary 40% 400 |
| Input | `bar` | `GrantsView.tsx:53` | h-30 centred, `rounded-lg border-white/[0.06] bg-white/[0.04]` 15px 600, hover white/10 + bg 6%, focus brand/40 + 2px brand-10% ring |
| Input | `underline` | `wizard/shared.tsx:89` (9 EditableRow uses), `DepreciationStep.tsx:155,167,235,246,259` | Transparent, `border-b border-transparent hover:border-zinc-700 focus:border-brand py-1 text-sm text-fg-secondary`, placeholder fg-muted/50 |
| Input | `ghost` (click-to-edit) | `EditableValue.tsx:15`, `Slider.tsx:83`, `AdvancedColumn.tsx:194` | Transparent, no outline, caret accent. Text styles come from the caller. AdvancedColumn editing state: `bg-white/[0.06]` + 1px colour ring |
| NativeSelect | `form` | `PurchaseCostsView.tsx:199`, `:215` | `.form-select` (h-44, chevron SVG at right 12px, same border/bg/hover/focus as `form`) |
| Label | `form` | auth `:39`, `:89`, `:123` | 13px fg-secondary 400 |
| Label | `field` | `wizard/shared.tsx:25`, `LoanStep.tsx:54` | `text-xs font-medium text-fg-secondary` |
| Label | `caps` | `PurchaseCostsView.tsx:198,206,210,214`; `GrantsView.tsx:52` (15px variant, size `lg`) | 11px 600 uppercase `tracking-widest text-fg-primary/50` (Grants: 15px, fg-primary/70) |
| Switch | `default` | `ui/Toggle.tsx` → `AdvancedColumn.tsx:342` | Track 36×20 rounded-full, checked = accent 40%, unchecked `rgba(255,255,255,.08)`. Thumb 14px at 3px inset, 16px travel, checked accent / unchecked white/.3, 200ms |
| Switch | `glow` | `PurchaseCostsView.tsx:19` (×4) | Track w-9 h-5 **with 1px border**: checked `bg-brand/35 border-brand/50`, unchecked `bg-brand/12 border-brand/15`. Thumb 16px at 1px inset, `translate-x-4`, checked `bg-brand shadow-[0_0_8px_var(--color-brand)]` |
| Checkbox | `default` (18px), `lg` (20px rounded-md) | `wizard/shared.tsx:102` (4 uses); `ColumnDrawer.tsx:167` (lg) | Unchecked transparent + border. Checked brand bg/border + brand-contrast tick |
| Slider | `default` (accent var) | `ui/Slider.tsx` → `LoanControls.tsx` ×7 | Track h-[2px] `t.border.default` + `inset 0 1px 2px rgba(0,0,0,.25)`. Range accent 50%. Thumb 10px circle, 2px border accent 80%, bg surface-raised. Overall h-4 hit area |

### Surfaces and other components

| Component | Variant | Call sites | Look |
|---|---|---|---|
| Card | `glass` | GlassCard sites (9 instances, 5 files) | `.glass-card rounded-2xl backdrop-blur-md bg-surface-raised`, shadow + hover lift (globals.css:456) |
| Card | `panel` | `CashflowDashboard.tsx:288,448,564`; `CashflowDataTable.tsx:147` | `bg-card border border-border-subtle rounded-xl` |
| Card | `raised` | `PurchaseCostsView.tsx:195`, `:271` | `rounded-2xl bg-surface-raised` + brand-tinted CARD_SHADOW |
| Card | `auth` | `AuthCard.tsx` | `var(--color-card)`, 1px border-default, r12, p28, max-w 400, shadow |
| Card | `wizard` | `CashflowView.tsx:69`, ModalWizardShell card | `rounded-2xl border-white/[0.06] bg-surface-raised/60-80 backdrop-blur-xl` |
| Card | `scheme` *(optional)* | `DenseSchemeCard.tsx:194`, `:212` | `rounded-[18px] bg-white/[0.04] border-white/[0.08]`, 3px top accent border, shadow + hover shadow |
| Dialog | `wizard` | `ModalWizardShell` | Overlay `bg-black/60 backdrop-blur-md animate-overlay-in`. Content: no padding, `animate-card-pop-in`, custom close |
| Dialog | `scheme` | `DenseSchemeCard.tsx:210` | Overlay `bg-black/65 backdrop-blur-sm`, `p-12` (`max-[900px]:p-4`), content max-w 720 |
| Sheet | `drawer` | `ColumnDrawer` | Right side, w-72, bg `t.card.base`, border-l subtle, blur 12px, float shadow, 300ms ease-out |
| Table | `dense` | 6 cashflow sub-tables | See §2.4 |
| Tooltip | `surface` | `PropertyTable.tsx:43` | bg `t.card.elevated`, 1px border-default, `elevation.raised`, `rounded-md px-2.5 py-1.5 text-[11px]`, no arrow, 0 delay |
| Progress | `default` | `WizardSidebar.tsx:119` (+ optional `PasswordStrength.tsx:47`) | h-1.5 `bg-white/[0.06]` rounded-full, brand indicator, 500ms ease-out |
| Skeleton | `default` | `KpiCards.tsx` | `inline-block animate-pulse rounded-md bg-border-default` (span) |
| Badge | `brand`, `tinted`, `muted`, `stat` *(all optional)* | `ColumnDrawer.tsx:239`, `DenseSchemeCard.tsx:157`, `[tool]/page.tsx:39`, `TaxBreakdown.tsx:330/337` | As the current inline styles |
| Collapsible | n/a | `CashflowDashboard.tsx:295/370`, `CashflowSidebar.tsx:140/160`, `PurchaseCostsView.tsx:64` | No animation, except CashflowSidebar, which keeps its max-h transition |

---

## 4. Parity risks

| # | Item | Risk | Recommendation |
|---|---|---|---|
| R1 | **Slider** (`ui/Slider.tsx`, 7 uses) | (a) Radix keeps the thumb **inside** the track bounds (`inBoundsOffset`). Today's thumb is centred on `pct%` with `-translate-x-1/2`, so it overhangs the ends by 5px, and that shifts at min/max. (b) The Radix thumb is a focusable span, so focus rings would appear where today there are none (opacity-0 native input). (c) Keyboard: Radix adds PageUp/PageDown/Home/End and steps by `step`; today the native input uses `step="any"` and rounds afterwards. (d) The click-to-edit value input must stay outside the Radix root. | Use the Radix Slider with custom `SliderThumb` positioning, or keep the custom visuals and swap only the hit area. Set `focus-visible:ring-0` to keep today's look, or decide to add a ring on purpose. Snapshot `/amortisation` at min, max and mid values. |
| R2 | **Native `<select>`** (`PurchaseCostsView.tsx:199`, `:215`) | Radix Select replaces the OS dropdown with a popover (different look, typeahead, scroll buttons, portal, mobile behaviour). | Use shadcn's **NativeSelect** pattern (styled native `<select>` + chevron), variant `form`. Existing quirk: `.form-select:hover { background: … }` uses the `background` **shorthand**, which wipes the chevron `background-image` on hover. Preserve it on purpose (parity) or fix it and update snapshots. |
| R3 | **Dialogs** (`ModalWizardShell`, `DenseSchemeCard` overlay) | Radix Dialog adds a focus trap, initial focus on the first focusable (could scroll or focus-ring a wizard input), `aria-hidden` on siblings, a portal (z-index/stacking change; today it is inline `z-50` / `z-[100]`), pointer-events lock, and scroll lock via `react-remove-scroll` (scrollbar-gap padding, a possible layout shift). shadcn DialogContent defaults (`p-6`, border, `max-w-lg`, built-in X, zoom/fade animations) all differ. DenseSchemeCard closes on **mousedown** outside, while Radix closes on pointerdown outside. | Restyle DialogContent fully: strip the defaults and reuse `animate-overlay-in` / `animate-card-pop-in`. Use `onOpenAutoFocus={e => e.preventDefault()}` where today nothing is focused. Check the scroll-lock layout shift (the current code sets only `overflow:hidden`). Keep the compact DenseSchemeCard `invisible` placeholder. |
| R4 | **Sheet** (`ColumnDrawer`) | shadcn Sheet uses keyframe slide animations and a default overlay `bg-black/50`. Today it is a CSS transition `translateX` 300ms ease-out, overlay `t.surface.overlay`, and the panel stays **mounted** while closed (always in the DOM, translated off-screen). | Override the animation classes and overlay colour. Snapshots of the closed state are unaffected. Check the open snapshot. |
| R5 | **ToggleGroup / Tabs keyboard semantics** | Radix gives these groups a single tab stop with arrow-key roving focus (`role="radio"`/`"tab"`). Today every pill and segment is its own tab stop. `type="single"` lets the user deselect, which is right for Grants but wrong for the Chart/Table, frequency, SetupStep and dashboard tabs. | Accept the keyboard change (it is an improvement) but note it. Guard the non-deselectable groups: ignore an empty value in `onValueChange`. |
| R6 | **AmortisationTable** div-grid → `<table>` | Table layout changes how column widths are computed (`52px_1fr…` grid vs auto table layout). The header sits outside the scroll div today, and making a `<thead>` sticky inside an overflow container changes the scrollbar geometry. | Optional. Either keep the grid (it's not a `<table>` today), or use `table-fixed` + `<colgroup>` + a sticky thead, and re-snapshot. |
| R7 | **Progress** (WizardSidebar, PasswordStrength) | Radix Progress animates the indicator with `transform: translateX(-x%)`. Today it animates `width`. The visual end state is identical, but the transition curve looks different, and a `rounded-full` indicator gets clipped differently. | Keep `width`-based custom markup inside the Progress root (or skip Progress for PasswordStrength). |
| R8 | **Checkbox** tick | The current tick is CSS-drawn (rotated borders, 4×8px at 3px/6px). shadcn uses a lucide `Check` icon. | Render a custom tick in `CheckboxIndicator` to match pixel-for-pixel. |
| R9 | **Tooltip** (PropertyTable header) | Radix Tooltip uses a 700ms default delay, a portal, collision flipping, side offsets and fade/zoom animation. Today it shows instantly under the header, right-aligned, with no animation. | `delayDuration={0}`, `side="bottom" align="end" sideOffset={6}`, no animation, `variant="surface"`. Don't convert native `title` attributes unless you accept the visual change. |
| R10 | **Switch** | Radix Switch is a `button[role=switch]` with `data-state`. Fine. The label is clickable only through `Label htmlFor`/wrapping, and today ui/Toggle wraps everything in `<label>`. PurchaseCosts Toggle has **no ARIA**, so adding it is an a11y change with no visual change. | Wrap in `Label` to keep the whole row clickable. |
| R11 | **Card / Button base classes** | shadcn `Card` base (`rounded-xl border bg-card py-6 shadow-sm gap-6 flex-col`) and `Button` base (`gap-2`, `[&_svg]:size-4`, `focus-visible:ring-[3px]`, `aria-invalid` styles, `shrink-0`, `whitespace-nowrap`) inject padding, gap, icon size and focus ring. | Strip the base to the minimum in our generated `card.tsx`/`button.tsx`. Pay particular attention to `[&_svg]:size-4`, which would resize the 13–16px lucide icons. |
| R12 | **Global CSS / token collisions** | See G1–G3 (`--color-card`, undefined tokens that shadcn would define, the `*` border base rule). | Handle these before installing any component. |
| R13 | **Nested interactive** (`CashflowSidebar.tsx:140` span[role=button] inside `WizardSidebar` step `<button>`) | `CollapsibleTrigger` renders a `<button>`, and nesting it inside a button is invalid HTML (hydration warning). | Use `asChild` on a span (keeping today's markup), or restructure so the step row is a div with two sibling buttons. |
| R14 | **Recharts tooltips / legend** | n/a | Out of scope; untouched. |

---

## 5. Out of scope and dead code

### Untouched

- **recharts** (all charts, `ChartTooltip`, recharts `<Tooltip>`, `Cell` handlers).
- **lucide-react** icons. Watch the Button `[&_svg]` sizing (R11).
- **Hooks**: `src/hooks/*`, including `useEditableInput`, `useHighlight`, `useFocusMode`, `useFillHeight`, `useAnimatedValue` and `useWizardSteps`.
- **API code**: `lib/api.ts`, `lib/api-types.ts`, `lib/platform-api.ts`, `lib/auth-token.ts`, `contexts/AuthContext.tsx`.
- **Formatters / calculations / types / theme**: `lib/formatters.ts`, `lib/calculations.ts`, `lib/cashflow-calculations.ts`, `lib/depreciation-estimate.ts`, `lib/*-types.ts`, `lib/constants.ts`, `lib/theme.ts`. Keep `t.*` and `mix()`; variants may reference them through CSS vars.
- Data-viz interactions: the TaxBreakdown donut, waterfall and legend; `KpiSparkline` (dead anyway); the CashflowDashboard progress bars.

### Dead code: delete, don't migrate

| Item | Evidence |
|---|---|
| `src/components/ui/DeltaPill.tsx` | No import sites |
| `src/components/ui/TableCell.tsx` | No import sites |
| `src/components/ui/UnderlineTabs.tsx` | No import sites |
| `src/components/ui/KpiTile.tsx` | Only imported by the dead `CashflowKpiStrip.tsx` |
| `src/components/cashflow/CashflowKpiStrip.tsx` | No import sites |
| `src/components/cashflow/KpiSparkline.tsx` | Only imported by the dead `CashflowKpiStrip.tsx` |
| `src/components/cashflow/CashflowChart.tsx` | No import sites |
| `src/components/auth/ProtectedRoute.tsx` | No import sites |
| `src/components/layout/GlobalsTray.tsx` | Imported by `AppShell`, but renders an empty div (stub). Delete it, or keep it on purpose |
| `cashflow/table/helpers.ts`: `growthPct`, `getValueClass`, `getLvrClass`, `getLvrColor`, `thClass`, `thStyle`, `tdClass`, `tdStyle`, `gainCls`, `gainStyle` | Only `yoyPct`/`fmtYoY` are imported (`EquityTable.tsx:5`) |
| `ui/Input` `size="sm"`; `ui/Slider` `variant="compact"`; `ui/Toggle` `accent` and non-`reverse` layout | No production callers (the Toggle test uses the non-reverse layout) |
| `ui/wizard` exports `UseWizardStepsResult`, `WizardSidebarProgress` | Not imported outside the `ui/wizard` folder |
| `globals.css`: `.tip`/`data-tip` (243–269), `.col-group-h*` (198–228), `.sb-nav-item*` (231), `.inc-zone`/`.out-zone`/`.cf-zone`/`.zone-start`/`.row-gsep` (272–277), `.row-summary*`/`.row-milestone*`/`.tbl .num--*`/`.cashflow-table-shell` (291–339), `.animate-col-fade-in` (434–438, only used by dead TableCell), `.home-bg-glow` (445), `.glass-card-hover` (541), `.shadow-glow-sm` (548) | 0 usages in `src/**/*.ts(x)` |

The live global CSS to fold into variants and then remove:

- `.form-input`, which becomes `Input/form`
- `.form-select`, which becomes `NativeSelect/form`
- `.auth-cta*`, which becomes `Button/cta-glow`
- `.glass-card`, which becomes `Card/glass`

`.custom-scrollbar`, `.animate-*`, `.auth-bg`, `.home-bg-noise` and `.auth-pulse-ring` stay.
