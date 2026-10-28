# Summa integration contract (proposal)

Status: proposal for a separate, later change in the Summa repository. Nothing here modifies the main Summa repository. The human owner approves the contract and any bundle version before use.

## Goals
- Summa Orchestrator loads a pinned, human-approved Summa-UI guidance bundle for UI tasks.
- The Executor receives the relevant guidance and reusable examples.
- TestNetwork evaluates objective violations and reports visual issues that need human judgment.
- Lightweight and deterministic: no network at task time, no consumption of `main`, no framework requirement.

## The bundle
Directory `guidance/` in `FarmaanFJM/summa-ui`, described by `guidance/manifest.json` (schema: `guidance/schema/manifest.schema.json`).

| Entry point | Consumer | Content |
| --- | --- | --- |
| `prompt-pack.md` | Executor | Compact text of principles, anti-patterns, token roles, presets, icon rules, checks. Generated, deterministic. |
| `principles.json` | Orchestrator, TestNetwork | 22 principles with ids P01 to P22, rules and exceptions. |
| `antipatterns/AP-*.json` | Executor, TestNetwork | 16 entries: problem, bad and good descriptions, why, exceptions, detection links. |
| `checks/rules.json` | TestNetwork | Objective and heuristic checks (CHK-xxx) with procedures, thresholds and exceptions, plus human judgment prompts (HJ-xxx). |
| `tokens.json`, `css/tokens.css` | Executor | Token values with roles. Plain CSS custom properties. |
| `presets/*.json`, `css/presets.css`, `examples/*.html` | Executor | Presets with a framework-neutral CSS and HTML implementation. React under `src/presets` is optional reference only. |
| `icons/catalog.json`, `icons/svg/*.svg` | Executor | Curated Lucide subset (ISC), stable names, usage guidance. |

Versioning: semantic version in `bundle.config.json`. `channel` is `draft`, `candidate` or `approved`. Only `approved` bundles, with `reviewedBy` set, may be pinned. `bundleDigest` is the sha256 over the sorted `path:sha256` lines of every file in the manifest and is the pin of record.

