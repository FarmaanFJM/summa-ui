# Workspace pattern

Status: draft contribution, not approved guidance. It documents a pattern found while migrating CaissaTrainer (Vue 3) onto the v0.1.0 bundle and ships a framework-neutral reference. Nothing in `guidance/` or `PRINCIPLES.md` changed. The candidate principles (P23 to P26) and the candidate presets travel in `feedback/proposals/PR-0002` and only the owner can approve them into a later release. Evidence: `FB-0014` to `FB-0018`, extended by `FB-0020` to `FB-0024` (CaissaTrainer Phase 2).

A workspace is a page whose job is one primary region (an image, a canvas, a document page, a map, a board) with secondary information around it. The pattern keeps that region primary while the person resizes it, hides information, or changes the window.

## 1. The pattern

1. **The primary workspace stays primary.** It is never squeezed below a usable minimum, stays centered, and is the last thing to give up room.
2. **Progressive disclosure of secondary information.** Details live in side panels that can be hidden. Hidden is a state the person chooses, not content that was deleted.
3. **Panels yield before the primary region.** The responsive default is sized against the panels' minimum widths, and panels then grow into what is left up to their preferred width. When space runs out they shrink to the minimum, then leave the layout and become an on-demand drawer, and on a narrow screen the layout stacks under the primary region. A panel is never destroyed; it stays mounted so its state survives. The default is never the reason a panel becomes a drawer.
4. **Equal reserve keeps the primary region centered.** Both flanks reserve the same width, so a lone panel does not push the primary region off center. Width a panel does not use stays empty.
5. **A layout choice is a preference, never a measurement.** The size a person picks is stored as the pick. A small window clamps what is shown and never rewrites what is stored.
6. **Do not fix the size of central content.** A fixed pixel box is wrong on one of the screens it meets. The default is responsive and deliberately medium; the person can go larger or smaller.
7. **Controls about the region are attached to it.** A control rail beside the region (below it when stacked) holds a resize handle and one options menu. The page toolbar holds only page level things: the title and one labelled toggle per panel. The rail width is reserved on both sides so centering holds.
8. **Optional tools start closed.** A duplicate view of the primary object is secondary, closed by default and capped well below the primary region; a remembered choice; nothing essential is hidden behind it.
9. **Chrome is measured, not guessed, and held at its peak.** Headers, captions and answer areas around the primary region are measured. The tallest value seen since the workspace opened is used, so a footer that appears or disappears never makes the region jump.

## 2. Geometry (the numbers)

`src/ui/workspaceGeometry.ts` is the framework-neutral reference: pure arithmetic, no DOM, no framework, erasable TypeScript. It is a port of CaissaTrainer's `workspaceLayout.ts` with the same API and constants, so two apps in different frameworks produce the same layout. Input is the measured width and height, padding, gap, the optional `rail` width, chrome height, the two panel specs, whether each is open, and the stored preference. Output is the effective size, what each panel is doing, and `gapX`, the horizontal gap between the region and a docked panel with the rail included (the plain gap when stacked).

| Constant | Value | Meaning |
| --- | --- | --- |
| `PRIMARY_MIN` | 280 | Narrowest size a person can pick |
| `PRIMARY_FLOOR` | 240 | Hard floor on very small spaces (the page then scrolls) |
| `DEFAULT_CAP` | 640 | Largest responsive default, deliberately below the maximum |
| `DEFAULT_FLOOR` | 320 | Smallest responsive default on a roomy screen |
| `DEFAULT_FILL` | 0.88 | The default takes this share of what fits beside the panels |
| `STACK_BREAKPOINT` | 640 | Below this workspace width the layout stacks |
| `SIZE_STEP` | 40 | Keyboard and button step |
| `SIZE_SNAP` | 8 | Sizes snap to this grid so a square lands on whole pixels |

Panel docking: a panel docks when the equal flank (`(available width - size) / 2 - gap - rail`) is at least its minimum width; its width is `min(preferred, flank)`. Otherwise it is a drawer. The layout stacks when the workspace is narrower than `STACK_BREAKPOINT`, or when the open panels cannot dock even beside a minimum-size region. Stacked panels stay visible below the region; nothing the person needs hides behind a drawer only because the screen is small.

Default size: `fits` is the smaller of the available height and the largest size that still docks both open panels at their minimum widths (rail included); the default is `fits * 0.88` snapped down and clamped between a floor and `DEFAULT_CAP`. The floor is the smaller of `DEFAULT_FLOOR` and what still docks at the minimums (never below `PRIMARY_MIN`), so a medium default cannot push a panel into a drawer. Earlier drafts sized the default against the preferred widths; on a laptop that left a small region beside wide panels (FB-0023).

## 3. Preferences

What to store, and with what scope (reference: `useWorkspacePreferences` in `src/ui/workspace.tsx`):

- `size`: the size the person chose in px, or `null` for the responsive default. One value for all workspaces of an application, so moving between compatible screens does not change the region under them.
- `panels`: visibility per workspace key and side. Panels carry different information in different screens, so each remembers its own. Absent means the workspace's own default.
- `sidebarCompact`: `null` means the route decides (a workspace route defaults to the rail, a document-like page to expanded); a boolean is an explicit choice and always wins.
- Device-local by default: a comfortable size depends on the screen in front of the person, not on the account.
- Validate what you read (finite number, sane range), and guard every storage access with try/catch. A private window or a full quota must degrade to defaults for the session, never throw.
- Provide a way back: one control that restores the default size and the workspace's standard panels.

