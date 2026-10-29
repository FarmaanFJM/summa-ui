# PR-0002 candidate files (draft, not part of any bundle)

- `principles.md`, `principles.json`: candidate P23 to P26.
- `presets/workspace.json`, `presets/app-sidebar-rail.json`: preset specs in the shape of `guidance/presets/*.json`.
- `css/workspace-presets.css`: `sm-` CSS that would be appended to `guidance/css/presets.css`.
- `examples/workspace.html`, `examples/app-sidebar-rail.html`: framework-neutral examples (open from disk).
- `js/workspace-geometry.js`: the geometry as a classic script, generated from `src/ui/workspaceGeometry.ts` with `module.stripTypeScriptTypes`, `export` removed and wrapped to expose `window.SummaWorkspace`. `scripts/test-workspace.mjs` fails if it drifts from the TypeScript.
- `../conflicts-and-decisions.md`: contradictions with approved rules and the draft DECISIONS notes.
- `amendments.md`: candidate amendments from CaissaTrainer Phase 2 that are not part of the workspace pattern (AP-005 and P06 and CHK-005, a surface check, editable fields, toolbar density, honest toggles, repeated controls, class lint). Candidate numbering only.
- Not updated in this round: `css/workspace-presets.css` and `examples/*.html` still show the toolbar size buttons; the geometry script (`js/workspace-geometry.js`) is regenerated and drift tested. The React reference (`src/ui/workspace.tsx`) shows the control rail.
