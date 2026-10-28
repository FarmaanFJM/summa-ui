# Phase 3 baseline remediation

Minimal, targeted edits to the 12 approved prototypes so they comply with P17 to P20. No layout redesign. Before/after screenshots are in `shots/p3/` (`before-<app>-<width>.png`, `after-<app>-<width>.png`, extra routes as `after2-*`).

## P20 No decorative placeholder identity

| File | Before | After |
| --- | --- | --- |
| `src/ui/index.tsx` (`Avatar`) | Always rendered initials from `name` in a circle. | Opt-in only. Takes `src` or `children` (real imagery) or an explicit `initials` prop. Renders nothing when none is given. Doc comment says: real imagery only, otherwise show plain name and metadata. |
| `src/apps/ai/Sidebar.tsx` | Account row: initials circle + name. | Plain name + chevron. |
| `src/apps/analytics/index.tsx` | Sidebar user row: initials circle + "Meridian Inc.". | Plain "Meridian Inc." text. |
| `src/apps/executive/index.tsx`, `executive.css` | Top bar account button was an initials circle. | `IconButton` with the shared `user` icon, label "Account menu" (same menu). Circle CSS removed. |
| `src/apps/executive/cells.tsx`, `executive.css` | Activity feed rows had initials circles. | Name is already in the row text; circle removed. |
| `src/apps/projects/parts.tsx`, `projects.css` | Row and card assignee were initials circles. | Muted first-name text (`.pm-assignee`, 64px right-aligned column on rows; truncating text on cards). Full name in `title`. |
| `src/apps/projects/Detail.tsx` | Assignee value and comments used circles; assignee options had a `user` icon. | Plain full name in the property value; comments start with the bold name; options are plain names (also removed the icons on Unassigned). |
| `src/apps/files/FileViews.tsx`, `files.css` | Shared-with column: up to 3 initials circles plus "+N". | Muted text: first name for one person, "N people" otherwise; full list in `title`. Helper renamed `SharedWith`. |
| `src/apps/chess/Game.tsx`, `Standings.tsx`, `chess.css` | Player strips and standings rows had initials circles. | Plain name, rating, colour (existing metadata). Circle CSS removed. |
| `src/apps/travel/index.tsx`, `travel.css` | Account button was an initials circle. | `IconButton` with the shared `user` icon, label "Account menu". |
| `src/apps/social/Post.tsx`, `social.css` | `Face` rendered initials on a palette gradient (all sizes, post, comment, notifications, rail, profile, composer, top bar). | Purely graphic generated SVG avatar: palette gradient, three seeded abstract circles and a soft hill, clipped to a circle. No letters. Same sizes and props (`u`, `size`), so every call site stays consistent. This is deliberate content for a content-first platform, not a placeholder. |

## P19 No washed-out destructive buttons

