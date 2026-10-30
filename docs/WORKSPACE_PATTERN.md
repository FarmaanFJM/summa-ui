# Workspace pattern

Status: draft contribution, not approved guidance. It documents a pattern found while migrating CaissaTrainer (Vue 3) onto the v0.1.0 bundle and ships a framework-neutral reference. Nothing in `guidance/` or `PRINCIPLES.md` changed. The candidate principles (P23 to P26) and the candidate presets travel in `feedback/proposals/PR-0002` and only the owner can approve them into a later release. Evidence: `FB-0014` to `FB-0018`, extended by `FB-0020` to `FB-0024` (CaissaTrainer Phase 2) and revised by CaissaTrainer Phase 3 (`FB-0036`, `FB-0037`, `FB-0040`, `FB-0041` and the updates recorded on `FB-0021`, `FB-0023`, `FB-0027`, `FB-0034`).

A workspace is a page whose job is one primary region (an image, a canvas, a document page, a map, a board) with secondary information around it. The pattern keeps that region primary while the person resizes it, hides information, or changes the window.

## 1. The pattern

1. **The primary workspace stays primary.** It is never squeezed below a usable minimum, stays centered, and is the last thing to give up room.
2. **Progressive disclosure of secondary information.** Details live in side panels that can be hidden. Hidden is a state the person chooses, not content that was deleted.
3. **Panels yield before the primary region, optional ones first.** The responsive default is sized against the panels' minimum widths, and panels then grow into what is left up to their preferred width. When space runs out they shrink to the minimum, then leave the layout and become an on-demand drawer, and on a narrow screen the layout stacks under the primary region. The optional (left) panel becomes a drawer before the layout restacks, so opening it never makes the primary region smaller than `COMFORT_MIN`; the supporting panel (right) is the last to yield. A panel is never destroyed; it stays mounted so its state survives. The default is never the reason the supporting panel becomes a drawer.
4. **Hidden panels reserve nothing; the group is centered.** Only a panel that is open and docked takes width. The primary region and its open panels are centered as one group in the available width, and a hidden panel or a drawer leaves no empty column behind (an earlier draft reserved an equal width on both sides, which left a region with one panel stranded between empty columns; superseded, FB-0036). The region is also not flanked by equally prominent panels: the optional panel is a quiet surface, the supporting panel has no heading and no card, and its content sets the hierarchy.
5. **A layout choice is a preference, never a measurement.** The size a person picks is stored as the pick. A small window clamps what is shown and never rewrites what is stored.
6. **Do not fix the size of central content.** A fixed pixel box is wrong on one of the screens it meets. The default is responsive and deliberately medium; the person can go larger or smaller.
7. **Controls about the region are attached to it, and aligned to it.** A control rail beside the region (below it when stacked) holds a resize handle and one options menu. Beside the region the rail is one narrow rectangular column (32px, `--s2` surface, no border) exactly as tall as the region, 8px from its right edge, with the options control on the region's top edge and the resize control on its bottom edge, both on one horizontal alignment. It is positioned from the region's own box, never from page coordinates, so it follows the region when the region is resized. Floating transparent icons with no container and arbitrary insets look detached from the region (FB-0042). Stacked, it is a compact row under the region aligned to the region's right edge with 40px targets. (Candidate rule, not policy: see `feedback/proposals/PR-0002/candidate/amendments.md` section K.) The page toolbar exists only when the page has something to put in it (a title, module controls) and holds nothing about panels or size. The rail width is reserved on both sides so the region stays centered in its own column.
7a. **A panel is shown and hidden by an edge chevron, never by a toolbar button or an X.** A small quiet tab attached to the outer edge of the workspace, on the side of the panel it controls, always present, brighter on hover and focus, at full strength with a larger hit area on touch. It points the way the panel will move (outward to hide, inward to show). Its name says what a press does ("Hide Pages"), and it reports `aria-expanded` (is the panel on screen), never `aria-pressed`. A panel that is part of the workspace has no X: an X implies a dismissable window. An open drawer, which is an overlay, has a back chevron. When stacked, the optional panel is a full width disclosure row under the region (`aria-expanded`), and the supporting panel is always visible. (FB-0037)
8. **Optional tools start closed.** A duplicate view of the primary object is secondary, closed by default and capped well below the primary region; a remembered choice; nothing essential is hidden behind it. Which tools exist in which module is a per-module decision with a stated reason, and removing a tool never strands what the person already wrote (FB-0041).
8a. **Stacked order is task order.** Primary region first, then its status and answer controls, then the supporting panel, then optional tools behind a disclosure row. (FB-0040)
9. **Chrome is measured, not guessed, and held at its peak.** Headers, captions and answer areas around the primary region are measured. The tallest value seen since the workspace opened is used, so a footer that appears or disappears never makes the region jump.

