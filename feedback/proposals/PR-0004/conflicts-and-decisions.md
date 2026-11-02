# PR-0004: conflicts with approved rules and draft DECISIONS notes (DRAFT)

Agents cannot edit `docs/DECISIONS.md` (owner protected), so `proposal.json` keeps `conflictsWithApprovedRules` empty. The owner copies the entries below into `docs/DECISIONS.md` if they approve the direction. The wording is a draft, not a decision.

| Approved rule | Candidate | Conflict? |
| --- | --- | --- |
| P06 Use as Few Colors as Possible | W03 adds a warm palette | Yes, in a strict reading. P06 allows colour that communicates meaning, interaction, identity or state; the warm palette carries a stated meaning (editorial, educational, historical, featured) and is restricted to inserts. The owner must decide whether that satisfies P06 or whether P06 needs a sentence. Draft entry D-016. |
| P07 One Visual Language ("matte, restrained, slightly glassy") | W04 editorial serif, W01 asymmetry | Tension. A Web product keeps the shared foundations (surfaces, focus, selection, controls) and adds an editorial voice. The owner decides whether Web is a profile of the same language (this draft) or a separate one. Draft entry D-017. |
| P16 Layout Diversity | W01 | No. W01 is one more layout method, scoped to content pages. |
| P11 The Rectangle Rule | W01 | No. Asymmetry is built from rectangles on a grid; nothing is indented. |
| P03 No Arbitrary Left Border | W07 | No. W07 states the selection case. |
| P15, P17 Selection and Focus | W06 | No. Adds the warm surface ring. |
| P04 Tags | W02 (no pills) | No. Functional tags stay as P04 defines them. |
| Candidate P27 to P31 (PR-0003, draft) | W01, W06 | Not approved rules. W01 restates the continuity requirement it needs so it does not depend on PR-0003 being approved. |
| Ghost buttons (FB-0018) | W05 tertiary action | Open question stays open. Tertiary is a link like text action with an arrow on a content surface, and the owner may read it as a ghost button. |