`.btn-danger` is now a solid background (lead's change), so every `Button variant="danger"` is already compliant. Remaining changes:

| File | Before | After |
| --- | --- | --- |
| `src/apps/trading/Tables.tsx` | Positions "Close" in dense table rows used the danger variant. | Neutral `secondary` button (readable text, no red tint). |
| `src/apps/travel/Trips.tsx` | "Cancel booking" in each trip card was a danger button. | Neutral secondary in the list; the confirm dialog keeps the solid danger button. |
| `src/apps/travel/Book.tsx`, `travel.css` | `.tv-banner`: pale red text on `--danger-soft` tint. | Neutral `--s2` surface, `--text` readable copy, `--danger` alert icon. |
| `src/apps/ai/Sidebar.tsx` | Dialog button "Delete". | "Delete conversation" with trash icon. |
| `src/apps/projects/index.tsx` | Dialog button "Delete". | "Delete task" / "Delete tasks" with trash icon. |
| `src/apps/documents/index.tsx` | Dialog button "Delete". | "Delete document" with trash icon. |
| `src/apps/files/index.tsx` | Dialog button "Delete forever" / "Empty trash". | Same verbs, with trash icon added. |
| `src/apps/chess/Game.tsx` | Dialog button "Resign". | "Resign game" with flag icon. |

Left as is on purpose: destructive menu items (danger text, icon, last in menu), the trading Sell submit (trade direction colour with dark readable text on a solid fill, not a destructive tint), error text under fields.

## P17 Subtle focus and selection

| File | Before | After |
| --- | --- | --- |
| `src/apps/files/files.css` | `.files-card.sel` and `.files-mrow.sel` had a 1px `--focus` frame plus fill. Keyboard focus ring was skipped on selected rows/cards. | Selection is a quiet fill only (`--select-strong` for cards, `--select` for mobile rows). Keyboard focus ring now also shows on selected rows and cards. Drop targets keep a 1px ring. |
| `src/apps/media/media.css` | Now-playing tile ring 1.5px `--text-2`. | 1.5px `--text-3` (about 3.5:1 on the page) with caption still shown. |
| `src/apps/store/store.css` | Selected swatch and selected thumbnail ring in full `--text`. | Same 1.5px ring in `--text-2`. |
| `src/apps/chess/chess.css` | Legal-move hint inset ring 4px; keyboard cursor two-tone 3px + 5px. | Hint 2px; cursor 1.5px dark + 1.5px light (still readable on both square colours). |

Audited and unchanged: field focus rings (1px `--focus`), `.cb-grid`/range/chart focus outlines (1.5px `--focus`), projects row cursor (1px `--focus`). Measured contrast of `--focus` (rgba(236,236,235,.5)) over surfaces: s0 4.66, s1 4.56, s2 4.38, s3 4.13 (all above 3:1).

## P18 Mobile navigation breathing room

All edits are inside `max-width: 820px` (or the existing app breakpoints / container queries), so desktop layouts are unchanged. Topbars are 56px tall (or wrap with 12px vertical padding and 12px row gaps) and their controls are 40px minimum.

| App / file | Change |
| --- | --- |
| Projects `projects.css` (container <= 560px) | Topbar padding 6/8 to 12px, row gap 6 to 12px, controls and search 40px, tabs 36px. |
| Files `files.css` | Topbar 56px with 8px padding, controls 40px; search subbar padding 4/12/16; sort button 40px. |
| Media `media.css` | Topbar row gap 6 to 12px, controls 40px, tabs 36px, scroll area top padding 4 to 12px. |
| Executive `executive.css` | Topbar 56px, gap 8px; tab row padding 4/12/16 with 40px tabs; main top padding 4 to 12px. |
| Analytics `analytics.css` | Topbar padding 4/8/8 to 8/8/12, row gap 4 to 12px, controls 40px; scroll top padding 8px. |
| Social `social.css` (<= 719px) | Top bar 48 to 56px; tab bar padding 8 to 12px; composer padding 6/14/14 to 8/14/16. |
| Trading `trading.css` (mobile) | Top bar 48 to 56px (marquee sticky offset updated); header padding 10/12 to 16px; chart bar padding 12px; bottom tab bar gets 4px top padding. |
| Store `store.css` (<= 899px) | Header gap 4 to 8px with 40px icon buttons; sticky toolbar padding 8 to 12px; home top padding 12 to 16px. |
| Travel `travel.css` (<= 720px) | Header controls gap 8px, 40px targets; search card padding 8 to 12px with 12px gaps; results filter bar margin 16px, padding 12px, controls 40px. |
| AI, Documents, Chess | Reviewed at 390x844 and 375x667; already roomy, no change. |

## Verification

`npx tsc --noEmit` and `npx vite build` pass. All 12 routes plus extra routes (travel results, store category, project detail, notifications) loaded at 1440x900, 390x844 and 375x667 with no console or page errors and no horizontal overflow at mobile widths. No U+2014 in the owned paths.

## Lead changes made after remediation (shared files)
- `src/styles/tokens.css`: `--focus` alpha 0.62 to 0.5; `--danger` `#ef7070` to `#f27f7f` (danger text now at least 4.5:1 on `--s4`); new `--danger-solid` (`#c53d3d`), `--danger-solid-hover` (`#b23535`, white text 6:1) and `--danger-ink`.
- `src/styles/base.css`: focus outline 1.5px, input ring 1px, `.btn-danger` solid (was pale red on tint), dialog inputs, secondary buttons and tabs one step lighter than the dialog surface.
- `src/ui/icons.tsx`: now generated from the pinned Lucide catalog (`npm run icons:build`). Names unchanged; some shapes differ slightly (for example `more-h`, `circle-half`).
- `src/apps/social/icons.tsx`, `src/apps/store/icons.tsx`: hand-drawn app-local icons removed; wrappers now forward to the shared `Icon` (one icon family).
- `src/ui/index.tsx`: `Dialog` custom widths use `min(Npx, 100%)` so they cannot overflow on mobile.
