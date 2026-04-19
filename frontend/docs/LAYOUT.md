# Layout System

MortgageModeler uses a two-region dashboard shell at every authenticated route: a fixed-width sidebar on the left and a scrollable main content area on the right.

## Structure

- `<AppShell>` — provides the structural shell. Used in `app/layout.tsx`. Every authenticated page renders inside it automatically.
- `<Sidebar>` — brand, primary nav, utility nav. Width fixed at 240px.
- `<GlobalsTray>` — floating top-right of main area. Holds global actions like the theme toggle.
- `<PageHeader>` — title, optional subtitle, optional actions slot. Every page renders one at the top.

## Dimensions

- Design canvas: 1440×900
- Minimum supported viewport: 1024px wide
- Sidebar width: 240px (fixed)
- Main content area: fills remaining width, with a 1200px max-width cap on inner content
- Page padding: 36px horizontal, 32px vertical
- Main content usable width at 1440 viewport: 1440 − 240 − 72 (padding) = 1128px → caps at 1200

## Key decisions

### Why 240px sidebar?
Fits all current tool names (excluding "Government Grants" which is being redesigned) with icon + comfortable padding. Matches the Linear/Vercel convention in the 240–256 range. Leaves 1200px of usable content at 1440 viewport.

### Why recessed sidebar (darker than content)?
Matches the existing elevation ramp (`--color-surface-page` < `--color-background` < `--color-surface-raised` < ...). Sidebar reads as chrome that sits behind content; cards and content come forward. Content hierarchy is reinforced, active nav state (teal-tinted) stands out against the darker sidebar background.

### Why 1200px max content width?
Dashboard UIs benefit from capped content because wide tables and charts become hard to scan at monitor-width. 1200px comfortably fits the Cashflow tables (wide column groups), KPI strips, and waterfall breakdowns. At 1440 viewport with a 240px sidebar, 1200px max leaves symmetric whitespace that reads as intentional rather than empty.

### Why fixed (not collapsible)?
Collapsible sidebars double the layout complexity — responsive behaviour, persisted state, keyboard shortcuts, animation. For a solo-dev project at v0.x, the ROI is poor. Revisit if the need becomes real.

### Why sidebar is 240, content is 1200?
Sum: 240 + 36 + 1200 + 36 = 1512px. At a 1440px viewport, content saturates rather than capping — the page uses its full available width. At a 1920px viewport, content caps at 1200 and leaves symmetric margins. Below 1440 the content area shrinks naturally. This is the intended behaviour.

## Content-width primitives (future)

When pages need narrower content widths than 1200px:
- Long prose / help pages — wrap in a 640px container
- Forms — wrap in an 800px container

These primitives aren't built yet. Add them when a page needs one.

## Out of scope for v1.0

- Mobile responsive (below 1024px viewport)
- Collapsible sidebar
- Multi-workspace support (no sidebar workspace switcher)
- Sidebar-integrated property/scenario switcher (uses page header subtitle for now; dedicated switcher deferred)

## Conventions

- Every authenticated page uses `<PageHeader>` at the top. No freehand `<h1>` in page files.
- Page chrome (sidebar, top-right globals, padding, max-width) is provided by the shell. Pages only render their content.
- Action buttons specific to a page go in `<PageHeader>`'s `actions` prop. Global actions (theme, help, account) go in `<GlobalsTray>`.
- Nav item active state is automatic — `Sidebar` uses `usePathname` to detect the current route.
