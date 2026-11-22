# Design System

Premium minimalism: Swiss and editorial structure, generous whitespace, thin borders, restrained shadows, a subtle blueprint grid, and motion that guides rather than decorates. **See every component live at `/components`.**

## Tokens — `client/src/styles/globals.css`

All colors are CSS variables using shadcn/ui naming. Re-theme the whole app by editing **only** the `:root` (light) and `.dark` blocks.

| Token | Light | Use |
| --- | --- | --- |
| `--background` | `#F8F9F6` | page background |
| `--foreground` | `#17231C` | primary text, dark buttons |
| `--primary` | `#26734D` | brand accent: primary buttons, active states, focus ring |
| `--muted-foreground` | `#78847B` | secondary text, labels |
| `--border` | `#E4E9E3` | every hairline border |
| `--card` / `--popover` | `#FFFFFF` | raised surfaces |
| `--accent` | `#E8F0EA` | hover backgrounds |
| `--destructive` / `--warning` / `--info` / `--success` | | semantic states |
| `--chart-1…5` | | chart series |
| `--radius` | `0.625rem` | base corner radius (sm / md / lg / xl derive from it) |
| `--grid-line`, `--grid-size` | | blueprint grid |

Tailwind utilities map 1:1 to these tokens: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-primary/10` and so on.

### Re-theming in 2 minutes

```css
:root {
  --primary: #3b5bdb;          /* new brand color */
  --ring: #3b5bdb;
  --accent: #edf2ff;           /* a very light tint of the brand */
  --chart-1: #3b5bdb;
}
.dark { --primary: #748ffc; --ring: #748ffc; --chart-1: #748ffc; }
```

Keep contrast at **4.5:1 or better** for text. Check the button label against `--primary` in DevTools.

## Typography

| Role | Font | Class |
| --- | --- | --- |
| Display (headings, numbers) | Inter Tight 600 | `font-display` |
| Body | Inter 400/500 | default |
| Labels, eyebrows, code, table headers | JetBrains Mono | `font-mono`, `eyebrow` |

Scale: page title `text-2xl`/`sm:text-[28px]` · card title `15px` · body `14px` · captions `12.5–13px` · eyebrow `11px` uppercase, tracked.

## Utilities

- `bg-blueprint`: subtle grid. Pair it with `mask-fade-b` to fade it out downward.
- `eyebrow`: small uppercase mono label.
- `tabular`: tabular numbers for tables and counters.
- `scrollbar-thin`: a quiet scrollbar.

## Components

| Group | Files |
| --- | --- |
| Primitives (`components/ui`) | `button`, `input`, `textarea`, `select`, `checkbox`, `label`, `field`, `badge`, `card`, `modal`, `confirm-dialog`, `dropdown-menu`, `tabs`, `tooltip`, `toast`, `skeleton`, `spinner`, `avatar` |
| Composites (`components/shared`) | `DataTable`, `SearchBar`, `Pagination`, `Breadcrumbs`, `StatCard`, `PageHeader`, `FormContainer`/`FormSection`, `AnimatedCounter`, `Reveal` (`Stagger`, `TextReveal`), `Charts` (`AreaChart`, `BarChart`), `StatusBadge`, `ThemeToggle`, `Logo` |
| Feedback (`components/feedback`) | `EmptyState`, `ErrorState`, `LoadingSkeleton`/`PageLoader`, `ErrorBoundary` |
| Layout (`components/layout`) | `AppLayout`, `Sidebar`, `Navbar`, `NotificationsMenu`, `ProfileMenu` |

Each file starts with a usage comment. The primitives follow shadcn/ui conventions (Radix + `cva` + `cn`), and `components.json` is configured. **Caution:** `npx shadcn add <name>` overwrites a same-named file in `components/ui`. Add new components freely, but don't re-add the existing ones.

## Motion — `client/src/lib/motion.js`

| Effect | Where |
| --- | --- |
| Page transitions (fade + 8px lift) | `AppLayout` (`pageVariants`) |
| Staggered entrances | `Stagger` / `StaggerItem`, `DataTable` rows |
| Text reveal | `TextReveal` (used by `PageHeader`) |
| Button tap / card hover lift | `Button`, `Card interactive` |
| Modal enter and exit | `Modal` (`modalVariants`) |
| Sidebar collapse / mobile drawer | `Sidebar` (spring width / slide) |
| Active nav and tab indicators | shared `layoutId` springs |
| Counters | `AnimatedCounter` (in-view, no re-render per frame) |
| Loading | `Skeleton` shimmer, `Spinner`, table progress bar |

**Reduced motion:** `<MotionConfig reducedMotion="user">` in `main.jsx` disables transform animations, `globals.css` neutralises CSS animations, and `TextReveal` and `AnimatedCounter` render static output.

Guidelines: durations of 150–450ms, the expo-out easing `[0.16, 1, 0.3, 1]`, and movement of 12px or less. No glows, bounces or parallax.
