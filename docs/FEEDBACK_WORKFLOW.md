# Continuous design feedback workflow

The goal: every design problem the owner finds becomes either an application fix or a reviewed improvement of the guidance, so the same mistake is not corrected by hand twice. No automated agent can approve a design rule. Only a person listed in `feedback/OWNERS.json` can.

```
owner finds a problem
   1 record  ->  2 classify  ->  3 propose  ->  4 validate  ->  5 owner review  ->  6 release  ->  7 adopt
   (issue)       (kind)          (draft)         (regression)     (decision)         (new version)   (new apps only)
```

## 1. Applications record the guidance version they used
Every application built with Summa-UI contains `summa-ui.usage.json` (schema `feedback/schema/usage.schema.json`, example `feedback/examples/example-app.usage.json`). It is generated from the consumer's lock file, never typed by hand:

```bash
node scripts/record-guidance-usage.mjs --app my-app --lock summa-ui.lock.json --repository <url> --commit <sha> \
  [--exception 'P03:diff gutter has an established meaning:diff viewer only']
```
It stores the guidance version, the bundle digest, the tag, the date and any deliberate exceptions (principle P22). Summa's Executor writes this file for every UI task and the Orchestrator copies the same version and digest into the task metadata. `feedback/applications.json` is the registry of the applications in this repository: which version each used and whether it was built with the bundle or retrofitted. The 12 laboratory prototypes are `retrofitted`, `approved-reference` interfaces.

## 2. Preserve the evidence
```bash
npm run feedback -- new --app store --component "Header search placeholder" \
  --screenshot ./shot.png --text "The owner's words, verbatim where possible" --by FarmaanFJM
```
Creates `feedback/issues/FB-0003/` with `issue.json` and a copy of every screenshot. An issue holds: the screenshot, the affected component, the explanation, the application and route, and the guidance version the application used. Issues are never deleted; they are resolved or marked `wont-fix`.

## 3. Application-specific, or a guidance problem?
Ask in this order:
1. Did the application follow the guidance it recorded? If not, it is an **application-specific** defect: fix the application, record the resolution `application-fix`, no guidance change.
2. If it followed the guidance, which statement is true?
   - **guidance-gap**: no principle, anti-pattern, preset or check covers the situation.
   - **guidance-ambiguity**: the guidance covers it but two reasonable readings give different results.
   - **guidance-incorrect**: the guidance says to do something that produces the problem.
   - **not-a-problem**: the result is acceptable (record why, so it is not raised again).
3. Does it generalize? A guidance problem must be one that a different, unseen application could repeat. If it is only this application's taste or content, it is application-specific.

```bash
npm run feedback -- classify FB-0003 --kind guidance-gap --rationale "..." --by claude-agent --principles P17
```
A classification made with the tool is always `proposed`. The owner confirms it by setting `status: confirmed`, `confirmedBy` and `confirmedAt` in review. The validator rejects a confirmation by anyone not in `feedback/OWNERS.json`.

## 4. Propose an improvement
```bash
npm run feedback -- propose FB-0003 --title "..." --kind new-check --impact minor --by claude-agent
```
Creates `feedback/proposals/PR-000N/proposal.json`, status `draft`. A proposal states the change in one or two sentences, lists the files, principles, anti-patterns, checks and presets it touches, and gives at least one **negative** and one **positive** example (a snippet, a screenshot or a gallery demo) for every kind except a plain clarification or token change. It names the version impact (patch, minor or major). If it contradicts an approved rule it lists the rule and the contradiction needs an explicit entry in `docs/DECISIONS.md`.

## 5. Validate against the approved interfaces
```bash
npm run regression -- --baseline feedback/baselines/guidance-v0.1.0.json \
  --out feedback/proposals/PR-0001/regression.json --with-tap --with-layout
```
Runs the check evaluator on every registered reference application at 1440 and 390 wide, compares failing checks with the baseline of the current approved version, and optionally re-runs the touch tap test and the desktop layout comparison. A new failing check on an approved interface is a regression: either fix the proposal, or the owner explicitly accepts it (`regressions-accepted`) and decides how the affected applications are updated. Record the report path and result in `validation`.

## 6. Owner review
The owner reviews the proposal pull request: the rule text, the examples, the regression report, the version impact. The owner records the decision in `ownerDecision` (`by`, `decision`, `at`, `note`) and moves the status to `approved`, `rejected` or back to `draft` (changes requested). Agents never write that block.

## 7. Release and adoption
An approved proposal is released only in a new guidance version, with its own release record and immutable tag (see `docs/RELEASING.md`). The proposal then moves to `released` with `releasedIn`.

- **Future applications** use the new version once the owner has approved the release and Summa re-vendored it (a reviewed Summa pull request).
- **Existing applications are not changed silently.** They keep the version in their `summa-ui.usage.json`. Updating one is a separate, explicit task the owner requests; it records a new version on completion.

## Roles and what agents may do
| Step | Owner | Automated agent |
| --- | --- | --- |
| Record issue, screenshot, explanation | yes | yes |
| Suggest classification | yes | yes (always `proposed`) |
| Confirm classification | yes | no |
| Draft proposal and examples | yes | yes |
| Run regression validation | yes | yes |
| Approve or reject a proposal | yes | no |
| Approve a guidance version, create a release tag | yes | no (agents may prepare it, the owner approves in review) |
| Update an existing application to a new version | on request | only when requested |

## Enforcement
- `scripts/validate-feedback.mjs` (part of `npm run validate`) rejects approvals, confirmations or release records that name anyone other than an owner, proposals missing examples or validation when submitted, issues without their screenshot, unknown versions and digests.
- `.github/CODEOWNERS` requires the owner's review for `PRINCIPLES.md`, `guidance/`, `docs/releases/`, `feedback/` records and the workflows. This only binds when branch protection "Require review from Code Owners" is enabled on `main` (an owner setting, see `docs/RELEASING.md`).
- `CLAUDE.md` forbids agents from approving rules or touching release records.

Honest limit: a validator cannot prove that a human typed an approval. The protection is the combination of the owner list, required code owner review and branch protection. Enable them.
