# Summa-UI — Phase 1: Interface Laboratory

Six interactive prototypes built to test `PRINCIPLES.md`. Hardcoded demo data, no backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

## Routes (hash routing)

| Route | Prototype |
| --- | --- |
| `#/` or `#/lab/<id>` | Laboratory: switch prototypes (keys 1–6), Desktop / Tablet / Mobile frame |
| `#/ai` | A. AI Workspace |
| `#/projects` | B. Project Manager (`#/projects/SUM-142` opens a task) |
| `#/documents` | C. Document Editor |
| `#/analytics` | D. Analytics Dashboard |
| `#/files` | E. File Manager |
| `#/media` | F. Media Library |
| `#/principles` | Principles applied, deliberate exceptions, ambiguities (review view, outside the apps) |

Standalone routes render the app alone, with no laboratory chrome.

## Layout

- `src/styles/tokens.css`, `base.css` — design tokens and shared component CSS
- `src/ui/` — shared icons and components (Menu, Dropdown, Dialog, Tabs, AppShell, …)
- `src/apps/<id>/` — one folder per prototype (app-specific components stay local until promoted)
- `src/lab/` — laboratory shell and principles view
