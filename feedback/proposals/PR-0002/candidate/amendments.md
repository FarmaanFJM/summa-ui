# PR-0002 candidate amendments from CaissaTrainer Phases 2, 3 and 4 (DRAFT, not approved)

Candidate numbering only. Nothing here is in `guidance/` or `PRINCIPLES.md`. Evidence is FB-0020 to FB-0041. Source material: CaissaTrainer `docs/ui-migration/phase2/{training-overview,training-notes,notes-app,education}.md` and `phase3/{notes,session-info}.md`. Each item says whether the owner would be closing a gap in approved guidance or correcting a failure to apply it.

## A. Workspace pattern (candidate P23 to P26, see principles.md)

Edits already folded into `principles.md` and `principles.json`: the control rail (FB-0020), optional tools closed by default and remembered (FB-0021), a duplicate view is secondary and capped (FB-0022), panels yield first with the default sized against their minimums (FB-0023), modal drawer semantics (FB-0024). All five are gaps. Phase 3 revised the draft (section J): hidden panels reserve no width and the group is centered (FB-0036, replaces the equal reserve rule), edge chevron toggles with aria-expanded and no panel X (FB-0037), task ordered stacking (FB-0040), per module capability that never strands data (FB-0041), the optional panel yielding to a drawer before restack, portrait stacking, default cap 720 and fill 0.92 (FB-0023 update).

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

An editable text region identifies itself: a surface one step above its ground or a visible field, one short prompt while empty drawn from an attribute so it never enters the saved content, a neutral visible focus ring, an accessible name (and a description for the prompt), and a save state that is shown ONLY when it communicates a condition (saving in flight, failed with a retry, offline or unsynced), in one always mounted polite status region that is empty at rest and has reserved height. Gap.

Amended in Phase 3 (reconciliation with FB-0035, see section I): the first draft listed the save cycle as `idle, saving, saved, failed with a retry`. Showing `saved` (and a permanent `Saves automatically`) is the idle state restated and violates P04, P05, AP-005 and AP-010; it was removed from CaissaTrainer. Rule now: a save state appears only while it is news. The accessible name comes from an aria-label when the container's heading already names the field, and a visible label that repeats the heading is not added. The two drafts no longer contradict each other: D says when a state may be shown, I says that copy with no current state is removed.

Tensions for the owner: CaissaTrainer doctrine U4 (a placeholder demonstrates and never instructs) versus prompts such as "Start writing". P04 (no arbitrary status tags such as "Automatically saved") versus a save state: a state that carries failure and retry is functional, an always on reassurance is not (now stated in the rule itself).

## E. Toolbar density and grouped options menu (FB-0027), candidate principle CAND-B

A small tool shows at most about four direct controls (frequency decides visibility). The rest go in one grouped menu button, labelled groups, the full menu button keyboard pattern, disabled items with a reason, and 40px coarse targets. The number is a judgement for the owner. Gap or ambiguity at the margin of P10.

Amended in Phase 3 (FB-0027 update): the trigger is a compact icon button (an ellipsis for more actions) with an aria-label and a title, not a large labelled button; a visible word is optional when the icon is conventional and named. The floating menu must be clamped inside the viewport (a menu opened from a trigger at the left edge was clipped at 1440) and checked at the narrowest and widest layouts.

## F. Honest toggles (FB-0034), candidate principle CAND-C

Pressed follows what is visible, not what is wanted. An unavailable toggle is disabled with a stated reason, never styled as on. Gap.

Amended in Phase 3 (FB-0034 update): a control that shows or hides a region reports `aria-expanded`, not `aria-pressed`; a tool that a task does not offer renders no control instead of a disabled one (FB-0041).

## G. Page level controls and repeated controls (FB-0030, FB-0032, FB-0033), candidate anti-pattern CAND-AP

Education findings. (1) Controls that act on a page's list belong in the page title band, not in a column of their own beside the application sidebar (applies P14 and the meta principle). (2) Centring is a preference: a reading column has a floor measure and centring yields to it (FB-0031). (3) One verb control with the category chosen inside, not the same verb repeated per category (P10 already says this for Create label). (4) One set of page turn controls per breakpoint, not a bottom bar plus an inline copy. Candidate anti-pattern: "The same action repeated per group or per breakpoint". Mostly failures to apply P10, P15, P18 and the meta principle; the anti-pattern is the gap.

## H. Undefined colour class (FB-0029)

