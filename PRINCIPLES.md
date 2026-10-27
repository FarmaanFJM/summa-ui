# Summa-UI Primitive Principles

Summa-UI exists to eliminate AI-generated UI slop through a small set of durable, reusable design principles.

These principles are not arbitrary style preferences. They are derived from repeated design, implementation, and playtesting experience.

They are defaults, not immutable laws. A rule may be broken when there is a concrete usability reason, but not merely for decoration.

## 1. No Borders Within Borders

Avoid placing bordered elements inside other bordered elements. Nested borders create visual noise and make every component compete for attention.

Prefer hierarchy through:

- background elevation
- spacing
- typography
- subtle section dividers

A border should communicate a meaningful boundary, not simply prove that an element exists.

## 2. Dark Themes Move From Dark to Light

In dark themes, visual elevation should generally progress dark → lighter. The page background is the darkest layer. Surfaces placed above it become progressively lighter.

Do not create arbitrary inversions where nested or elevated surfaces unexpectedly become darker than their parent. Elevation should be visually understandable without requiring borders around every surface.

## 3. No Arbitrary Left-Border Decoration

Do not use a thicker left border as a generic way to indicate cards, alerts, active elements, information panels, categories, or emphasis. This pattern is heavily overused in generated interfaces.

A left border may be used when the product or user explicitly requires it, or when it has an established semantic meaning within that interface. It must never be the default solution for "make this element stand out."

## 4. Tags Must Be Functional, Not Decorative

Do not generate decorative pill-shaped tags simply because information can be represented as a label.

The default tag is extremely simple:

- one background color
- no border
- optional icon
- short text

Tags should only exist when users benefit from recognizing, filtering, grouping, or interacting with a category or state.

Never create arbitrary status tags such as "Automatically saved" when the same information either does not need to be shown or can be communicated more naturally elsewhere. Do not scatter tags around the interface merely to create visual variety.

## 5. Information Must Earn Its Place

Show the minimum information necessary for the user to understand the current interface and perform the current task.

Do not explain familiar concepts merely because space is available. Do not attempt to eliminate every possible learning curve through permanent explanatory text. A small learning curve is preferable to an interface permanently obstructed by information overload.

Depend on:

- familiar interaction patterns
- clear naming
- predictable positioning
- progressive disclosure
- contextual help when actually needed

instead of permanent explanation.

## 6. Use as Few Colors as Possible

Color is a limited communication resource. Do not assign colors merely to make components look different.

The interface should primarily rely on neutral surfaces, typography, spacing, shape, and hierarchy. Accent colors should communicate meaning, interaction, identity, or state. If removing a color does not reduce comprehension, remove it.

## 7. One Visual Language

Summa products should feel like members of the same product family. Components should share:

- spacing logic
- typography
- surfaces
- interaction states
- iconography
- corner treatment
- controls
- menus
- navigation patterns
- motion behavior

The theme should be: matte, restrained, slightly glassy, reusable, and consistent. Individual applications may have their own content and workflows without inventing a new design language.

## 8. Familiarity Is a Feature

Prefer established interaction conventions when they already solve the problem well. Users should not have to relearn dropdowns, menus, tabs, navigation, search, dialogs, selection, keyboard behavior, or common editor interactions.

Study successful competing products. Familiarity reduces cognitive load. Innovation should primarily improve the workflow, not reinvent controls users already understand.

## 9. Simplicity Beats Cleverness

When two designs solve the same problem adequately, prefer the simpler one.

Do not introduce additional controls, containers, states, visual treatments, or terminology unless they provide meaningful user value. Complexity requires justification. Simplicity does not.

## 10. Minimalism Over Prevalence

Do not show every possible action simultaneously. Prefer contextual and dynamic controls.

**Creating labels.** Instead of `[Label dropdown] [Create label button]`, place *Create label* inside the label dropdown. The action becomes available exactly where it becomes relevant.

**AI prompt controls.** Before generation show `[Send]`; during generation show `[Stop]`. Do not show `[Send] [Stop]` when both cannot meaningfully be used at the same time.

Controls may transform when their function changes. However, avoid dangerous instantaneous transformations. If a button changes into its logical opposite, such as Send → Stop, account for accidental double-clicks or repeated input and introduce an appropriate interaction guard instead of exposing both controls permanently.

The objective is fewer visible controls without sacrificing interaction safety.

## 11. The Rectangle Rule

Summa-UI organizes information through clean rectangular regions. Avoid visual indentation as a primary hierarchy mechanism. Indentation breaks the rectangular flow of the interface and gradually produces increasingly irregular content edges.

Instead, maintain aligned rectangular content regions. When content has a heading and subordinate information, communicate hierarchy through typography, text color, weight, size, and spacing.

For example: a muted heading, with normal body content beginning at the same horizontal alignment. Do not automatically indent the body beneath the heading.

## 12. Dividers Are Secondary Structure

When separate content regions require additional distinction, use subtle horizontal dividers. Dividers should support an existing hierarchy rather than create one by themselves.

Prefer spacing first. Use a divider when spacing alone would make two regions ambiguous. Avoid excessive divider lines.

## 13. No Em Dashes

Do not use em dashes in user-facing interface copy. Use natural punctuation instead: commas, colons, periods, parentheses or a rewritten sentence.

This applies to headings, descriptions, labels, notifications, empty states, demo content and any other UI text. For an empty table cell, leave it empty rather than filling it with a dash.

## 14. No Sidebar Stacking

Never respond to sidebar navigation by adding another full navigation sidebar beside the existing one.

When users navigate to a secondary context, prefer one of these approaches:

1. Replace the sidebar content and provide a clear back-chevron control.
2. Reorganize the existing sidebar into distinct regions, including an upper and lower region when appropriate.
3. Use the primary content region for details rather than creating additional navigation columns.

Distinguish navigation sidebars from legitimate content panes. Editors, inspectors, order books and detail panels are not automatically forbidden. The rule targets redundant navigation structures.

## 15. Monochromatic Selection and Focus

Use monochromatic, neutral visual treatments for ordinary selection, hover, focus and active navigation states.

Do not automatically use the emerald accent for focus rings, selected cards, selected navigation entries or text input outlines. Prefer subtle neutral surface changes, grayscale borders or appropriate neutral outlines.

Maintain accessible focus visibility. Preserve semantic colors where they convey meaningful information, such as trading movements or destructive actions.

Use the emerald brand accent sparingly and deliberately: brand identity, the primary action of a view, and meaningful state.

## 16. Layout Diversity

The design system must not impose a universal left-sidebar/right-content structure.

Choose layouts according to the tasks, user expectations and information architecture of each application. Summa-UI must support dashboards, public websites, feeds, dense data workspaces, image-heavy catalogs, form-based experiences and other substantially different structures.

A consistent design language does not require an identical application layout. Variety must come from the task, never from novelty: familiarity and usability remain essential.

## Meta-Principle: Remove Before Adding

When an interface feels unclear, do not immediately add another component. First ask whether something can be:

- removed
- merged
- relocated
- hidden contextually
- represented through hierarchy
- revealed only when needed

A cleaner interface is usually achieved through subtraction rather than decoration.

## Exception Rule

These principles are defaults rather than absolute prohibitions. A principle may be violated when:

1. there is a concrete usability requirement;
2. the alternative produces a worse interaction;
3. the exception is deliberate rather than accidental;
4. the reason can be explained.

"Because it looks nicer" is generally not sufficient justification.

The purpose of Summa-UI is not to enforce minimalism blindly. The purpose is to prevent accidental complexity.
