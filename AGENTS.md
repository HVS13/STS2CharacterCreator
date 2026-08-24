# AGENTS.md

## Purpose

This repository is for a local-first, offline-capable visual Slay the Spire 2 character creator.

The product should be powerful enough for serious character creation while remaining intuitive for casual users.

## Read first

Before changing code or architecture, read the files relevant to the task.

Always read:

- `README.md`
- `docs/STATUS.md`

For product or UX work, also read:

- `docs/product/PRODUCT.md`
- `docs/product/UX_PRINCIPLES.md`
- `docs/product/MVP.md`

For architecture or runtime work, also read:

- `ARCHITECTURE.md`
- the active plan under `docs/plans/active/`

For third-party reuse, also read:

- `docs/research/THIRD_PARTY.md`

## Core product constraints

These are not suggestions.

1. No login is required for core use.
2. Core authoring must work offline.
3. Projects must be user-owned local files.
4. Local artwork must be supported.
5. A project must eventually be shareable as one portable file including its assets.
6. Casual users should not need to understand C#, Godot, BaseLib, schemas, IDs, or build tools.
7. Common actions must be discoverable without reading documentation.
8. Advanced capability may exist, but technical complexity should be progressively disclosed.
9. The normal user action is eventually **Play**, not “Compile DLL” or “Build PCK”.
10. The canonical project format must not be coupled to any one third-party runtime or editor.

## Current phase constraints

Until Phase 0 is completed:

- Do not build the desktop UI.
- Do not initialize Tauri, React, Vite, or other app frameworks unless the active plan explicitly changes.
- Do not design the final schema prematurely.
- Do not add cloud services, accounts, telemetry, databases, or AI APIs.
- Do not redesign third-party projects before proving they work unchanged.
- Prefer experiments that answer one architectural question at a time.

## Execution rules

- Inspect before editing.
- Prefer the smallest coherent change that proves the current hypothesis.
- Do not silently expand scope.
- Do not silently change architecture.
- Do not install dependencies silently. Report what is missing first.
- Do not modify STS2 save files.
- Do not overwrite unrelated installed mods.
- Do not publish anything.
- Preserve third-party license notices.
- Do not copy source from projects without a license that permits reuse.
- Treat browser-delivered/minified source as copyrighted unless an explicit license permits reuse.
- Verify volatile technical facts against current official or upstream sources when they materially affect implementation.

## Testing and proof

Code inspection is not proof when a runnable verification is possible.

For implementation tasks:

1. State the acceptance criteria.
2. Run the relevant build/test/verification.
3. Record the command.
4. Record the result.
5. Record any generated artifact.
6. Do not call a task complete while known relevant failures remain unexplained.

## Debugging

When something fails:

1. Reproduce the failure.
2. Capture the exact error.
3. Identify the likely root cause.
4. Test the smallest fix.
5. Avoid broad refactors merely to bypass an environment problem.
6. Record failed approaches if they could be repeated later.

## Architecture decisions

Material architecture changes require an ADR under `docs/decisions/`.

Examples:

- changing the canonical project storage model
- abandoning the data-driven runtime approach
- adding a mandatory framework dependency
- introducing cloud state
- changing portability or offline guarantees

Do not hide architecture changes inside implementation commits.

## Third-party reuse

Before copying source:

1. Confirm the exact upstream repository.
2. Confirm the license at the commit being used.
3. Record the repository, commit, license, copied paths, and modifications in `docs/research/THIRD_PARTY.md`.
4. Preserve required notices.

Prefer dependencies or adapters over vendoring when practical.

## Documentation discipline

Do not make `AGENTS.md` an encyclopedia.

Put durable information in the appropriate file:

- product behavior: `docs/product/`
- architecture: `ARCHITECTURE.md` or ADRs
- active execution: `docs/plans/active/`
- research: `docs/research/`
- current reality: `docs/STATUS.md`

At the end of meaningful work, update `docs/STATUS.md` if repository reality changed.

## Handoff format

For bounded tasks, finish with:

- Outcome
- Changed files
- Commands/tests run
- Failures encountered
- Remaining risks
- Recommended next step

Keep the handoff factual and concise.