An unknown label or tone class silently rendered the accent. Optional token lint: fail on a label class that is not defined. Application bug; the lint is the only generalizable part and the owner may decline it.

## I. Redundant explanatory copy: clarification of AP-010, P04 and AP-005 (FB-0035, FB-0038), candidate CAND-D

Status: DRAFT. Classification of the evidence: mainly a failure to apply approved guidance (application specific), plus a small wording question. Nothing here is approved.

What the approved text already says (quoted from v0.1.0): P05 "Do not explain familiar concepts because space is available." and "Prefer familiar patterns, clear naming, predictable position, progressive disclosure and contextual help over permanent explanation." P04 "Never create status tags for information that need not be shown (for example 'Automatically saved')." AP-005 problem "Status chips such as 'Automatically saved' tell users nothing they can use", with the exception "A failure state that users must notice and fix (for example 'Not saved') may use a tag or an inline indicator". AP-010 "Unnecessary explanatory copy": "Remove helper text that explains familiar fields; keep copy that prevents a real error or consequence", review questions "Would a user get stuck without this sentence?" and "Does the text restate the label?". P09 and P21 ask to justify and to subtract first. P10 (Minimalism Over Prevalence) is about showing every possible action at once; it supports the owner's word "minimalism" by spirit but its rules do not speak about copy.

Where the wording leaves room: P04 and AP-005 are written about tags and pills, and AP-010 about helper text under fields and paragraphs in empty states. A plain text line that repeats the title of its container ("Your private note" under the heading "Notes"), a permanent line announcing ordinary behaviour ("Saves automatically"), or a generic heading over self describing content ("Details" over counts) is covered by their spirit and by AP-010's review question, but not by a sentence. CHK-005 matches only fully rounded pills (its pattern list contains `saved`), CHK-010 only paragraphs of 25 or more characters next to controls or headings, so none of the three CaissaTrainer strings would have been reported.

**Overlap warning.** A new anti-pattern named "Redundant explanatory copy" would duplicate AP-010 "Unnecessary explanatory copy". The recommended form is a patch level amendment of AP-010 (extend `problem`, `bad`, `exceptions` and the review questions). If the owner wants a separate entry, the text below is written so it can stand alone.

Do NOT create a principle called "No helper text". The problem is unnecessary explanation, not explanation. Explanation that is needed stays (exceptions below).

### Candidate wording (anti-pattern, number and name to be assigned by the owner)

- **Name:** Redundant explanatory copy (or: extend AP-010).
- **Summary:** Copy earns its place by telling the person something they cannot already see. Remove text that restates its container, describes an obvious interaction, or reports a state nobody needs to act on.
- **Problem:** Permanent labels, headings and status lines that add no information push content down, train people to skip text, and make the real messages (a failure, a data loss warning) harder to notice. They look harmless one at a time and accumulate.
- **Examples to remove:**
  1. repeating the title of the containing panel ("Your private note" under "Notes");
  2. permanently explaining an obvious interaction ("Type here to write", "Click to edit");
  3. informational text that communicates no current state ("Saves automatically", "Saved", "All changes saved" while idle);
  4. persistent copy explaining ordinary behaviour that is already discoverable (a sentence under a field describing what a field does);
  5. labels or headings added only because an area looks empty (a "Details" heading over content that already says what it is).
- **Better:** let the container's heading carry the name, give the field an accessible name (aria-label) instead of visible copy, keep a short prompt only while the field is empty, and show status only when it is news (a request in flight, a failure with a retry). An event is acknowledged briefly instead of permanently (AP-005 good example "Notification").
- **Exceptions that stay:** a label or hint on an ambiguous or unfamiliar control; an essential instruction needed to proceed; status that affects the next decision (saving in flight, failure, offline, unsynced); privacy or data loss information; accessibility names (they stay even when no visible text carries them); temporary save or failure feedback; legal or safety text and a dismissible first use hint (already P05 exceptions).
- **Review questions:** Does the text restate the label or the heading it sits under? Does it describe a state that would be the same for every person at every moment? Would a user get stuck or lose data without it? Would an accessible name do instead?
- **Related:** P04, P05, P09, P21, AP-005, AP-010; draft section D (save state only when it communicates a condition).

### Candidate check idea (only the parts that can be stated precisely)

