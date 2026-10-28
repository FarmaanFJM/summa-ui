# Releasing a Summa-UI guidance version

A release is a Git tag plus a release record. Both are immutable. A change after release becomes a new version.

## Procedure (the owner approves; agents may prepare)
1. Proposals included in the release are `approved` by the owner (`ownerDecision`).
2. Update `guidance/` and `guidance/bundle.config.json`: version, release notes, known limitations, `provisional` presets. Keep `channel: draft` while preparing.
3. `npm run validate`, `npx tsc --noEmit`, `npx vite build`, `npm run test:browser`, `npm run test:tap`, `npm run regression -- --baseline <previous baseline> --with-layout`. All must pass or the differences be accepted by the owner in `docs/DECISIONS.md`.
4. Owner approval: the owner sets `channel: approved`, `reviewedBy` and `approvedAt` in `guidance/bundle.config.json` (an agent may make the edit only when the owner has explicitly approved in writing, and cites it in `approvalRef`).
5. `npm run guidance:build` regenerates the manifest and the digest. Create `docs/releases/guidance-v<version>.json` with that digest. `npm run validate` must pass: it checks the digest, the owner and the record.
6. Commit. That commit is the release commit; its SHA is the release SHA. Open a pull request; the owner merges it.
7. Tag the release commit with an annotated tag `guidance-v<version>`; push the tag. Do not create the tag before the validation of the final commit has passed. `npm run verify:release -- guidance-v<version>` verifies the tag from git objects alone.
8. Open the Summa pull request that vendors the release (see `docs/SUMMA_INTEGRATION.md`). Summa pins `version`, `tag`, `commit` and `bundleDigest`.

## Immutability
- Release tags are annotated and never moved or deleted. If a release is wrong, publish a new version and mark the old one superseded in its release record notes.
- Make this enforceable on GitHub (owner action, repository settings): create a tag ruleset for `guidance-v*` with "restrict updates" and "restrict deletions", and a branch ruleset for `main` that requires a pull request, code owner review and the `validate` check. Agents cannot change repository settings.
- Consumers verify the digest, not the tag name: a moved tag cannot change what a pinned digest accepts.

## Versioning
- patch: wording fixes, examples, tooling that does not change a rule or check outcome.
- minor: new anti-pattern, preset, check or clarification that adds guidance without invalidating approved interfaces.
- major: a change that can make an approved interface fail.