## 2. Geometry (the numbers)

`src/ui/workspaceGeometry.ts` is the framework-neutral reference: pure arithmetic, no DOM, no framework, erasable TypeScript. It is a port of CaissaTrainer's `workspaceLayout.ts` with the same API and constants, so two apps in different frameworks produce the same layout. Input is the measured width and height, padding, gap, the optional `rail` width, chrome height, the two panel specs, whether each is open, and the stored preference. Output is the effective size, what each panel is doing (`docked`, `drawer`, `hidden`, `absent`), the docked widths, and `gapX`, the plain horizontal gap between the region and a docked panel (the rail margin is separate and sits on both sides of the region). `reserve` is always 0 and is kept only so older callers compile.

| Constant | Value | Meaning |
| --- | --- | --- |
| `PRIMARY_MIN` | 280 | Narrowest size a person can pick |
| `PRIMARY_FLOOR` | 240 | Hard floor on very small spaces (the page then scrolls) |
| `DEFAULT_CAP` | 720 | Largest responsive default, deliberately below the maximum (640 in the Phase 2 draft) |
| `DEFAULT_FLOOR` | 320 | Smallest responsive default on a roomy screen |
| `DEFAULT_FILL` | 0.92 | The default takes this share of what fits beside the open panels (0.88 in the Phase 2 draft) |
| `COMFORT_MIN` | 400 | The optional left panel docks only beside a region at least this big (rail margin extra); below it, it is a drawer |
| `STACK_BREAKPOINT` | 640 | Below this workspace width the layout stacks |
| `SIZE_STEP` | 40 | Keyboard and button step |
| `SIZE_SNAP` | 8 | Sizes snap to this grid so a square lands on whole pixels |

Panel docking: after the region takes its size and its rail margin (`2 * rail`), each open panel gets an equal share of what is left (minus the gaps); it docks at `min(preferred, share)` when the share is at least its minimum width, otherwise it is a drawer. A hidden panel contributes nothing, so with one panel open the region uses the freed width. The columns are `[left panel + gap] [region + rail margin each side] [right panel + gap]`, centered as one group.

Yield order: (1) the optional left panel is demoted to a drawer when both open panels cannot sit beside a region of at least `COMFORT_MIN` (plus the rail margin), unless the workspace is below `STACK_BREAKPOINT` (it then stacks instead); (2) the layout stacks when the workspace is narrower than `STACK_BREAKPOINT`, when the right panel cannot sit beside a minimum-size region, or, in a portrait window (taller than wide), when the region beside the panels would be under 70 percent of the region a stacked layout gives (a tablet held upright); (3) a docked panel becomes a drawer when the person enlarges the region past what docks. Stacked panels stay visible below the region; nothing the person needs hides behind a drawer only because the screen is small. A landscape window never stacks only because stacking would be bigger.

