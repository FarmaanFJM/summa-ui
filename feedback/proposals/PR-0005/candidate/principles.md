# Candidate TOP rules P32 to P37 (DRAFT, not approved)

Full text: `docs/TOP.md`. Machine form: `principles.json` here. Evidence: FB-0058. Nothing in `guidance/` or `PRINCIPLES.md` changed.

## P32 Show Only What Is Needed Now

The TOP umbrella rule: show only the information the user needs at the moment they need it. Refines P05 and P10 with concrete placement rules.

- Default to the action, never the explanation: the label is 'Sync with Remote', with no paragraph under it.
- Decide where content lives: permanently visible, hover or focus only, behind an action, or in a confirmation dialog.
- Remove before adding: rename the control before adding explanatory text.

Exceptions:

- A first run or empty state where the user genuinely cannot proceed without an instruction.

## P33 Deliberate Tooltips

Tooltips are a quiet aid for one control, never a place to store essential information.

- Open only on deliberate hover (small delay) or keyboard focus; close on Escape, blur and leave; never persistent; never the only route to information on touch.
- One short sentence. Never repeat the control label. Technical detail goes to a details view.
- Prefer an obvious label or icon. Not every component needs a tooltip; no rows of info icons.
- Never hide a destructive consequence only in a tooltip.

## P34 Three Information Levels

Classify content by when it is needed.

- Level 1, always visible: name, essential status, primary action, a critical problem.
- Level 2, on demand: secondary actions, branch information, logs, paths, environment, technical details.
- Level 3, only when relevant: diagnostics, long explanations, error traces, advanced configuration, confirmations of dangerous operations.

## P35 Short Status Text

Status and labels use the fewest words that stay clear.

- Prefer 'Synced', 'Running', 'Backend failed', '3 changed files', 'Stopped' to full sentences.
- A status mark is always paired with a word; never colour alone.
- Never truncate identifiers or paths misleadingly; provide inspect and copy of the full value.
- Important errors stay reachable through Logs or Details.

## P36 Consequences Belong In The Confirmation

Explain what will happen when the operation is initiated, in the confirmation dialog.

- The dialog names the exact target (path, branch, name) in monospace and lists consequences in short lines.
- The confirm button is a specific verb (P19).
- Do not warn in advance with permanent banners or only in a tooltip.

## P37 Minimal Does Not Mean Inaccessible

A reduced interface keeps full keyboard and assistive technology support.

- Every control stays keyboard operable; row menus open with the Menu key or Shift+F10 as well as right click.
- Hover-only information also appears on focus; focus stays visible (P17).
- Icon-only controls keep accessible names; secrets keep Reveal and Copy.
