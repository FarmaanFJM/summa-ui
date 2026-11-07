# TOP: show only the information the user needs at the moment they need it

TOP is a working discipline layered on `PRINCIPLES.md`, mainly P05 (Information Earns Its Place), P10 (Minimalism Over Prevalence), P17 (Subtle Focus) and P21 (Remove Before Adding). It is a draft convention (candidate rules in `feedback/proposals/PR-0005/`), not an approved principle. Like every principle it is a default: break it only for a concrete usability reason, and state that reason.

Reusable pieces live in `src/ui/top.tsx` with styles in `src/styles/top.css`. See the lab page `#/guidance/density` for Avoid / Prefer pairs.

## 1. Progressive disclosure

Show the action, not the explanation. The label is `Sync with Remote`, never a paragraph under it.

- A short explanation appears on deliberate hover or keyboard focus, or inside a contextual details surface.
- Consequences are explained in the confirmation dialog, at the moment the operation is initiated, not beforehand and not only in a tooltip.
- Remove before adding: if a screen needs a paragraph to be understood, rename the control first.

## 2. Tooltips

- Open only on deliberate mouse hover (after a short delay, about 500ms) or keyboard focus. Close on Escape, blur, leave, press and scroll. Never persistent. Never the only route to information on touch.
- One short sentence. Never repeat the button label. Technical detail goes to a details view.
- Prefer an obvious label or icon to a tooltip. Not every component needs one, and a row of info icons is a failure.
- A tooltip describes (`aria-describedby`); it does not replace an accessible name.
- Never hide a destructive consequence only in a tooltip.

Component: `Tooltip`.

## 3. Information hierarchy

| Level | When | Examples |
| --- | --- | --- |
| 1 | Always visible | Name, essential status, primary action, a critical problem |
| 2 | On demand (menu, hover, expand) | Secondary actions, branch info, logs, paths, environment, technical details |
| 3 | Only when relevant | Diagnostics, long explanations, error traces, advanced configuration, confirmations of dangerous operations |

## 4. Text reduction

| Instead of | Write |
| --- | --- |
| Repository synchronization completed successfully | Synced |
| The process is currently running | Running |
| Click here to open the terminal | Terminal |
| An error occurred while attempting to start the backend | Backend failed |
| This repository contains uncommitted changes | 3 changed files |
| No active process was found for this service | Stopped |
| Environment variables for this process | Environment |

Rules: never truncate identifiers or paths in a way that misleads (shorten in the middle only with the full value inspectable, and always offer copy). Important errors stay reachable through Logs or Details, one action away. Secrets are hidden by default but never permanently masked: provide Reveal and Copy.

## 5. Visual rules

Preserve the Summa identity: charcoal surfaces, emerald only for meaningful action, selection or state, neutral type, restrained beige where a warm surface is already approved.

- No gradients or glow, no unnecessary animation, no blurred or faded menus.
- No duplicated navigation and no nested sidebars (P14). A detail view replaces the content or fills the main region.
- No persistent instructional banners. A banner states a problem or a state, not how to use the page.
- No excessive card nesting (P01). No oversized headings for minor content.

## 6. Where does this content live?

| Question | Place |
| --- | --- |
| Does the user need it to recognise the object or act on it now? | Permanently visible |
| Does it clarify one control and fit in one sentence? | Hover or focus only (tooltip) |
| Is it secondary, technical or occasional? | Behind an action: menu, `Details`, a detail panel |
| Does it describe what will be lost or changed? | In the confirmation dialog (`target`, `consequences`) |
| Is it a failure? | One word of status, with Logs or Details for the cause |

## 7. Density examples

Incorrect: a repository card with a permanent sentence about uncommitted changes, a hint about the terminal and six buttons.
Correct: `example-service` | `3 changed files` | `Sync` | `...` menu (Terminal, Copy path, Remove).

Incorrect: a settings switch with a paragraph under every name.
Correct: plain names; a tooltip on the single setting whose effect is surprising.

Incorrect: a delete button whose only warning is a tooltip.
Correct: `Delete local repository?`, the exact path in monospace, two short consequence lines, and a verb button `Delete repository`.

## 8. Accessibility stays when the UI is minimal

- Everything is reachable and operable by keyboard. Rows open their menu with the Menu key or Shift+F10 as well as right click.
- Focus is visible (P17). Hover-only information must also appear on focus.
- Minimal UI keeps accessible names: an icon button has an `aria-label`; a status mark always has a word, never colour alone.
- Touch has no hover: whatever a tooltip says must be reachable another way, or not essential.

## Component map

| Need | Component |
| --- | --- |
| Short hint | `Tooltip` |
| Name, status, action, menu | `ActionRow` (menu via `MenuButton`, `useContextMenu`) |
| State mark plus word | `StatusIndicator` |
| Technical detail | `Details`, `DetailPanel` |
| One line problem | `InlineAlert` |
| Secrets | `SecretValue`, `useRevealAll`, `SecretToggleAll` |
| Output | `LogViewer`, `TerminalFrame` (container only) |
| Progress | `OperationProgress` |
| Clipboard | `useCopy`, `CopyButton` |
| Confirmation | `ConfirmDialog` with optional `target` and `consequences` |