Default size: `fits` is the smaller of the available height and the largest size that still docks the open panels at their minimum widths (rail margin included, hidden panels excluded); the default is `fits * DEFAULT_FILL` (0.92) snapped down and clamped between a floor and `DEFAULT_CAP` (720; raised from 640 in phase 3 because the region should dominate). The floor is the smaller of `DEFAULT_FLOOR` and what still docks at the minimums (never below `PRIMARY_MIN`), so a medium default cannot push a panel into a drawer. Earlier drafts sized the default against the preferred widths; on a laptop that left a small region beside wide panels (FB-0023).

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

Control rail (beside the region when wide, below it when stacked; quiet at rest, full emphasis on hover, focus and touch). Geometry, measured from the region box (`.ws-primary-box`) and tested by `scripts/test-workspace-alignment.mjs`: the rail's top and bottom equal the region's top and bottom, it sits 8px from the region's right edge, it is 32px wide (40px on touch and at 820px and below), the options control's top is the region's top, the resize control's bottom is the region's bottom, and both controls share one x. The geometry reserves 40px (the 8px gap plus the 32px column) on both sides. Stacked, the controls are a row aligned to the region's right edge. Resize handle (a real `<button>` in the rail):

- `role="slider"`, `aria-label="Resize <name>"`, `aria-orientation="horizontal"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="<n> pixels"`.
- ArrowRight and ArrowUp enlarge by `SIZE_STEP`; ArrowLeft and ArrowDown shrink by it; Home sets the minimum; End sets the maximum. Values clamp and snap.
- Pointer: capture the pointer, update live while dragging, commit the preference on release. A horizontal pull counts double because the region stays centered and grows on both sides.
- It has the shared 1.5px neutral focus ring (P15, P17).

Options menu: one labelled menu button (`aria-haspopup="menu"`, `aria-expanded`) with Larger, Smaller, Largest that fits and Restore default size and panels. Enter, Space or ArrowDown opens; arrows, Home and End move and wrap; Escape closes and returns focus; Tab closes; a click outside closes. An item that cannot act is `aria-disabled`, not hidden.

Panel chevrons (`button[data-ws-toggle="left"|"right"]`): attached to the outer edge of the workspace, `aria-expanded` (true while the panel is docked or its drawer is open; for the stacked disclosure row, while it is open), a label and `title` that say what a press does ("Hide Pages" or "Show Pages"), and the shared 1.5px neutral focus ring. The chevron points the way the panel will move. Opening a panel that only fits as a drawer opens the drawer immediately, so a press is never silent. There is no toolbar toggle and no close X on a panel. An unavailable panel has no control at all rather than a disabled one (see FB-0034, FB-0041).

Toolbar: only when the page gives it content; `role="toolbar"` with a label. It carries no panel toggles and no size controls.

Drawers (a panel that cannot dock):

- Opens from its chevron, over a scrim, as `role="dialog"` with `aria-modal="true"` and the panel title as its label. It carries a back chevron ("Hide Pages"), not an X.
- The toolbar, the primary region and the other panel (and its chevron) are `inert` while it is open.
- Moves focus into the drawer when it opens; Tab and Shift+Tab stay inside; Escape closes only the drawer; closing returns focus to the chevron that opened it, after the update that lifts `inert` (focus cannot enter an inert element).
- A drawer that no longer applies (the window grew and the panel docks) closes by itself.
- Panels are labelled regions (`<section aria-label>`), not `<aside>` and not `nav`: they hold content, not navigation (see P14 and the CHK-011 note in the proposal).

## 6. Touch

At 820px and below, and on coarse pointers, every control has an effective hit area of at least 40x40 CSS px (P18, CHK-020): rail buttons (the side column grows from 32px to `--hit` with them, and stays as tall as the region), menu items, drawer back chevrons and the disclosure row grow to `--hit`, and the edge chevron grows from 18x56 to 24x64, moves 8px in from the screen edge (clear of the system edge swipe, and so its invisible 8px extension on every side is not clipped by the edge: it measured 32x64 effective when it hugged the edge, 40x64 after) and is shown at full opacity (a quiet tab must still be discoverable by touch, where there is no hover). The chevrons rest at 70 percent opacity on a pointer device. Verify with real hit testing: `node scripts/test-tap-targets.mjs --apps workspace`.

