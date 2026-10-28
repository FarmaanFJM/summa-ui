# Phase 3 remediation report

The guidance bundle is still `draft` (version 0.1.0, `reviewedBy` null). Principles 17 to 20 and the revised focus and destructive-button tokens are unchanged. Nothing here declares the interfaces or guidance final.

## 1. Touch hit areas (CHK-020)

### Method
`scripts/test-tap-targets.mjs` uses the browser, not CSS sizes. At 390px wide with touch emulation it:
1. Finds every visible interactive element (buttons, links, inputs, selects, summaries, role button/tab/checkbox/switch/menuitem/option/link, focusable labels).
2. Samples a square of at least 40x40 centred on each element on a 4px grid with `elementFromPoint`. The effective hit area is the part the browser assigns to that element, so pseudo-element extensions, overlaps and stacking are all counted. An element fails when its effective width or height is below 38px (2px sampling tolerance).
3. Taps five points with a real touch screen (centre and four interior points 20% in from each side), intercepting clicks in the capture phase so app state is unchanged, and requires the click to reach the element.
4. Repeats in: first screen, a 2400px tall viewport, mobile drawer open, and 32 scripted states (open menus, sheets, dialogs, detail pages, composer with attachment, cart, checkout, results, stay, order sheet and so on).

Before and after use the identical final test, the "before" being run on the pre-remediation commit `e07c855`.

### Results (undersized controls / real tap mismatches)
| App | Before tested | Before undersized | Before tap mismatch | After tested | After undersized | After tap mismatch |
| --- | --- | --- | --- | --- | --- | --- |
| ai | 50 | 24 | 0 | 50 | 0 | 0 |
| projects | 85 | 32 | 0 | 84 | 0 | 0 |
| documents | 24 | 14 | 0 | 24 | 0 | 0 |
| analytics | 39 | 14 | 0 | 39 | 0 | 0 |
| files | 89 | 32 | 0 | 89 | 0 | 0 |
| media | 167 | 41 | 0 | 167 | 0 | 0 |
| executive | 32 | 7 | 0 | 32 | 0 | 0 |
| chess | 39 | 19 | 0 | 39 | 0 | 0 |
| social | 126 | 20 | 0 | 126 | 0 | 0 |
| trading | 92 | 54 | 16 | 88 | 0 | 0 |
| store | 118 | 53 | 8 | 116 | 0 | 0 |
| travel | 86 | 43 | 0 | 86 | 0 | 0 |
| **Total** | **947** | **353** | **24** | **940** | **0** | **0** |

Raw data: `docs/reports/tap-before-final-method.json` and `docs/reports/tap-after.json`. Earlier, weaker runs are kept for history (`tap-before.json`, `tap-step1.json`). The earlier CHK-020 report (bounding box sizes only) listed 4 to 103 failures per app; the new measure counts what the browser actually hits.

Desktop is unchanged: `scripts/layout-snapshot.mjs` compares the rectangle of every visible element of all 12 apps at 1440px and 1100px against a snapshot taken before the work: 24 of 24 snapshots show 0 changed elements (see section 5 for the final run).

### How it was done
- Shared (`src/styles/base.css`, mobile and coarse pointer only): `.icon-btn` 40x40, `.input` 40px, menu and nav items 40px, invisible `::after` extensions for `.btn`, `.tab`, `.select`, `.checkbox`. The same rules exist for the framework-neutral `guidance/css/presets.css`.
- Per app (media queries at 820px and below only): invisible extensions, padding with negative margin, larger gaps where neighbours were closer than 40px, rounded clips moved from the container to the image so corners stay tappable. No `data-hit-exempt` or test bypass was used.

### Visible changes on mobile (all at 820px and below)
- ai: message action row 4px taller; composer minimum 40px high; code block header 40px.
- projects: chips get a 14px gap.
- analytics: Top pages search field 40px high.
- files: list/grid toggle 16px wider; list rows tile edge to edge (same look); grid card checkbox 3px further in.
- executive: table header sort buttons 40px high (header row about 4px taller); header text shifts about 3px.
- media: overlay button gap 6px to 8px; art rounded through clipping.
- social: avatars and action buttons keep their look with invisible areas; author link grows into the post padding without moving content.
- trading: order book rows 40px (book about 190px taller); 16px gap under the chart; Buy/Sell toggle and percent buttons 40px.
- store: swatch gap 12px to 24px (swatches stay 16px); stepper buttons 40px; rating bars 40px; price sliders 40px high.
- travel: calendar days 40px; back link 40px with trimmed margin.

