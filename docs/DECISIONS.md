# Design decisions log

Records decisions where new guidance refines or overrides earlier approved guidance. Newest first.

## D-004 Phase 3 principles 17 to 20 versus principle 15 (focus and selection weight)
Principle 15 made focus and selection neutral. Principle 17 adds that they must also be light: 1px to 1.5px neutral rings and quiet fills, with keyboard focus at least 3:1. Decision: 17 refines 15. Where they differ about weight, 17 governs. Tokens changed: `--focus` alpha 0.62 to 0.5, ring thickness 2px to 1.5px (outline) and 1px (input ring). Contrast of the new ring on `--s1` stays above 3:1 (checked by `scripts/run-checks.mjs`, CHK-018).

## D-003 Destructive buttons (principle 19) versus the earlier `.btn-danger` tinted style
The original `.btn-danger` was a pale red text on translucent red tint, the exact pattern principle 19 forbids. Decision: `.btn-danger` becomes a solid `--danger-solid` fill with `--danger-ink` text. Destructive menu items keep danger-colored text with an icon and sit last after a separator (still allowed). Dense table row actions such as closing a position use a neutral treatment.

## D-002 Initials avatars (principle 20) versus Phase 1 and 2 prototypes
Prototypes introduced initials circles for assignees, accounts and players. Decision: removed where no real identity imagery exists; plain names are used. The shared `Avatar` component is opt-in and renders initials only when explicitly requested. Social keeps avatars as graphic generated art because avatars are content there.

## D-001 Neutral selection and focus (principle 15) versus emerald in Phase 1
See `docs/PHASE3_BASELINE_CHANGES.md` and the Phase 2 note in the laboratory principles view.