1. **Idle reassurance phrases (precise, heuristic).** Report any visible non interactive text whose normalized text matches `^(saves automatically|automatically saved|autosaved|auto-saved|all changes (are )?saved|changes saved|saved)$` (case insensitive) and which is present at first render, before any interaction. A real status appears only after an action, so presence at load is what makes it permanent. Mark needs-human. Evidence: a source search of `src/` in this repository finds none of these strings in the 12 reference applications (only the Principles page copy that forbids them), so the check is expected to be neutral on them; that is not the same as running it, and no check is implemented.
2. **Label equals container heading (precise but narrow).** Report a visible text element whose normalized text (lowercase, trimmed, one leading "your" or "the" removed, trailing "s" removed) equals the normalized text of the heading or aria-label of its nearest labelled region. Honest limit: this would NOT have caught "Your private note" under "Notes" ("private note" is not "note"). The restatement in that case is semantic, so it stays a human review question (AP-010: "Does the text restate the label?"). I do not propose a check for it.
3. Not checkable: whether copy is "obvious". Left to review.

Version impact if adopted: patch (clarification) for the wording; minor only if the owner adds a check. No approved reference application can fail because of a wording change.

## J. Phase 3 findings register (CaissaTrainer, drafts)

Each finding is classified against approved guidance first (existing principle violation, ambiguity, missing reusable pattern, product specific). Nothing is approved; the classification is a proposal until the owner confirms it.

| Finding | Issue | Classification | Where it lives in this draft |
| --- | --- | --- | --- |
| Redundant explanatory copy (label repeating the panel title, permanent save line) | FB-0035 | Violation of P04, P05, P09, P21, AP-005, AP-010 (application specific), small residual wording question | Section I; section D amended |
| (a) Primary region flanked by equal panels; hidden panels reserve no space; board and open panels centered as a group | FB-0036 | Missing reusable pattern; amends the Phase 2 draft equal reserve rule | principles.md P23; geometry; proposal |
| (b) Panel toggles as edge chevrons, no toolbar buttons named after panels, no X on a workspace panel; touch discoverability; disclosure row when stacked; a collapsible area must not own a control needed to continue | FB-0037 | Missing reusable pattern; amends FB-0034 (aria-expanded) | principles.md P23, P24 |
| (c) Generic headings ("Details") over self describing content, redundant derived stat tiles | FB-0038 | Violation of P05, P21, P09, AP-010 (application specific) | Section I (one example) |
| (d) Human friendly session information: state header in words, real counts only, never invented progress, one home per fact | FB-0039 | Ambiguity (P05, P20, AP-006 by spirit); the chess header is product specific | Not drafted as a rule; owner may want one sentence |
| (e) Task oriented stacked order: region, status and answer, session information, optional tools | FB-0040 | Missing reusable pattern (extends FB-0015 and P18) | principles.md P23 |
| (f) Compact contextual options menu: icon trigger with aria-label, not a large labelled button; menu clamped to the viewport; keyboard and touch | FB-0027 update | Merged into the toolbar density finding: the Phase 2 draft required a visible word on the trigger, amended; clipping is a functional rule | Section E |
| (g) Optional tools per module with a documented reason, closed by default and remembered; never lose user data (when-saved) | FB-0041, FB-0021 update | Missing reusable pattern; product specific module table stays in CaissaTrainer | principles.md P23 |
| (h) Optional panel yields to a drawer before restack (COMFORT_MIN, priority order, session information last); portrait stacking; default cap 720, fill 0.92 | FB-0023 update | Merged into the panels yield finding; numbers are reference values for the owner | principles.md P24; geometry |

Product specific, stays in CaissaTrainer: the Notes module table (which module offers notes), Studies as available, the "White to Move" header and its colour chip, the training integrity limits on hidden positions, the board options contents (flip, FEN, annotation symbols).

## K. Phase 4 findings (CaissaTrainer, drafts): control alignment, return control, temporary context

Status: DRAFT. Candidate wording only, not policy. The owner decides everything, including whether any of this is wanted. Classification is a proposal until the owner confirms it.

### K1. Contextual controls align with the region they belong to (FB-0042), candidate wording

