export type Doc = { id: string; title: string; md: string; updated: number }

/** Fixed "now" for the prototype: 27 Oct 2026, 10:30. */
export const NOW = new Date(2026, 9, 27, 10, 30).getTime()
const H = 3600e3, D = 24 * H

const spec = `Offline mode lets people keep working when their connection drops, and reconciles their changes quietly when it returns. This document describes the scope for the first release, the open questions, and the dates we are committing to.

## Problem

Roughly one in six sessions in the field app now starts on a flaky connection: on trains, in basements, at remote sites. Today those sessions fail loudly. Edits are lost, and people re-enter work from memory.

We want to make connectivity a non-event. A person should never have to think about whether they are online in order to write, check off, or read something they already opened.

## Goals

- Every document and task list opened in the last 14 days is readable offline.
- Edits made offline are never lost, and merge automatically in at least 98% of cases.
- Reconnecting takes under three seconds and requires no action from the user.

## Non-goals

- Offline search across the whole workspace.
- Real-time presence while offline. We show who changed what after sync instead.

## Release plan

| Milestone | Owner | Target | Status |
| --------- | ----- | ------ | ------ |
| Local store and write queue | Priya Raman | 6 Nov | In progress |
| Conflict resolution rules | Marcus Hale | 20 Nov | Design review |
| Sync indicator and recovery UX | Elena Voss | 4 Dec | Not started |
| Staged rollout to 5% of accounts | Tomás Ibarra | 15 Jan | Not started |

## Conflict handling

When two people edit the same paragraph, we keep both versions and ask the *last* editor to choose. For everything else we apply **field-level last-write-wins**, using a hybrid logical clock so that skewed device clocks cannot reorder changes.

> The best conflict is the one nobody notices. Ask only when two humans genuinely disagree.

The write queue is persisted before the network call, so a crash mid-sync is safe:

\`\`\`
queue.push(op)        // durable first
await flush(queue)    // then network
queue.ack(op.id)      // then forget
\`\`\`

## Open questions

1. How long do we retain unsynced changes on a device that never reconnects?
2. Do we show a banner when sync takes longer than ten seconds, or stay silent?
3. Can admins disable offline mode for regulated workspaces?

---

Last reviewed with design and platform on 22 October. Questions go to [the product channel](https://example.com/product).`

const meeting = `## Attendees

Priya Raman, Marcus Hale, Elena Voss, Tomás Ibarra, Amara Okafor

## Summary

We reviewed the beta feedback on the sync indicator and agreed that the current spinner reads as "something is wrong". The team prefers a quiet state that only appears when changes are waiting. Marcus raised a concern about storage quotas on older Android devices, which we will measure before committing to the 14-day window.

## Decisions

- Ship the indicator as a single dot in the toolbar, with detail on hover.
- Keep the 14-day offline window as the default until we have quota data.
- Hold the staged rollout until the conflict rules pass review.

## Action items

- [x] Share the beta feedback summary with the wider team
- [x] Book design review for conflict rules
- [ ] Measure IndexedDB quota on the five oldest supported Android devices
- [ ] Draft copy for the "changes waiting" state
- [ ] Confirm legal position on retaining unsynced data
- [ ] Update the rollout plan with the new dates

## Next meeting

Thursday 29 October, 10:00. We will bring the quota numbers and the first pass at the recovery screens.`

const essay = `Somewhere in the last decade we decided that fast meant good. Pages load in a blink, messages arrive before we finish typing them, and every interface promises to save us time. And yet the people I know who make things for a living are quietly asking for the opposite.

## Speed is not the same as ease

A tool that responds instantly but demands constant decisions is exhausting. A tool that takes a moment to think, and then does the right thing, feels restful. We confuse the *latency* of a system with its *tempo*.

Think of a good notebook. It has no loading state, but it does have a pace: the pen moves at the speed of thought, and no faster. Nothing interrupts you, nothing suggests a better way to phrase the sentence, nothing asks whether you would like to upgrade.

## What a calmer tool does

- It waits until you ask.
- It shows only what you need for the thing in front of you.
- It remembers your work without announcing that it has.

None of these is difficult to build. They are difficult to *choose*, because every one of them means removing something that someone, somewhere, thought was a feature.

## A small test

Open the software you use most, and try to describe what it is for in a single sentence. Then count the things on the screen that do not serve that sentence. The number is usually larger than we would like, and the gap is where the noise lives.

I do not think the answer is nostalgia. The answer is **restraint**: building the smaller thing deliberately, and being comfortable with the empty space it leaves.`

const ideas = `## Parked for later

- Keyboard-first command palette for the document list
- Version history with a quiet timeline instead of a diff view
- Shared reading mode with no editing chrome at all

## Snippets

Use \`Cmd+K\` to link, and type \`/\` on an empty line to insert a block.`

export const SEED: Doc[] = [
  { id: 'd1', title: 'Offline mode: product spec', md: spec, updated: NOW - 2 * H },
  { id: 'd2', title: 'Product sync, 22 October', md: meeting, updated: NOW - 5 * D - 3 * H },
  { id: 'd3', title: 'Notes on slow software', md: essay, updated: NOW - 12 * D },
  { id: 'd4', title: 'Parked ideas', md: ideas, updated: NOW - 31 * D },
]

export function relTime(t: number, now: number): string {
  const d = now - t
  if (d < 60e3) return 'Just now'
  if (d < H) return `${Math.floor(d / 60e3)}m ago`
  if (d < D) return `${Math.floor(d / H)}h ago`
  if (d < 2 * D) return 'Yesterday'
  if (d < 7 * D) return `${Math.floor(d / D)} days ago`
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
