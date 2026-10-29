# PR-0002: conflicts with approved rules and draft DECISIONS notes (DRAFT)

Agents cannot edit `docs/DECISIONS.md` (owner-protected) and the validator requires every id in `change.conflictsWithApprovedRules` to appear in that file, so `proposal.json` keeps that list empty. The owner copies the entries below into `docs/DECISIONS.md` (new ids, newest first) if they approve the direction, and then fills `conflictsWithApprovedRules` with the ids. The wording is a draft to edit, not a decision.

## Contradictions and tensions found

| Approved rule | Candidate | Contradiction? |
| --- | --- | --- |
| P14 No Sidebar Stacking (and AP-011, CHK-011) | P23 panels beside the primary region; the compact rail | No direct contradiction. P14 already allows content panes ("editors, inspectors, order books and detail panels are not automatically forbidden"). It needs an explicit statement because a workspace has an application sidebar and panels in one row, and a rail is a second presentation of the same sidebar. |
| P16 Layout Diversity | P23 and P26 | No. They apply only to pages with a primary region. P23 must not become a universal layout. Scope sentence is in the candidate text. |
| P10 Minimalism Over Prevalence, AP-016 | The first draft toolbar showed six controls (two toggles, four size buttons) | Resolved by Phase 2 and 3: size controls moved into one rail (a slider handle and one options menu), and the toolbar toggles were replaced by quiet edge chevrons (FB-0020, FB-0037). The toolbar renders only when a page has content for it. |
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
| P04 (no arbitrary status tags such as Automatically saved) | Save state in editable fields (amendments.md D) | Was a tension in the Phase 2 draft, which listed `saved` as a state to show. Reconciled in Phase 3 (FB-0035, FB-0026 update): a save state is shown only when it communicates a condition (saving in flight, failure with retry, offline or unsynced), never as permanent copy and never `saved` at rest. The rule now agrees with P04 and AP-005. |
| CaissaTrainer U4 (a placeholder demonstrates, never instructs) | Prompt while an editable field is empty | Tension in the consumer's own doctrine (not a Summa rule). Owner says whether prompts such as "Start writing" are demonstrations. |
| CaissaTrainer U1 (no ghost buttons, no actions that appear only on hover) | Quiet rail at 0.78 opacity, hover revealed block tools | Tension. The rail is always present and full emphasis on touch; hover revealed block tools need one permanent labelled creation entry (FB-0021). Related to FB-0018 (ghost buttons), which stays undecided. |
| P10 | Rail menu and the grouped options menu (about four direct controls) | Consistent; the number four is a judgement for the owner. Resolves the earlier open question about four size buttons: the buttons are replaced by one menu. |
| P14 | Page level controls in the title band, not a column of their own | Applies P14; FB-0030 is an ambiguity the owner may settle with one sentence. |

## Added by CaissaTrainer Phase 3 (FB-0035 to FB-0041, updates on FB-0021, FB-0023, FB-0024, FB-0026, FB-0027, FB-0034)

| Approved rule | Candidate | Contradiction? |
| --- | --- | --- |
| P04, P05, P09, P21, AP-005, AP-010 | Redundant explanatory copy (amendments.md I) | No. The evidence is a failure to apply them. The candidate is a patch level clarification (extend AP-010; do not add a duplicate anti-pattern) and an optional narrow check. P10 is not cited as a source: its rules are about controls. |
| P05 and P04 versus the Phase 2 draft D (editable fields) | Draft D told editable fields to show saved | The draft contradicted approved guidance, not the other way round. Amended in this proposal: no `saved` at rest, no permanent `Saves automatically`. FB-0026 carries the update, so the drafts agree. |
| P08 Familiarity Is a Feature | A quiet edge chevron instead of a labelled toolbar button | Possible tension: a labelled button is more discoverable than a 70 percent chevron tab. Mitigations in the draft: always present, never hover only, 24x64 with an 8px extension and full strength on touch, a name and a title that say what a press does, a disclosure row when stacked. Owner decides whether the tab is discoverable enough; it needs a look on a real touch device. |
| P17 and P15 (neutral, light focus and selection) | Chevron tab has a visible neutral fill and the shared neutral focus ring | Consistent. Related to the undecided ghost button question (FB-0018): the chevron is visible at rest, the options trigger is transparent until hover (FB-0027 update) and stays an owner question. |
| P18 Mobile Navigation Breathing Room, CHK-020 | Chevron and disclosure row targets | Consistent: 40px effective on touch, measured with the tap test on `#/workspace`. |
| P02 and P01 (surface ladder, no borders within borders) | The right panel draws no surface and no heading | Consistent: it adds no surface, so nothing is nested. The optional left panel stays one step above the page. |
| P16 Layout Diversity | Task ordered stacking, hidden panels reserve nothing | No contradiction; both apply only to pages with a primary region. |
| CaissaTrainer U1 (no hover only actions, no ghost buttons) | Chevron at 70 percent opacity at rest, full on hover | Not a Summa rule. The chevron is always present and full strength on touch; U1 is the consumer's own doctrine and is related to FB-0018. |

