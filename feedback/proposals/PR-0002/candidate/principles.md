# Candidate principles P23 to P26 (DRAFT, not approved)

Text for `PRINCIPLES.md`, in its voice and format. Numbering follows the existing list; the owner may insert them before the Meta-Principle and Exception Rule instead. Evidence: FB-0014 to FB-0017, extended by FB-0020 to FB-0024 (CaissaTrainer Phase 2) and revised by FB-0036, FB-0037, FB-0040 and FB-0041 and the Phase 3 updates on FB-0021, FB-0023 and FB-0034 (CaissaTrainer Phase 3: hidden panels reserve nothing, edge chevron toggles, no panel X, task ordered stacking). Machine-readable form: `principles.json` next to this file (same shape as `guidance/principles.json`).

## 23. Primary Workspace Stays Primary

When a page is built around one primary region, such as an image, a canvas, a document page, a map or a board, that region is the product. Everything else supports it.

- Keep it centered, never squeezed below a usable minimum, and the last thing to give up room.
- Disclose secondary information progressively, in panels the person can hide.
- Center the region and its open panels as one group. A hidden panel, or one that is a drawer, reserves no width: there is no empty invisible column, and the region uses the room. (FB-0036; this replaces the Phase 2 draft rule "reserve the same width on both sides".)
- Do not flank the region with equally prominent panels. Supporting information is subordinate: the optional panel is a quiet surface, the panel the person works against has no heading and no card, and its content sets the hierarchy. (FB-0036)
- Do not add a zen or fullscreen mode. The largest size that fits, plus hiding the panels, already covers it.
- Put the controls about the region in a rail attached to it (a resize handle and one options menu), not in the page toolbar. Reserve its width on both sides so the region stays centered. (FB-0020)
- A second view of the primary object (a duplicate board, a mini preview) is secondary: closed by default and capped well below the primary region. (FB-0022)
- Optional tools start closed behind one control, the choice is remembered, and nothing essential is hidden behind them. Which optional tools a module offers is a per-module decision with a stated reason, and removing one never strands what the person already wrote. (FB-0021, FB-0041)
- A panel is shown or hidden by a quiet chevron attached to the workspace edge it lives on (a full width disclosure row when stacked), not by a toolbar button labelled with the panel name, and never by an X: a panel that is part of the workspace is not a window. The chevron names what a press does and reports `aria-expanded`; it stays visible and has a 40px touch target at full strength, because touch has no hover. (FB-0037)
- When stacked, order by task: the region first, then its status and answer controls, then the supporting panel, then optional tools behind a disclosure row. (FB-0040)

Panels hold content, never navigation. This is a layout of content panes, not a second sidebar (principle 14).

## 24. Panels Yield Before Content

When space runs out, secondary panels give way in a fixed order: they shrink to their minimum width, then become an on-demand drawer, then, on a narrow screen, stack under the primary region.

- The optional panel yields first: it becomes a drawer before the whole layout restacks, so opening it never shrinks the region below a comfortable minimum (400px, a stated number). The panel the person works against is the last to yield. (FB-0023 update)
- In a portrait window, stack when stacking gives a much bigger region (under 70 percent of the stacked size beside the panels); never stack a landscape window only because stacking would be bigger.
- Never delete a panel to make room, and never leave one hidden without a visible control that brings it back.
- A drawer closes with Escape and returns focus to the control that opened it.
- Keep panels mounted so their state survives being hidden.
- Size the responsive default against the open panels' minimum widths, so panels yield first and then grow into what remains. The default must never be the reason the panel the person works against becomes a drawer. (FB-0023)
- An open drawer is a modal dialog: background inert, focus contained, Escape closes only the drawer, focus returns to the chevron that opened it. Its own control is a back chevron, not an X. (FB-0024, FB-0037)

## 25. Layout Choices Are Preferences

A size, a panel state or a sidebar width that a person chose is a preference, not a measurement.

- Store the choice, never the clamped value. A smaller window changes what is shown and never rewrites what was chosen.
- Offer one control that returns to the defaults.
- Remember panel visibility per screen, and share one size between compatible screens. Keep it on the device unless the choice is about the account.
- Reading storage can fail. Fall back to defaults instead of breaking.

## 26. Do Not Fix the Size of Central Content

Do not give the primary region of a workspace a fixed pixel size. A fixed size is wrong on one of the screens the product meets.

- Choose a responsive default that is dominant but deliberately below the maximum (the Phase 3 reference caps it at 720px and uses 92 percent of what fits), and let the person make it larger or smaller.
- A resize handle is a slider in the control rail: it works with arrow keys, Home and End, and its target is at least 40px on touch.
- Measure the chrome around the region and hold its tallest value, so the region does not jump when a footer appears.

This applies to regions whose useful size is open. Text with a reading measure keeps its maximum line length, and a preview that must show true size keeps its size (principle 22).
