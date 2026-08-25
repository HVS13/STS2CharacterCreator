# STS2 Character Creator

A local-first, offline-capable visual character creator for Slay the Spire 2.

## Product goal

Make serious STS2 character creation intuitive enough that a casual player can use it without understanding C#, Godot, BaseLib, mod folders, schemas, or build tooling.

The normal flow should eventually be:

1. Create or open a character.
2. Edit cards, mechanics, relics, art, and other content visually.
3. See immediate previews and validation.
4. Press **Play**.
5. Share the complete project, including local artwork, as one portable file.

No login should be required. Core authoring should work offline.

## Current phase

We are building the v1 desktop editor.

Phase 0 proved the hardest technical assumption. Phase 1 now implements the editor:

> Can a user create, validate, preview, save, share, and play a custom STS2 character without understanding the runtime plumbing?

Read:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product/PRODUCT.md`
- `docs/product/MVP.md`
- `docs/product/UX_PRINCIPLES.md`
- `docs/plans/active/001-build-v1.md`
- `docs/STATUS.md`

## Repository rule

The repository is the durable source of project knowledge. Chat history is not.

Important decisions belong in docs or ADRs. Active work belongs in a plan. Completed work must update `docs/STATUS.md`.
