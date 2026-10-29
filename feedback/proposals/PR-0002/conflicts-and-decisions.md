# PR-0002: conflicts with approved rules and draft DECISIONS notes (DRAFT)

Agents cannot edit `docs/DECISIONS.md` (owner-protected) and the validator requires every id in `change.conflictsWithApprovedRules` to appear in that file, so `proposal.json` keeps that list empty. The owner copies the entries below into `docs/DECISIONS.md` (new ids, newest first) if they approve the direction, and then fills `conflictsWithApprovedRules` with the ids. The wording is a draft to edit, not a decision.

## Contradictions and tensions found

| Approved rule | Candidate | Contradiction? |
| --- | --- | --- |
| P14 No Sidebar Stacking (and AP-011, CHK-011) | P23 panels beside the primary region; the compact rail | No direct contradiction. P14 already allows content panes ("editors, inspectors, order books and detail panels are not automatically forbidden"). It needs an explicit statement because a workspace has an application sidebar and panels in one row, and a rail is a second presentation of the same sidebar. |
| P16 Layout Diversity | P23 and P26 | No. They apply only to pages with a primary region. P23 must not become a universal layout. Scope sentence is in the candidate text. |
| P10 Minimalism Over Prevalence, AP-016 | The toolbar shows six controls (two toggles, four size buttons) | Tension. The slider handle and keyboard are the required controls; the four buttons are optional. Owner decides whether the pattern ships them visible, in a menu, or not at all. |
| P05 Information Must Earn Its Place | P23 progressive disclosure | Consistent. P23 applies P05 to layout. |
| P26 versus approved reference interfaces with a fixed central width (the feed in Social, the writing canvas in Document Editor) | P26 | Possible, only through wording. P26 as drafted exempts text with a reading measure. No check enforces it, so the regression run is neutral; the owner decides whether P26 stays a principle without a check. |
| Ghost buttons (`.sm-btn--ghost`, React `Button variant="ghost"`) | None proposed | Open question (FB-0018). CaissaTrainer bans ghost buttons; Summa ships one. This proposal does not add or remove a rule. The reference toolbar uses a visible neutral fill so it works under either reading. |
| CHK-011 procedure text versus its collector | Panel markup | The procedure says nav, `aside[aria-label*=nav]` and `[role=navigation]` count, and that content panes do not. `scripts/lib/collector.mjs` matches every `aside`. The first run of `#/workspace` flagged the shell sidebar plus a panel `<aside>`. The reference now renders panels as `<section aria-label>` (a labelled region, valid for a content pane). Owner decides whether to fix the collector to follow the procedure text, which would be a check revision. |

## Added by CaissaTrainer Phase 2 (FB-0020 to FB-0034)

| Approved rule | Candidate | Contradiction? |
| --- | --- | --- |
| P06 (identity listed among what an accent may communicate) | Category colour is not identity (amendments.md B) | No contradiction; a clarification. The owner decides whether "identity" stays or is narrowed to brand identity. |
| P04, AP-005 | Same, plus do not repeat the container, state colour is not a category hue | No. Tightens them. Filters, category and state tags stay allowed. |
| CHK-005 (detects only fully rounded pills, height at most 28px) | Detect repeated small radius non interactive labels on sibling cards | Check revision, not a contradiction. A widened check could fail approved reference applications; the regression run attached to this proposal measures that (the candidate is not implemented in any check, so the run is neutral). |
| P04 (no arbitrary status tags such as Automatically saved) | Save state in editable fields (amendments.md D) | Tension. A save state that carries failure and retry is functional; an always on reassurance is not. Owner decides where the line is. |
| CaissaTrainer U4 (a placeholder demonstrates, never instructs) | Prompt while an editable field is empty | Tension in the consumer's own doctrine (not a Summa rule). Owner says whether prompts such as "Start writing" are demonstrations. |
| CaissaTrainer U1 (no ghost buttons, no actions that appear only on hover) | Quiet rail at 0.78 opacity, hover revealed block tools | Tension. The rail is always present and full emphasis on touch; hover revealed block tools need one permanent labelled creation entry (FB-0021). Related to FB-0018 (ghost buttons), which stays undecided. |
| P10 | Rail menu and the grouped options menu (about four direct controls) | Consistent; the number four is a judgement for the owner. Resolves the earlier open question about four size buttons: the buttons are replaced by one menu. |
| P14 | Page level controls in the title band, not a column of their own | Applies P14; FB-0030 is an ambiguity the owner may settle with one sentence. |

## Draft DECISIONS entries (not applied)

### D-008 (draft) Workspace panels beside the application sidebar (P14)
A workspace page may show the application sidebar (expanded or as a 56px rail) and, in the same row, content panels beside the primary region. This is not sidebar stacking: the sidebar is the only navigation, and the panels hold content (details, pages, notes), never links to other areas. The compact rail is a presentation of the same sidebar, not an additional one. Panels render as labelled regions, not as `nav` or navigation `aside`.

### D-009 (draft) Fixed width is allowed for text and true-size content (P26)
P26 forbids fixing the size of the primary region of a workspace. A reading measure (maximum line length of articles, documents and feeds) and a preview that must show true size are exceptions under the Exception Rule and are not reported as violations.

### D-011 (draft) Category colour is not identity (P06, AP-005)
A tag set with one hue per category is decorative colour coding. Tags use one neutral fill; text carries the category. State colours are never category hues. A tag that restates its container is removed. CHK-005 is widened (owner decides) to flag repeated small radius non interactive labels. Evidence: FB-0025.

### D-012 (draft) Prompts and save state in editable fields (U4, P04)
A short prompt that demonstrates what goes in an empty editable field is allowed; a save state is allowed when it reports a real cycle (saving, saved, failed with retry) and not as permanent reassurance. Evidence: FB-0026.

### D-010 (draft, only if the owner wants it) Ghost buttons
Open. Two readings, neither chosen here: (a) a ghost button is a valid quiet secondary where the control is clearly a button in context; (b) every control must be visible at rest, so ghost is limited to icon buttons with a visible state or removed. FB-0018 holds the evidence.

## Version impact
Minor. Adds a pattern, principles and presets; adds no check; no approved interface can fail because of it. The regression report is `regression.json` in this folder.