## Recommended distribution: vendored and digest pinned
Recommendation (pending the owner's explicit approval): Summa vendors a copy of the approved bundle and pins it by `bundleDigest`. The summa-ui repository stays standalone; the Summa repository is not modified by this phase.

Why vendored: task time needs no network; the exact bytes an agent saw are reviewable in the Summa history; a bundle can only change through a reviewed Summa pull request; there is no accidental consumption of `main`.

Tooling in this repository (tested, no dependencies):
```bash
# in summa-ui, after the owner sets channel to approved and tags the release
node scripts/vendor-guidance.mjs <summa>/third_party/summa-ui-guidance --lock <summa>/summa-ui.lock.json
# in Summa CI and at Orchestrator start (copy scripts/verify-vendored.mjs into Summa)
node verify-vendored.mjs third_party/summa-ui-guidance summa-ui.lock.json
```
`vendor-guidance.mjs` verifies the source manifest, refuses any bundle whose channel is not `approved` (a `--allow-draft` flag exists for local trials only) and writes the lock file. `verify-vendored.mjs` fails on a modified, missing or extra file, a digest or version mismatch, or a non-approved channel. The bundle is currently `draft`, so nothing can be pinned yet.

## Pinning
Summa stores a lock file, for example `summa-ui.lock.json`, committed in the Summa repository:

```json
{
  "bundle": "summa-ui-guidance",
  "version": "0.1.0",
  "repo": "FarmaanFJM/summa-ui",
  "commit": "<full git sha of the approved release>",
  "tag": "guidance-v0.1.0",
  "bundleDigest": "<manifest.bundleDigest>",
  "approvedBy": "<human>",
  "approvedAt": "<iso date>"
}
```

Loading algorithm (Orchestrator, at task start, no network required when vendored):
1. Read the lock file. Never resolve `main`, branches or `latest`.
2. Obtain `guidance/` at `commit` (vendored copy in the Summa repo, or a git fetch of that exact commit, or a release archive).
3. Recompute the digest from `manifest.files`; compare with `bundleDigest` and with the lock. Mismatch: refuse the bundle and report; continue the task without UI guidance only if the human allows.
4. Check `channel == "approved"` and `reviewedBy` is set.

Updating: a human reviews the bundle changes in the summa-ui repository, sets `channel: approved` and `reviewedBy` in `guidance/bundle.config.json`, tags the commit, and then a Summa pull request updates `summa-ui.lock.json` and the vendored copy. Unreviewed commits on `main` are never consumed.

## Orchestrator behaviour
Classify the task. If it creates or changes user interface (new screens, components, styling, layout, copy shown to users), attach the guidance to the Executor task:
- Always: `prompt-pack.md` contents (about 20 to 30 KB; trim by section if the context budget requires: principles and anti-patterns first, then presets, tokens, icons).
- When relevant: the specific preset JSON and its HTML and CSS example (for example `preset.notification` for a task that adds toasts), `tokens.json`, the icon names list.
- Record in the task metadata: `guidance.version`, `guidance.bundleDigest`, and which entries were attached, so results are reproducible.
Non-UI tasks receive nothing.

## Executor behaviour
- Follow the principles as defaults; when breaking one, add a short note in the change summary: principle id, reason, scope (the exception rule P22).
- Use token names from `tokens.json` and the preset classes (`sm-*`) in any framework. Do not add a Summa-UI runtime dependency; copy `css/tokens.css` and `css/presets.css` if wanted.
- Use only icons from the catalog (or the project's own consistent set) and keep one stroke weight.
- Produce a change summary listing exceptions and any anti-pattern the code intentionally keeps.

## TestNetwork behaviour
Evaluate the produced UI with `checks/rules.json`.
- Run each `objective` check; report `pass`, `fail` or `not-applicable`.
- Run each `heuristic` check; report `fail` only when thresholds are exceeded, otherwise `needs-human` with evidence.
- Always include the `humanJudgment` prompts (HJ-xxx) in the report with screenshots at 1440x900 and 390x844, so a human can answer them. TestNetwork does not answer them.
- Honour documented exceptions declared by the Executor, and still list them for review.

Finding format (one per check result):

```json
{
  "checkId": "CHK-003",
  "status": "fail",
  "severity": "error",
  "target": "button.delete-project at /settings",
  "evidence": "background rgba(239,112,112,0.14), text #ef7070, contrast 3.1:1",
  "principles": ["P19"],
  "antipattern": "AP-003",
  "suggestedFix": "Use the solid destructive button preset (preset.destructive-button)."
}
```

Suggested evaluator implementation: a Playwright script that loads each route at the two viewports, injects a small collector that computes the styles named in each check `procedure`, and parses CSS sources for `source-css` kinds. `source-text` checks run on the repository diff. No model call is required for objective checks.

## Implementation instructions for the later Summa change
1. Add `summa-ui.lock.json` and a vendored `third_party/summa-ui-guidance/` directory (copy of the pinned `guidance/` folder). Add a CI step that recomputes the digest and fails on mismatch.
2. Orchestrator: add a loader module implementing the pinning algorithm above and a UI-task classifier hook; attach `prompt-pack.md` to Executor context and store version and digest in task metadata.
3. Executor: add the guidance section to the UI task prompt and require the exceptions summary in its output.
4. TestNetwork: add a `summa-ui-checks` suite that reads `checks/rules.json`, implements each `kind` (source-text, source-css, dom-computed-style, dom-structure, viewport-layout, contrast), emits findings in the format above and attaches screenshots for human judgment prompts.
5. Add an update procedure document: review in summa-ui, tag, bump the lock in Summa.
6. Tests: a fixture UI containing known anti-patterns (the gallery's Avoid demos are suitable fixtures) must produce the expected failing check ids; the Prefer demos must pass.

## Open decisions for the owner
- Whether to adopt the recommended vendored distribution above, or fetch by exact commit.
- Whether `heuristic` checks that cannot reach a verdict block merges or only report.
- Who may promote a bundle from `candidate` to `approved`.
