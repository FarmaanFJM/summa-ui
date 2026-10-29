# Candidate principles P23 to P26 (DRAFT, not approved)

Text for `PRINCIPLES.md`, in its voice and format. Numbering follows the existing list; the owner may insert them before the Meta-Principle and Exception Rule instead. Evidence: FB-0014 to FB-0017, extended by FB-0020 to FB-0024 (CaissaTrainer Phase 2). Machine-readable form: `principles.json` next to this file (same shape as `guidance/principles.json`).

## 23. Primary Workspace Stays Primary

When a page is built around one primary region, such as an image, a canvas, a document page, a map or a board, that region is the product. Everything else supports it.

- Keep it centered, never squeezed below a usable minimum, and the last thing to give up room.
- Disclose secondary information progressively, in panels the person can hide.
- Reserve the same width on both sides, so a lone panel does not push the region off center.
- Do not add a zen or fullscreen mode. The largest size that fits, plus hiding the panels, already covers it.
- Put the controls about the region in a rail attached to it (a resize handle and one options menu), not in the page toolbar. Reserve its width on both sides so the region stays centered. (FB-0020)
- A second view of the primary object (a duplicate board, a mini preview) is secondary: closed by default and capped well below the primary region. (FB-0022)
- Optional tools start closed behind one labelled control, the choice is remembered, and nothing essential is hidden behind them. (FB-0021)

Panels hold content, never navigation. This is a layout of content panes, not a second sidebar (principle 14).

## 24. Panels Yield Before Content

When space runs out, secondary panels give way in a fixed order: they shrink to their minimum width, then become an on-demand drawer, then, on a narrow screen, stack under the primary region.

- Never delete a panel to make room, and never leave one hidden without a visible control that brings it back.
- A drawer closes with Escape and returns focus to the control that opened it.
- Keep panels mounted so their state survives being hidden.
- Size the responsive default against the panels' minimum widths, so panels yield first and then grow into what remains. The default must never be the reason a panel becomes a drawer. (FB-0023)
- An open drawer is a modal dialog: background inert, focus contained, Escape closes only the drawer, focus returns to its toggle. (FB-0024)

## 25. Layout Choices Are Preferences

A size, a panel state or a sidebar width that a person chose is a preference, not a measurement.

- Store the choice, never the clamped value. A smaller window changes what is shown and never rewrites what was chosen.
- Offer one control that returns to the defaults.
- Remember panel visibility per screen, and share one size between compatible screens. Keep it on the device unless the choice is about the account.
- Reading storage can fail. Fall back to defaults instead of breaking.

## 26. Do Not Fix the Size of Central Content

Do not give the primary region of a workspace a fixed pixel size. A fixed size is wrong on one of the screens the product meets.

- Choose a responsive default that is deliberately medium, not the maximum, and let the person make it larger or smaller.
- A resize handle is a slider in the control rail: it works with arrow keys, Home and End, and its target is at least 40px on touch.
- Measure the chrome around the region and hold its tallest value, so the region does not jump when a footer appears.

This applies to regions whose useful size is open. Text with a reading measure keeps its maximum line length, and a preview that must show true size keeps its size (principle 22).
