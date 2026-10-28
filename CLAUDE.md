# Summa-UI

All UI work in this repository must follow [PRINCIPLES.md](./PRINCIPLES.md). Read it before creating or changing any component, theme, or layout. The principles are defaults: break one only for a concrete usability reason, and state that reason.

## Rules for automated agents

- Agents may draft, validate and propose design rules. Agents must never approve them.
- Never set `channel` to `approved`, edit `reviewedBy`, `approvedAt`, anything under `docs/releases/`, `feedback/OWNERS.json`, or an `ownerDecision` or `confirmedBy` field. Never move a proposal to `approved`, `rejected` or `released`. Those are the owner's decisions, recorded in a reviewed pull request.
- Never move or delete a release tag. A release is immutable; changes go in a new version.
- Record design problems with `npm run feedback` (see docs/FEEDBACK_WORKFLOW.md). Preserve the screenshot, the affected component and the owner's explanation. Suggest a classification, but leave confirmation to the owner.
- Before proposing a guidance change run `npm run regression` against the approved reference applications and attach the report.
- Existing applications keep the guidance version they recorded. Do not change them silently.
- After editing anything in `guidance/` run `npm run validate`; it regenerates the manifest, so commit the result.