**What happened.** The Phase 3 control rail floated two small transparent icon buttons beside the board in a column that was spaced between top and bottom but had no visible container. Each icon hung at an arbitrary inset from the board's corners (about 15px inside the top edge and 17px inside the bottom edge in the 1366 screenshot), so the pair looked detached from the board and from each other. Phase 4 made it one narrow rectangular column (32px, `--s2`, 8px from the region) exactly as tall as the board, with the options control on the board's top edge and the resize control on its bottom edge, one alignment, measured from the board box. The e2e measures rail 122 to 674 against board 122 to 674, 8px gap, one x. The Summa-UI reference lab had the same defect and now has the same fix, measured in a real browser by `scripts/test-workspace-alignment.mjs`.

**What approved guidance says (v0.1.0), and why it does not already cover this.**

| Source | Exact approved text | Does it cover the finding? |
| --- | --- | --- |
| P11 The Rectangle Rule | Summary: "Organize information in clean rectangular regions." Rules: "Do not use indentation as the primary hierarchy mechanism." "Express hierarchy with typography, text color, weight, size and spacing; body content starts at the same left edge as its heading." "Prefer flat lists, breadcrumbs and a single-level sidebar to indented trees." Exception: "List marker gutters and table cell padding are not indentation." PRINCIPLES.md adds that indentation "breaks the rectangular flow of the interface and gradually produces increasingly irregular content edges". | By spirit only. Every rule and exception is about indentation of hierarchical content. The Phase 3 rail passed all of them. Not already covered as written. |
| AP-014 and CHK-014 | "Indentation where flat rectangular organization works better"; check "Indentation used for hierarchy". | No. Indentation only. |
| P01 No Borders Within Borders | Hierarchy through "background elevation, spacing, typography, subtle section dividers". | Not violated before or after; the column uses a surface step and no border. Not relevant to alignment. |
| P02 Dark Themes Move From Dark to Light | Each elevated surface is lighter than its parent; "Elevation should read without borders." | Not violated; the column is `--s2` on the `--s1` workspace, controls hover to `--s3`. It supports using a surface step instead of a border. |
| P12 Dividers Are Secondary Structure | "Prefer spacing first." | Not relevant: no divider is added or needed. |
| P16 Layout Diversity | "Choose layout from the task, user expectations and information architecture." | Not violated. The candidate applies only to a page that has a primary region and must not become a universal layout (scope sentence below). |
| P10 Minimalism Over Prevalence | Contextual controls, fewer visible controls. | Consistent: two controls stay, the rest stay in one menu. |
| Anti-patterns and checks | None touch floating, detached or misaligned controls. | A gap. |

**Classification (proposed): guidance-gap, with P11 as the nearest home.** Honest alternatives: if the owner reads the P11 summary broadly, this is a guidance-ambiguity settled by one patch level sentence (K1b below). It is not product specific: it repeats for an image viewer (zoom, rotate, fit), a map (zoom, layers), a code editor (a tool column or gutter spanning the editor), a video player (transport on the bottom edge) and a canvas or document preview.

**Candidate wording (K1a, recommended home: the control rail bullet of candidate P23, already inserted in `principles.md` and `principles.json`).**

> Contextual controls associated with a primary rectangular region align with that region's meaningful edges, or sit in an explicitly defined control region measured from the region (never at arbitrary offsets or page coordinates). A control column spans the region's height with its controls on the region's edges.

Supporting detail kept in the P23 bullet and the preset (reference values, for the owner to keep or drop): one narrow rectangular surface, no border, a small gap from the region; first control on the top edge, last on the bottom edge, one alignment; stacked, a compact row under the region aligned to its right edge; 40px targets on touch.

Scope (so it cannot grow into a universal layout, P16): it applies to controls about a primary region, not to page level controls (a toolbar, navigation, the return control in K2) and it does not forbid a control placed inside the region on one of its edges, provided it never covers content the person needs to see (a board square, a map label).

**Why P23 and not P24.** P23 already holds the control rail rule (FB-0020) and the rail's width reservation; this refines where the rail's controls sit. P24 is about panels yielding as space runs out and has no control placement rule. Putting the sentence in P23 also keeps P11 (a general principle with an approved, indentation specific text) untouched.

**Option K1b, only if the owner prefers a general rule (patch level clarification of approved P11, to be written by the owner, not by an agent).** Candidate sentence: "Regions have rectangular surroundings too: controls that belong to a region align with its edges or sit in a control region measured from it, instead of floating beside it at arbitrary offsets." Risks: it makes P11 about more than indentation, and AP-014 and CHK-014 would still be indentation only. If K1b is chosen, K1a can be reduced to a pointer.