## Added by CaissaTrainer Phase 4 (FB-0042 to FB-0044, updates on FB-0020 and FB-0041)

| Approved rule | Candidate | Contradiction? |
| --- | --- | --- |
| P11 The Rectangle Rule (AP-014, CHK-014) | Contextual controls align with the region's edges or sit in a control region measured from it (amendments.md K1) | No. P11's approved rules and exception are about indentation, so the candidate does not contradict them and is not already covered by them. If the owner wants the general sentence in P11 itself, that is a patch level clarification (option K1b); the draft keeps it in candidate P23. |
| P01 and P02 | The rail column is a surface step (`--s2` on the `--s1` workspace), no border, controls hover to `--s3` | Consistent: no nested border, each surface lighter than its parent. Related to FB-0028 (a surface must differ from its parent): it does. |
| P12 Dividers | None | Not relevant. |
| P16 Layout Diversity | The alignment rule applies only to controls about a primary region | No contradiction; scope sentence in K1. |
| P09 Simplicity Beats Cleverness and the Meta-Principle Remove Before Adding | The container adds a surface | Tension, justified: no control is added, a detachment is removed. The wording also allows edge aligned controls with no surface, so the owner may prefer that reading. |
| Candidate P23 control rail bullet (FB-0020) and candidate P26 resize bullet | The column spans the region's height, controls on its edges, 8px gap, 40px reserved | No contradiction: the rail still sits beside the region (below when stacked), is quiet at rest and reserves its width on both sides. FB-0037 edge chevrons attach to the workspace edge and are a different control. |
| FB-0018 ghost buttons (undecided) | Rail buttons are transparent inside a visible surface | Still open. The surface makes them findable; the owner decision on ghost buttons is unchanged. |
| P14 No Sidebar Stacking | A persistent return control (K2) is not navigation sidebar content | No contradiction; P14 covers back chevrons inside navigation, K2 a return to a task in another area. The approved tokens define no layer scale, so the order below modal layers is a question for the owner (token addition, not a principle). |

## Draft DECISIONS entries (not applied)

### D-008 (draft) Workspace panels beside the application sidebar (P14)
A workspace page may show the application sidebar (expanded or as a 56px rail) and, in the same row, content panels beside the primary region. This is not sidebar stacking: the sidebar is the only navigation, and the panels hold content (details, pages, notes), never links to other areas. The compact rail is a presentation of the same sidebar, not an additional one. Panels render as labelled regions, not as `nav` or navigation `aside`.

### D-009 (draft) Fixed width is allowed for text and true-size content (P26)
P26 forbids fixing the size of the primary region of a workspace. A reading measure (maximum line length of articles, documents and feeds) and a preview that must show true size are exceptions under the Exception Rule and are not reported as violations.

### D-011 (draft) Category colour is not identity (P06, AP-005)
A tag set with one hue per category is decorative colour coding. Tags use one neutral fill; text carries the category. State colours are never category hues. A tag that restates its container is removed. CHK-005 is widened (owner decides) to flag repeated small radius non interactive labels. Evidence: FB-0025.

### D-012 (draft, amended in Phase 3) Prompts and save state in editable fields (U4, P04)
A short prompt that demonstrates what goes in an empty editable field is allowed. A save state is allowed only when it communicates a condition: saving while a request is in flight, a failure with a retry, offline or unsynced. It is not shown at rest and not after a success (`Saved` is the idle state restated), and no permanent line announces ordinary persistence (`Saves automatically`). The field keeps an accessible name through aria-label when the container heading already names it. Evidence: FB-0026 (with its Phase 3 update), FB-0035.

### D-013 (draft) Redundant explanatory copy (P05, P04, AP-005, AP-010)
Copy that repeats the title of its container, permanently explains an obvious interaction, communicates no current state, restates ordinary discoverable behaviour, or exists only because an area looks empty is removed. Explanation stays for ambiguous controls, essential instructions, status that affects the next decision, privacy or data loss information, accessibility names and temporary save or failure feedback. Recorded as an AP-010 clarification, not as a new principle. Evidence: FB-0035, FB-0038.

### D-014 (draft) Panel toggles are edge chevrons; a workspace panel has no X (P08, P10)
A panel that is part of the workspace is shown and hidden by a quiet chevron attached to its workspace edge (a disclosure row when stacked), which reports aria-expanded; there is no toolbar button named after the panel and no X, because an X implies a dismissable window. An overlay drawer closes with a back chevron. A hidden or collapsible area must not be the only owner of a control needed to continue. Evidence: FB-0037, FB-0034 update.

### D-010 (draft, only if the owner wants it) Ghost buttons
Open. Two readings, neither chosen here: (a) a ghost button is a valid quiet secondary where the control is clearly a button in context; (b) every control must be visible at rest, so ghost is limited to icon buttons with a visible state or removed. FB-0018 holds the evidence.

## Version impact
Minor. Adds a pattern, principles and presets; adds no check; no approved interface can fail because of it. The regression report is `regression.json` in this folder.