### Behaviour changes to review (decisions for the owner)
1. Trading ticker strip no longer auto-scrolls on mobile; it is a swipeable strip that holds still. A moving target cannot be tapped reliably and moving content is an accessibility concern, but it is a behaviour change. Desktop still scrolls.
2. Destructive confirmation dialogs no longer put initial focus on the destructive button. Focus now starts on Cancel, matching the preset and `alertdialog` guidance. This is a deliberate safety change.
3. Menu shortcut hints are hidden on touch.
A suggestion-list change made for the test in the Travel destination field was reverted: the test harness was fixed instead, so app behaviour is unchanged.

### Known limits of the test
- Range sliders: a touch tap never fires `click` on a range input, so they are checked for size only.
- Chromium applies its own touch adjustment near the edges of adjacent clickable regions, which CSS cannot control. Taps therefore probe interior points; geometric edges are covered by the `elementFromPoint` sampling.
- Hover-only controls and states beyond the 32 scripted ones are not covered.
- One retry is allowed per element after re-measuring when layout moved during earlier taps; a real fault persists through the retry.
- Real devices, screen readers and hardware keyboards were not used.

## 2. Dialog accessibility
Shared `Dialog` (`src/ui/index.tsx`):
- `description` prop rendered with `aria-describedby`; `role="alertdialog"` option; `dismissOnBackdrop` (alertdialogs ignore backdrop clicks, Esc and Cancel answer them); `aria-modal`, labelled by the title.
- The page behind (`#root`) is `inert` while a dialog is open, with a depth counter for nested dialogs; focus is trapped and returns to the trigger on close.
- Initial focus: `data-autofocus` if present, otherwise for alertdialog the first footer button (Cancel); plain dialogs keep first field.
- Stable focus effect (no re-focusing on every parent render); width cannot overflow narrow screens.
- All six destructive confirmations in the prototypes (AI, Projects, Files, Chess resign, Travel cancel booking, Documents) and `ConfirmDialog` use `alertdialog` with a description.
- Preset JSON and the framework-neutral HTML example document and demonstrate the same semantics (inert background, no backdrop dismiss for alertdialog).
- 10 browser tests cover role, title and description wiring, inert background, initial focus, backdrop behaviour, focus trap, Esc, focus return, plain dialog behaviour and the AI delete conversation flow.

## 3. Menu shortcut hints
They were `--text-3` on the glass surface (2.45:1). Decision: if a hint is shown it is readable. Now `--text-2` (4.79:1 on `--s4`), and hidden on touch where keyboard shortcuts do not apply. `--danger` was lightened earlier, so danger menu items are 4.55:1 on `--s4`. Not changed (open decision): `--text-3` placeholders are 3.24:1 on `--s2` and still below 4.5:1.

## 4. Other items
- Bundle stays `draft`. `scripts/vendor-guidance.mjs` refuses any non-approved bundle unless `--allow-draft`; `scripts/verify-vendored.mjs` detects modified, missing or extra files, digest or version drift. Tested: draft rejected, draft allowed for local trial, tamper detected. `docs/SUMMA_INTEGRATION.md` recommends vendored, digest-pinned distribution. The Summa repository was not touched.
- Notification preset marked `status: provisional` with a note: the toast reference supplied in the ChatGPT conversation could not be accessed here, so typography, spacing, icon, placement and motion are not visually approved. The gallery shows the note.
- New decisions D-005, D-006, D-007 in `docs/DECISIONS.md`.

## 5. Automated checks (final run)
| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx vite build` | succeeds |
| `npm run validate` (icons, anti-patterns, presets, guidance) | all pass: 22 principles, 16 anti-patterns, 8 presets, 22 checks, manifest hashes |
| `npm run test:browser` | see final line below |
| `npm run test:tap` | 940 tested, 0 undersized, 0 tap mismatches |
| `npm run test:desktop-layout` | see final line below |