**No contradiction with FB-0020.** The rail stays beside the region when wide and below it when stacked, stays quiet at rest and reserves its width on both sides (now 40px: the 8px gap plus the 32px column). FB-0020 says where the rail lives; FB-0042 says how its controls sit in it. The candidate resize bullet in P26 ("a slider in the control rail, 40px target on touch") is unchanged. The single corner handle in `examples/workspace.html` already sits on the region's corner and is consistent.

**Candidate check idea.** Measured alignment is checkable only inside a known pattern (rail top and bottom equal the region's, controls share one x, gap at most 10px). `scripts/test-workspace-alignment.mjs` does this for the reference route only. A generic check cannot know which controls belong to which region, so none is proposed. Version impact: patch if written as a clarification, minor if it travels with the workspace pattern. No approved reference application can fail because of it (no check is implemented).

**Tension to keep visible.** Remove Before Adding and P09: the container adds a surface. It adds no control and removes a detachment, and the wording allows edge aligned controls with no surface at all, so the owner can prefer that. FB-0018 (ghost buttons) stays undecided: the rail buttons are transparent, but they now sit inside a visible surface.

### K2. Persistent contextual return control (FB-0043), candidate, small

Classification (proposed): guidance-gap. P14 covers a back chevron in a navigation sidebar, not a persistent return to a task in another product area. Candidate wording, to be placed by the owner (a clarification near P14 or one bullet in a future navigation principle; not drafted into P23):

> When a person leaves a task for a related area and is expected to return, show one restrained return control for as long as the visit lasts. It names where it goes ("Back to puzzle"), says in one sentence before it is pressed when it cannot restore the earlier state, sits where it covers no content or control (the page reserves room at its end so the last line can scroll above it), and sits below every drawer, scrim, toast and dialog. It is absent in ordinary use.

Open question for the owner: the approved tokens define no layer scale, so the stacking order is currently pinned by a unit test in the application. A layer scale (a small set of named layers: page, sticky, overlay, drawer, dialog, toast) would be a token addition, not a principle; not drafted here. Product specific and stays in CaissaTrainer: the label text, which module can restore what, keep alive parking, the four hour window.

### K3. Temporary context carried by an opaque id (FB-0044), integration note candidate only

Classification (proposed): guidance-gap, low confidence that it belongs in design guidance. The rule is an engineering and security convention: an address may carry an opaque reference to a temporary context, never content, a secret, a credential or personal data; the context is validated, expires, accepts only same origin relative return paths, and a stale or bad one degrades to the ordinary page with one plain sentence; failures that could reveal existence (deleted, foreign, inaccessible) look the same. Natural home: `docs/SUMMA_INTEGRATION.md` or the prompt pack for agents building applications (both owner reviewed), not `PRINCIPLES.md`. The owner may decide it is outside Summa-UI and mark FB-0044 `wont-fix`. The user visible part (one calm sentence, no pretended restoration) is carried by K2.

### K4. Progressive linking between two product areas (merged into FB-0041, no new issue)

Classification: mostly covered or already recorded. Where and when the action appears is P10 and P05; "offer only where the item has a stable identity, fail closed for unknown ones, never strand the person's data" is FB-0041; the way back is K2; the context is K3. The remaining practice (show existing links first and make "create another" explicit, create nothing until confirmed, one request per confirmation and a safe retry) is sound but thin and is not drafted as a rule. The product mechanics (capability table, Puzzles collection default, legacy note import) stay in CaissaTrainer.

### K5. Phase 4 register

| Finding | Issue | Classification | Where it lives in this draft |
| --- | --- | --- | --- |
| Board control rail: detached floating controls, now one column spanning the region with controls on its edges | FB-0042 (refines FB-0020) | Guidance gap; P11 nearest home by spirit, owner may prefer an ambiguity clarification | K1, principles.md P23, preset.workspace, reference code |
| Persistent contextual "Back to ..." control and its stacking order below modal layers | FB-0043 | Guidance gap, small | K2 |
| Temporary study context by opaque id, calm identical fallback | FB-0044 | Guidance gap, low confidence it is design guidance; integration note | K3 |
| Progressive linking between two product areas | FB-0041 (Phase 4 update) | Mostly covered (P10, P05) or recorded elsewhere; thin remainder | K4 |
| Keep alive parking of the training page, board transition (FLIP of a copy), capability map per module, legacy note import, 120 minute reaper | not recorded | Product specific, stays in CaissaTrainer | not applicable |
