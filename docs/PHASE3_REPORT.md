# Phase 3 validation report

Not a declaration that the guidance is final. The owner is the visual quality authority.

## What exists
| Deliverable | Where |
| --- | --- |
| Principles 17 to 20 | `PRINCIPLES.md`, machine form `guidance/principles.json`, decisions in `docs/DECISIONS.md` |
| Anti-pattern library (16) | `guidance/antipatterns/AP-001..016.json`, gallery `#/guidance/antipatterns` (live Avoid and Prefer demos) |
| Icon collection | 165 Lucide 1.62.0 icons (ISC, pinned), `guidance/icons/`, gallery `#/guidance/icons` |
| Presets (8) | `guidance/presets/*.json`, framework-neutral `guidance/css/presets.css` and `guidance/examples/*.html`, optional React `src/presets`, gallery `#/guidance/presets` |
| Guidance bundle | `guidance/` with `manifest.json` (sha256 per file, `bundleDigest`), `prompt-pack.md`, `tokens.json`, `checks/rules.json` (22 checks, 10 human judgment prompts), schemas |
| Integration contract | `docs/SUMMA_INTEGRATION.md` (proposal; the Summa repository was not touched) |
| Baseline changes | `docs/PHASE3_BASELINE_CHANGES.md` |

Bundle version 0.1.0, channel `draft`, `reviewedBy` null. It cannot be pinned by the Orchestrator until a human sets it to `approved`.

## Commands and results (this session)
- `npx tsc --noEmit`: clean. `npx vite build`: succeeds; guidance examples and CSS are copied to `dist/guidance/`.
- `npm run validate` (icons, anti-patterns, presets, guidance): all pass. Cross checks: principle headings match `PRINCIPLES.md`; every anti-pattern, check, preset and token reference resolves; manifest hashes and digest match; `guidance/css/tokens.css` equals `src/styles/tokens.css`; no em dash in the bundle, docs or principles.
- `npm run test:browser` (starts its own dev server): 74 of 74 passed. It loads the 12 prototypes, the three galleries, the principles page and the lab at 1440x900 and 390x844 with no console errors and no horizontal overflow; opens all 16 anti-pattern details (Avoid and Prefer present); icon search, deep link and dialog; toast appears; destructive confirm focuses Cancel; no em dash in rendered text; and evaluator fixtures (below).
- Evaluator fixtures: the reference evaluator (`scripts/run-checks.mjs`, collector in `scripts/lib/collector.mjs`) flags the Avoid demo and passes the Prefer demo for CHK-001, 002, 003, 006, 008 and 013. This shows objective checks are implementable deterministically; it is a reference, not the TestNetwork implementation. The fixture run found two evaluator gaps that were fixed: it ignored `.btn` elements that are not `<button>`, and its Send/Stop pattern required an exact label.

## Evaluator run against the 12 prototypes
Desktop 1440x900: no failures. Needs-human only: CHK-022 (focus on a container or editor without a ring, 1 to 4 per app in AI, Documents, Files, Social, Travel) and CHK-013 (gradient backgrounds in Travel, procedural imagery; probably legitimate content).

Mobile 390x844: CHK-020 (touch target at least 40px) FAILS widely: AI 22, Projects 37, Documents 10, Analytics 9, Files 13, Media 103, Executive 4, Chess 61, Social 42, Trading 49, Store 60, Travel 10 undersized targets (mostly 28 to 32px icon buttons, small tabs and chips). The baseline remediation raised bars and many controls to 40px but did not reach every icon button. This is an open finding, not fixed here to avoid a broad layout change. Recommended: raise `.icon-btn` and `.tab` hit areas on mobile in `base.css` (invisible padding via `::after`, so visuals stay unchanged) and re-run `npm run checks`.

## Things to know
- The user's supplied toast design never reached this session. The notification preset is built from the principles and states this in its `behavior` list. It needs your review against the reference.
- Deliberate departures from the brief: toasts with an action stay at least 6s; short compact toasts have no dismiss button (Esc and timeout); older stacked toasts shrink slightly rather than fade.
- Presets measured contrast is recorded in the JSON; text shortcuts in menus (`--text-3` on `--s4`) are about 2.4:1 and documented as a redundant hint.
- `Dialog` has no `alertdialog` role or `aria-describedby`; a small shared accessibility improvement is open.
- Heuristic checks (CHK-005, 007, 009, 010, 012, 014, 015, 016) are not implemented in the reference evaluator; they are specified in `checks/rules.json`.
- Mobile gallery header tabs fit at 390px only after trimming padding; they scroll if the screen is narrower.
- Screenshots: `docs/screenshots/phase3/` (desktop and mobile for the anti-pattern index and three details, icons and icon detail, presets with toasts, confirm dialog, lab).

## Decisions for the owner
1. Approve or change principles 17 to 20 wording and the token changes in `docs/DECISIONS.md`.
2. Review the toast preset against your reference design.
3. Whether to fix mobile touch targets (CHK-020) now.
4. Bundle approval workflow and who promotes `draft` to `approved`.
5. Whether the Summa bundle is vendored or fetched by commit.
