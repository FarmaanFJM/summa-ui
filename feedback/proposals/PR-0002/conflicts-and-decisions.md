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

## Draft DECISIONS entries (not applied)

### D-008 (draft) Workspace panels beside the application sidebar (P14)
A workspace page may show the application sidebar (expanded or as a 56px rail) and, in the same row, content panels beside the primary region. This is not sidebar stacking: the sidebar is the only navigation, and the panels hold content (details, pages, notes), never links to other areas. The compact rail is a presentation of the same sidebar, not an additional one. Panels render as labelled regions, not as `nav` or navigation `aside`.

### D-009 (draft) Fixed width is allowed for text and true-size content (P26)
P26 forbids fixing the size of the primary region of a workspace. A reading measure (maximum line length of articles, documents and feeds) and a preview that must show true size are exceptions under the Exception Rule and are not reported as violations.

### D-010 (draft, only if the owner wants it) Ghost buttons
Open. Two readings, neither chosen here: (a) a ghost button is a valid quiet secondary where the control is clearly a button in context; (b) every control must be visible at rest, so ghost is limited to icon buttons with a visible state or removed. FB-0018 holds the evidence.

## Version impact
Minor. Adds a pattern, principles and presets; adds no check; no approved interface can fail because of it. The regression report is `regression.json` in this folder.
