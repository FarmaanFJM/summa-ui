# PR-0002 candidate files (draft, not part of any bundle)

- `principles.md`, `principles.json`: candidate P23 to P26.
- `presets/workspace.json`, `presets/app-sidebar-rail.json`: preset specs in the shape of `guidance/presets/*.json`.
- `css/workspace-presets.css`: `sm-` CSS that would be appended to `guidance/css/presets.css`.
- `examples/workspace.html`, `examples/app-sidebar-rail.html`: framework-neutral examples (open from disk).
- `js/workspace-geometry.js`: the geometry as a classic script, generated from `src/ui/workspaceGeometry.ts` by `node scripts/build-workspace-candidate.mjs` (`module.stripTypeScriptTypes`, `export` removed, wrapped to expose `window.SummaWorkspace`). `scripts/test-workspace.mjs` fails if it drifts from the TypeScript.
- `../conflicts-and-decisions.md`: contradictions with approved rules and the draft DECISIONS notes.
- `amendments.md`: candidate amendments from CaissaTrainer Phases 2 and 3 that are not part of the workspace pattern (AP-005 and P06 and CHK-005, a surface check, editable fields, toolbar density, honest toggles, repeated controls, class lint, and from Phase 3: redundant explanatory copy, the Phase 3 findings register). Candidate numbering only.
- Phase 3 update: `css/workspace-presets.css`, `examples/workspace.html` and `presets/workspace.json` now show the Phase 3 geometry (hidden panels reserve no width, the group is centered, edge chevron toggles with `aria-expanded`, no toolbar toggles, no panel X, drawer with a back chevron, task ordered stacking with a disclosure row). The example no longer has toolbar size buttons: it keeps the resize handle (a slider); the grouped options menu is shown only in the React reference (`src/ui/workspace.tsx`).
