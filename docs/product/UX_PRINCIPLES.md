# UX Principles

## Goal

The creator should feel intuitive, not merely “easy for beginners.”

A capable user should move quickly. A new user should understand the normal path through layout, naming, defaults, and immediate feedback.

## 1. Progressive disclosure

Do not show every engine option at once.

Start with the fields that define the object.

Example card:

- Name
- Cost
- Type
- Rarity
- Effects
- Artwork
- Upgrade

Reveal uncommon engine-specific settings only when relevant.

## 2. Use game language

Prefer:

- “When this card is played”
- “Selected enemy”
- “Gain Block”
- “Once per combat”

Avoid exposing internal class names or API terminology in the normal interface.

Technical terminology may appear in developer details or tooltips.

## 3. Make logic readable

Effects and conditions should read like understandable instructions.

Example:

```text
If the target has Poison:
    Deal 12 damage
Otherwise:
    Deal 7 damage
```

Do not require users to manipulate raw AST/schema structures directly.

## 4. Immediate feedback

Editing should update the relevant preview immediately where practical.

Examples:

- card preview
- relic preview
- character appearance
- generated description
- validation state

## 5. Prevent invalid states

Prefer prevention over late build errors.

Examples:

- filter incompatible options
- keep references stable across rename
- warn before deleting referenced entities
- offer a repair action
- validate required starting-deck structure early

## 6. Errors should suggest the next action

Bad:

```text
Invalid CardModel reference
```

Better:

```text
Flame Strike uses "Burning", but Burning no longer exists.

[Open Flame Strike]
[Choose another status]
```

## 7. Stable references

Names are presentation, not identity.

Entities should eventually use stable IDs so rename operations do not break the project.

## 8. Common operations must be fast

Expected later:

- duplicate
- undo/redo
- multi-select
- batch edit
- search
- command palette
- drag reorder
- copy/paste effects
- side-by-side upgrades

## 9. Hide build plumbing

The normal action should eventually be:

**Play**

The application handles validation, runtime deployment, game launching, and related setup.

Advanced build details should be available without dominating the normal workflow.

## 10. Sharing should be obvious

A friend should be able to receive one project file, open it, see its included artwork, and play it after any required runtime setup.

## 11. Documentation is support, not navigation

A user should not need to read a manual to discover ordinary actions.

Contextual explanations are useful. A mandatory tutorial is not a substitute for clear design.

## 12. Feature count is not the quality metric

Do not chase full parity with another tool before the core workflow feels excellent.
