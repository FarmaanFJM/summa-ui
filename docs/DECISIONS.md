# Design decisions log

Records decisions where new guidance refines or overrides earlier approved guidance. Newest first.

## D-007 Menu shortcut hints use --text-2 and are hidden on touch
Shortcut hints were `--text-3` on the glass `--s4` surface (2.45:1). Decision: a hint worth showing must be readable, so it uses `--text-2` (4.8:1). On touch devices (`hover: none`, or max-width 820px) shortcuts are hidden because keyboard shortcuts do not apply. If a hint is not worth reading it should not be shown. Open: `--text-3` is still 3.2:1 on `--s2` for input placeholders; a token-level decision is left to the owner.

## D-006 Dialog semantics
The shared Dialog gains `description` (aria-describedby), `role="alertdialog"` for interrupting and destructive confirmations, `dismissOnBackdrop` (alertdialogs are not dismissed by the backdrop), an inert background while open, a stable focus effect and an initial focus rule (alertdialog focuses the first footer button, normally Cancel, unless a `data-autofocus` element exists). Destructive confirmations in the prototypes now use it.

## D-005 Touch hit areas (CHK-020)
Principle 18 requires effective hit areas of at least 40x40 CSS px on mobile. Decision: measure effective area with browser hit testing plus real touch taps (`scripts/test-tap-targets.mjs`), not CSS size. Transparent controls grow their box; filled controls keep their look and gain an invisible extension; where neighbours are too close, spacing grows. Desktop layout is unchanged and verified with `scripts/layout-snapshot.mjs`.

## D-004 Phase 3 principles 17 to 20 versus principle 15 (focus and selection weight)
Principle 15 made focus and selection neutral. Principle 17 adds that they must also be light: 1px to 1.5px neutral rings and quiet fills, with keyboard focus at least 3:1. Decision: 17 refines 15. Where they differ about weight, 17 governs. Tokens changed: `--focus` alpha 0.62 to 0.5, ring thickness 2px to 1.5px (outline) and 1px (input ring). Contrast of the new ring on `--s1` stays above 3:1 (checked by `scripts/run-checks.mjs`, CHK-018).

## D-003 Destructive buttons (principle 19) versus the earlier `.btn-danger` tinted style
The original `.btn-danger` was a pale red text on translucent red tint, the exact pattern principle 19 forbids. Decision: `.btn-danger` becomes a solid `--danger-solid` fill with `--danger-ink` text. Destructive menu items keep danger-colored text with an icon and sit last after a separator (still allowed). Dense table row actions such as closing a position use a neutral treatment.

## D-002 Initials avatars (principle 20) versus Phase 1 and 2 prototypes
Prototypes introduced initials circles for assignees, accounts and players. Decision: removed where no real identity imagery exists; plain names are used. The shared `Avatar` component is opt-in and renders initials only when explicitly requested. Social keeps avatars as graphic generated art because avatars are content there.

## D-001 Neutral selection and focus (principle 15) versus emerald in Phase 1
See `docs/PHASE3_BASELINE_CHANGES.md` and the Phase 2 note in the laboratory principles view.
