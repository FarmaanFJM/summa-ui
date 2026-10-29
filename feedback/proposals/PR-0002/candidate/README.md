# PR-0002 candidate files (draft, not part of any bundle)

- `principles.md`, `principles.json`: candidate P23 to P26.
- `presets/workspace.json`, `presets/app-sidebar-rail.json`: preset specs in the shape of `guidance/presets/*.json`.
- `css/workspace-presets.css`: `sm-` CSS that would be appended to `guidance/css/presets.css`.
- `examples/workspace.html`, `examples/app-sidebar-rail.html`: framework-neutral examples (open from disk).
- `js/workspace-geometry.js`: the geometry as a classic script, generated from `src/ui/workspaceGeometry.ts` with `module.stripTypeScriptTypes`, `export` removed and wrapped to expose `window.SummaWorkspace`. `scripts/test-workspace.mjs` fails if it drifts from the TypeScript.
- `../conflicts-and-decisions.md`: contradictions with approved rules and the draft DECISIONS notes.
