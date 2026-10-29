# PR-0002 candidate amendments from CaissaTrainer Phase 2 (DRAFT, not approved)

Candidate numbering only. Nothing here is in `guidance/` or `PRINCIPLES.md`. Evidence is FB-0020 to FB-0034. Source material: CaissaTrainer `docs/ui-migration/phase2/{training-overview,training-notes,notes-app,education}.md`. Each item says whether the owner would be closing a gap in approved guidance or correcting a failure to apply it.

## A. Workspace pattern (candidate P23 to P26, see principles.md)

Edits already folded into `principles.md` and `principles.json`: the control rail (FB-0020), optional tools closed by default and remembered (FB-0021), a duplicate view is secondary and capped (FB-0022), panels yield first with the default sized against their minimums (FB-0023), modal drawer semantics (FB-0024). All five are gaps.

## B. Tags and colour: amendment to AP-005, P06 and CHK-005 (FB-0025)

Mostly a failure to apply P04, P05, P06 and AP-005 in CaissaTrainer. Four gaps:

1. P06 lists identity among what an accent may communicate. Candidate clarification: a category is not an identity. A tag set that gives each category its own hue (an ability, a content type, a product area) is decorative colour coding. Use one neutral tag fill for every category and let the text carry the difference.
2. Do not repeat the container. A tag that restates the heading, filter, tab or page it sits under is removed, or shown once at the container level.
3. A state colour (warning, danger, success) must never be used as a category hue. Semantic badges carry state in the state colour; category badges are neutral.
4. CHK-005 detects only fully rounded pills (radius at least half the height, height at most 28px). Candidate detection: also flag small radius, non interactive labels that appear on three or more sibling cards or rows in one view, with text of 20 characters or fewer.

Conflicts with approved guidance: none. It tightens P04, P06 and AP-005 and keeps functional filters, category and state tags allowed.

## C. Surface equal to its parent (FB-0028)

Candidate check (number to be assigned by the owner, written here as CHK-NEW-A): a region with a surface role (panel, sheet, card, field) whose resolved background equals its parent's resolved background is reported. Rule text: a region placed on the page panel step uses the next step. Makes P01 and P02 testable. Gap (the check), with the application defect itself a failure to apply P02.

## D. Editable text fields (FB-0026), candidate principle CAND-A

An editable text region identifies itself: a surface one step above its ground or a visible field, one short prompt while empty drawn from an attribute so it never enters the saved content, a neutral visible focus ring, an accessible name (and a description for the prompt), and a save state that follows the real save cycle (idle, saving, saved, failed with a retry) in one always mounted polite status region. Gap.

Tensions for the owner: CaissaTrainer doctrine U4 (a placeholder demonstrates and never instructs) versus prompts such as "Start writing". P04 (no arbitrary status tags such as "Automatically saved") versus a save state: a state that carries failure and retry is functional, an always on reassurance is not.

## E. Toolbar density and grouped options menu (FB-0027), candidate principle CAND-B

A small tool shows at most about four direct controls (frequency decides visibility). The rest go in one grouped menu button with a visible word on the trigger, labelled groups, the full menu button keyboard pattern, disabled items with a reason, and 40px coarse targets. The number is a judgement for the owner. Gap or ambiguity at the margin of P10.

## F. Honest toggles (FB-0034), candidate principle CAND-C

Pressed follows what is visible, not what is wanted. An unavailable toggle is disabled with a stated reason, never styled as on. Gap.

## G. Page level controls and repeated controls (FB-0030, FB-0032, FB-0033), candidate anti-pattern CAND-AP

Education findings. (1) Controls that act on a page's list belong in the page title band, not in a column of their own beside the application sidebar (applies P14 and the meta principle). (2) Centring is a preference: a reading column has a floor measure and centring yields to it (FB-0031). (3) One verb control with the category chosen inside, not the same verb repeated per category (P10 already says this for Create label). (4) One set of page turn controls per breakpoint, not a bottom bar plus an inline copy. Candidate anti-pattern: "The same action repeated per group or per breakpoint". Mostly failures to apply P10, P15, P18 and the meta principle; the anti-pattern is the gap.

## H. Undefined colour class (FB-0029)

An unknown label or tone class silently rendered the accent. Optional token lint: fail on a label class that is not defined. Application bug; the lint is the only generalizable part and the owner may decline it.