## 4. Chrome and the primary box

The primary box is at least a square of the computed size; extra content grows it downward instead of overlapping. Header and footer content go through the `primaryHeader` and `primaryFooter` slots so they can be measured (`ResizeObserver`). The reference keeps the peak of each since the workspace key changed. Do not guess a height constant for chrome that can change.

## 5. Keyboard and ARIA contract

Control rail (beside the region when wide, below it when stacked; quiet at rest, full emphasis on hover, focus and touch). Resize handle (a real `<button>` in the rail):

- `role="slider"`, `aria-label="Resize <name>"`, `aria-orientation="horizontal"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="<n> pixels"`.
- ArrowRight and ArrowUp enlarge by `SIZE_STEP`; ArrowLeft and ArrowDown shrink by it; Home sets the minimum; End sets the maximum. Values clamp and snap.
- Pointer: capture the pointer, update live while dragging, commit the preference on release. A horizontal pull counts double because the region stays centered and grows on both sides.
- It has the shared 1.5px neutral focus ring (P15, P17).

Options menu: one labelled menu button (`aria-haspopup="menu"`, `aria-expanded`) with Larger, Smaller, Largest that fits and Restore default size and panels. Enter, Space or ArrowDown opens; arrows, Home and End move and wrap; Escape closes and returns focus; Tab closes; a click outside closes. An item that cannot act is `aria-disabled`, not hidden.

Toolbar: `role="toolbar"` with a label, holding the title and one labelled toggle per panel. Toggles use `aria-pressed` (true while the panel is docked or its drawer is open) and a label that says what the press does ("Hide Pages" or "Show Pages").

Drawers (a panel that cannot dock):

- Opens from its toggle, over a scrim, as `role="dialog"` with `aria-modal="true"` and the panel title as its label.
- The toolbar, the primary region and the other panel are `inert` while it is open.
- Moves focus into the drawer when it opens; Tab and Shift+Tab stay inside; Escape closes only the drawer; closing returns focus to the toggle that opened it, after the update that lifts `inert` (focus cannot enter an inert element).
- A drawer that no longer applies (the window grew and the panel docks) closes by itself.
- Panels are labelled regions (`<section aria-label>`), not `<aside>` and not `nav`: they hold content, not navigation (see P14 and the CHK-011 note in the proposal).

## 6. Touch

At 820px and below, and on coarse pointers, every control has an effective hit area of at least 40x40 CSS px (P18, CHK-020): toolbar and rail buttons grow to `--hit`, and the rail buttons and menu items grow to the same hit size. Verify with real hit testing: `node scripts/test-tap-targets.mjs --apps workspace`.

## 7. Application sidebar: compact rail

The shell sidebar has three presentations of one navigation list: expanded (252px), a compact 56px icon rail, and the mobile drawer (820px and below, always labeled). The rail keeps the primary region's room on workspace pages and is still one sidebar, so P14 is not violated.

Reference: `AppShell` takes an optional `compact` prop (default `false`; with it off the markup and layout are identical to before). The rail sets `data-side="compact"` on the shell; CSS in `src/styles/workspace.css` narrows `.shell-side` to 56px on desktop widths only, centers icons and visually hides labels (clip, never `display: none`, so the accessible name stays) and `NavItem` adds a `title` so sighted users get a tooltip. `RailToggle` is the width control, placed at the bottom of the sidebar. Choose the mode by route and let an explicit choice win.

## 8. What not to build

- No zen, fullscreen or focus mode in this pattern. Making the primary region large is the "largest that fits" size, and hiding panels is the panel toggle. A separate mode adds a state and a way to get stuck.
- No fixed pixel size for the primary region, and no stored measurement.
- No second navigation sidebar next to the shell sidebar (P14). Panels carry content, never navigation.
- No panel that disappears with nothing to bring it back: every hidden panel has a visible toggle.
- No guessed chrome heights, and no layout that jumps when a footer appears.
- No decorative resize affordances (no glow, no gradient, no accent color on the handle).

## 9. Reference files

| File | Role |
| --- | --- |
| `src/ui/workspaceGeometry.ts` | Pure geometry, same API as CaissaTrainer's `workspaceLayout.ts` |
| `scripts/test-workspace.mjs` | 35 `node:test` cases (34 on the geometry including the rail, gapX, default against minimums and dockable floor, 1 drift guard for the candidate script) (`npm run test:workspace`) |
| `src/ui/workspace.tsx` | React `Workspace`, `useWorkspacePreferences`, `RailToggle` |
| `src/styles/workspace.css` | Workspace and rail CSS, tokens only |
| `src/lab/workspace/WorkspaceDemo.tsx` | Route `#/workspace`: a neutral document preview (not a registered application) |
| `feedback/proposals/PR-0002/candidate/` | Candidate presets `preset.workspace` and `preset.app-sidebar-rail` (JSON, CSS, HTML) |

## Credits

The equal-reserve idea (the same width on both sides keeps the primary region centered) is shared with the MIT-licensed Chess Zen Mode extension (`src/lib/layout.js`). Only the idea is shared. The geometry here and CaissaTrainer's implementation are independent code; neither copies that extension, which steers a third party page's CSS grid and does not size a primary region itself.
