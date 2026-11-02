# Application shells

Status: draft contribution, not approved guidance. It documents the application level consistency pattern found in the CaissaTrainer layout pass (`FB-0047` to `FB-0051`). Nothing in `guidance/` or `PRINCIPLES.md` changed. The candidate principles (P27 to P31) travel in `feedback/proposals/PR-0003` and only the owner can approve them into a later release.

## The problem

An application can reuse every button, card, colour and spacing token and still feel like many websites: the content starts 100px further left on one page, the title sits lower on the next, one page uses a round back arrow and another a text link, a card is a bordered box here and bare text there, a tool page arrives with an article's margins. Tokens fix paint. Continuity is about structure.

## What stays continuous

| Question | Rule |
| --- | --- |
| Where is the navigation | The persistent navigation keeps its position and the order and position of its items. Only its width may change (expanded or compact rail), and only between a content page and a primary-object workspace. |
| Where does content start | One horizontal origin, one top offset and one maximum width for every page of a family. |
| Where is the title | Same corner, type and spacing. Page actions sit on the title line, at its end. |
| Where does context go | A quiet breadcrumb trail above the title. One component, reused. Never a bespoke back button, never a second sidebar. |
| Where does supporting content go | One optional column beside the body. It drops under the body when the window is narrow. Nothing is reserved when it is empty. |
| How do repeated things look | One surface level per role (see below), one section rhythm, whitespace instead of rules. |

## The small family of shells

1. **Content page**: catalogues, hubs, lists, settings, accounts. Header, then body (and optional aside).
2. **Reading page**: articles, books, wikis, courses. Same origin and header as a content page, a narrower measure for the body.
3. **Dense tool**: the content dominates and has no article margins (an editor, a data tool).
4. **Primary-object workspace**: one dominant interactive object (a chessboard, a canvas, a map). Nothing permanent above or below it, controls on hover beside it, information against its edges, a side panel that runs state, data and one primary action (see P31). It may take the compact navigation rail to give the object width.

A new page picks one. If it seems to need a fifth, the page is probably two pages.

A page that is two states in one address (a lobby that becomes a game) states the shell it is in and the frame follows; the lobby does not inherit the workspace's missing margins.

## Surface roles

| Role | Dark theme step |
| --- | --- |
| Application background | `--s0` |
| Primary content surface | `--s1` |
| Interactive card | `--s2`, hover `--s3`, pressed `--s4` |
| Selected or active | `--select` |
| Elevated popover or menu | `--s4`, opaque |

Do not alternate between no surface, a darker surface, a bordered panel and a rule for the same job.

## Reference

The CaissaTrainer implementation: `AppPage` (header, trail, body, aside), `PageHeaderComponent` (trail), `LinkCardComponent` (selectable card), `useLayoutModeOverride` (a page states its shell), the shell CSS in `DefaultLayout.vue` and `docs/ui/components/page-shells.md` in that repository, measured by `e2e/applicationShell.mjs` (same title x on ten pages, evaluation bar flush to the board, nothing above or below the board).
