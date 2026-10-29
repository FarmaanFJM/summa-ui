# Workspace pattern

Status: draft contribution, not approved guidance. It documents a pattern found while migrating CaissaTrainer (Vue 3) onto the v0.1.0 bundle and ships a framework-neutral reference. Nothing in `guidance/` or `PRINCIPLES.md` changed. The candidate principles (P23 to P26) and the candidate presets travel in `feedback/proposals/PR-0002` and only the owner can approve them into a later release. Evidence: `FB-0014` to `FB-0018`.

A workspace is a page whose job is one primary region (an image, a canvas, a document page, a map, a board) with secondary information around it. The pattern keeps that region primary while the person resizes it, hides information, or changes the window.

## 1. The pattern

1. **The primary workspace stays primary.** It is never squeezed below a usable minimum, stays centered, and is the last thing to give up room.
2. **Progressive disclosure of secondary information.** Details live in side panels that can be hidden. Hidden is a state the person chooses, not content that was deleted.
3. **Panels yield before the primary region.** Order of yielding: shrink from the preferred to the minimum width, then leave the layout and become an on-demand drawer, then, on a narrow screen, stack under the primary region. A panel is never destroyed; it stays mounted so its state survives.
4. **Equal reserve keeps the primary region centered.** Both flanks reserve the same width, so a lone panel does not push the primary region off center. Width a panel does not use stays empty.
5. **A layout choice is a preference, never a measurement.** The size a person picks is stored as the pick. A small window clamps what is shown and never rewrites what is stored.
6. **Do not fix the size of central content.** A fixed pixel box is wrong on one of the screens it meets. The default is responsive and deliberately medium; the person can go larger or smaller.
7. **Chrome is measured, not guessed, and held at its peak.** Headers, captions and answer areas around the primary region are measured. The tallest value seen since the workspace opened is used, so a footer that appears or disappears never makes the region jump.

## 2. Geometry (the numbers)

`src/ui/workspaceGeometry.ts` is the framework-neutral reference: pure arithmetic, no DOM, no framework, erasable TypeScript. It is a port of CaissaTrainer's `workspaceLayout.ts` with the same API and constants, so two apps in different frameworks produce the same layout. Input is the measured width and height, padding, gap, chrome height, the two panel specs, whether each is open, and the stored preference. Output is the effective size and what each panel is doing.

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

Panel docking: a panel docks when the equal flank (`(available width - size) / 2 - gap`) is at least its minimum width; its width is `min(preferred, flank)`. Otherwise it is a drawer. The layout stacks when the workspace is narrower than `STACK_BREAKPOINT`, or when the open panels cannot dock even beside a minimum-size region. Stacked panels stay visible below the region; nothing the person needs hides behind a drawer only because the screen is small.

Known behavior to review: the responsive default first tries to keep panels at their preferred width, so on a mid-size window (about 1100px) the default region can be at `DEFAULT_FLOOR` (320) while panels are wide. The person can enlarge it, and the panels then shrink. If the owner prefers panels to yield sooner at the default, change the default step only; it is a one-line decision in `computeWorkspace`.

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

Resize handle (a real `<button>` in the bottom right corner, hanging outside the region so it never covers content):

- `role="slider"`, `aria-label="Resize <name>"`, `aria-orientation="horizontal"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="<n> pixels"`.
- ArrowRight and ArrowUp enlarge by `SIZE_STEP`; ArrowLeft and ArrowDown shrink by it; Home sets the minimum; End sets the maximum. Values clamp and snap.
- Pointer: capture the pointer, update live while dragging, commit the preference on release. A horizontal pull counts double because the region stays centered and grows on both sides.
- It has the shared 1.5px neutral focus ring (P15, P17).

Toolbar: `role="toolbar"` with a label. Toggle buttons use `aria-pressed` and a label that says what the press does ("Hide Pages" or "Show Pages"). Size buttons are disabled (not hidden) at the limits. The slider and the keyboard are the required controls; the four size buttons are optional (see open questions in the proposal).

Drawers (a panel that cannot dock):

- Opens from its toggle, over a scrim, as `role="dialog"` with `aria-modal="true"` and the panel title as its label.
- Moves focus into the drawer when it opens; Tab and Shift+Tab stay inside; Escape closes it; closing returns focus to the toggle that opened it.
- A drawer that no longer applies (the window grew and the panel docks) closes by itself.
- Panels are labelled regions (`<section aria-label>`), not `<aside>` and not `nav`: they hold content, not navigation (see P14 and the CHK-011 note in the proposal).

## 6. Touch

At 820px and below, and on coarse pointers, every control has an effective hit area of at least 40x40 CSS px (P18, CHK-020): toolbar buttons grow to `--hit`, and the handle keeps its 24px look and gains an invisible 44px extension that stays inside the page padding. Verify with real hit testing: `node scripts/test-tap-targets.mjs --apps workspace`.

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
| `scripts/test-workspace.mjs` | 26 `node:test` cases (25 on the geometry, 1 drift guard for the candidate script) on the geometry (`npm run test:workspace`) |
| `src/ui/workspace.tsx` | React `Workspace`, `useWorkspacePreferences`, `RailToggle` |
| `src/styles/workspace.css` | Workspace and rail CSS, tokens only |
| `src/lab/workspace/WorkspaceDemo.tsx` | Route `#/workspace`: a neutral document preview (not a registered application) |
| `feedback/proposals/PR-0002/candidate/` | Candidate presets `preset.workspace` and `preset.app-sidebar-rail` (JSON, CSS, HTML) |

## Credits

The equal-reserve idea (the same width on both sides keeps the primary region centered) is shared with the MIT-licensed Chess Zen Mode extension (`src/lib/layout.js`). Only the idea is shared. The geometry here and CaissaTrainer's implementation are independent code; neither copies that extension, which steers a third party page's CSS grid and does not size a primary region itself.
