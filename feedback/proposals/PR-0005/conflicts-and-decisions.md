# PR-0005: conflicts with approved rules and draft DECISIONS notes (DRAFT)

Agents cannot edit `docs/DECISIONS.md` (owner protected), so `proposal.json` keeps `conflictsWithApprovedRules` empty. The wording below is a draft, not a decision.

| Approved rule | Candidate | Conflict? |
| --- | --- | --- |
| P05 Information Earns Its Place | P32 to P35 | No, but overlap. P05 states the intent ("progressive disclosure, contextual help"); TOP adds placement, tooltip behaviour, levels and text reduction. The owner may prefer folding P32 into P05 as a revision instead of a new number. |
| P10 Minimalism Over Prevalence | P32, P34 | Tension. P10 hides controls that are not relevant. TOP also hides explanations. Both can fail the same way: a hidden action cannot be found. TOP resolves it by keeping Level 1 (primary action, critical problem) always visible and every Level 2 item reachable by a visible control (the overflow menu, Details). |
| P17 Subtle Focus and Selection | P33, P37 | No. Tooltips open on keyboard focus, so P17's visible focus ring is what the user sees first. Tooltips use the neutral surface and a 1px outline, not an accent. |
| P19 No Washed-Out Destructive Buttons | P36 | No. P36 requires the verb label that P19 already requires. |
| P13 No Em Dashes | all copy | No. Candidate copy and components contain none. |
| P14 No Sidebar Stacking | DetailPanel | No. DetailPanel replaces the main region content and is explicitly not a sidebar. |
| P01 No Borders Within Borders | LogViewer, TerminalFrame | No. They are filled `--s2` surfaces on an `--s1` panel (P02 elevation), borderless. |
| P22 Exception Rule | AP candidate for hover only | A first-run instruction is allowed to stay visible when the user cannot proceed without it (listed as an exception of P32). |

Open for the owner:

- Whether TOP is a new principle (this draft, P32 to P37) or a revision of P05 and P10.
- Whether tooltip delay (500ms hover, 150ms focus) and the one sentence limit should be numeric rules or guidance only.
- Whether AP-010 and AP-016 should reference the new rules.
- No new automated check is proposed: the rules are judgement based, so the regression baseline cannot change.