## 7. Application sidebar: compact rail

The shell sidebar has three presentations of one navigation list: expanded (252px), a compact 56px icon rail, and the mobile drawer (820px and below, always labeled). The rail keeps the primary region's room on workspace pages and is still one sidebar, so P14 is not violated.

Reference: `AppShell` takes an optional `compact` prop (default `false`; with it off the markup and layout are identical to before). The rail sets `data-side="compact"` on the shell; CSS in `src/styles/workspace.css` narrows `.shell-side` to 56px on desktop widths only, centers icons and visually hides labels (clip, never `display: none`, so the accessible name stays) and `NavItem` adds a `title` so sighted users get a tooltip. `RailToggle` is the width control, placed at the bottom of the sidebar. Choose the mode by route and let an explicit choice win.

## 8. What not to build

- No zen, fullscreen or focus mode in this pattern. Making the primary region large is the "largest that fits" size, and hiding panels is the panel toggle. A separate mode adds a state and a way to get stuck.
- No fixed pixel size for the primary region, and no stored measurement.
- No second navigation sidebar next to the shell sidebar (P14). Panels carry content, never navigation.
- No panel that disappears with nothing to bring it back: every hidden panel has a visible edge chevron (or, stacked, a disclosure row).
- No toolbar button labelled with a panel name, no X on a panel that is part of the workspace, and no panel heading over content that already says what it is (the accessible name stays; FB-0038).
- No equal reserve for a hidden panel: an empty invisible column is not a panel.
- No guessed chrome heights, and no layout that jumps when a footer appears.
- No controls floating beside the region with no container and arbitrary offsets: align them to the region's edges (the rail column spans the region's height), never to page coordinates (FB-0042).
- No decorative resize affordances (no glow, no gradient, no accent color on the handle).

## 9. Reference files

| File | Role |
| --- | --- |
| `src/ui/workspaceGeometry.ts` | Pure geometry, same API as CaissaTrainer's `workspaceLayout.ts` |
| `scripts/test-workspace.mjs` | 53 `node:test` cases (46 on the geometry: hidden panels reserve nothing, drawer before restack, portrait stacking, cap 720 and fill 0.92, the rail, default against minimums; 1 drift guard for the candidate script; 1 parity check against CaissaTrainer's `workspaceLayout.ts` when present; 5 on the rail alignment CSS and structure, FB-0042) (`npm run test:workspace`) |
| `scripts/test-workspace-alignment.mjs` | Measured in a real browser on `#/workspace` (`npm run test:workspace-alignment`, 24 assertions): the rail spans the region box, 8px gap, 32px column, options on the top edge, resize on the bottom edge, one x, stacked row aligned to the region's right edge, 40px targets |
| `scripts/build-workspace-candidate.mjs` | Regenerates `candidate/js/workspace-geometry.js` from the TypeScript |
| `src/ui/workspace.tsx` | React `Workspace` (edge chevrons, disclosure row, drawer, rail), `useWorkspacePreferences`, `RailToggle` |
| `src/styles/workspace.css` | Workspace and rail CSS, tokens only |
| `src/lab/workspace/WorkspaceDemo.tsx` | Route `#/workspace`: a neutral document preview (not a registered application) |
| `feedback/proposals/PR-0002/candidate/` | Candidate presets `preset.workspace` and `preset.app-sidebar-rail` (JSON, CSS, HTML) |

## Credits

The MIT-licensed Chess Zen Mode extension (`src/lib/layout.js`) was studied for where it places a central region between its side areas. Earlier drafts shared its equal-reserve idea (the same width on both sides keeps the region centered); CaissaTrainer Phase 3 replaced that by centering the region and its open panels as one group, so no idea beyond the general layout is shared now. The geometry here and CaissaTrainer's implementation are independent code; neither copies that extension, which steers a third party page's CSS grid and does not size a primary region itself.
