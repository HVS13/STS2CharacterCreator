# Project Status

Last updated: 2026-08-24

## Current state

Planning and research only.

Phase 0, Stage 0A, environment audit, is complete. The factual report is in
docs/research/ENVIRONMENT.md.

Phase 0, Stage 0B, BLANK runtime proof preparation and source audit, is complete.
The pinned upstream checkout and audit are recorded in
docs/research/BLANK_RUNTIME.md and docs/research/THIRD_PARTY.md.

The runtime build proof has not been attempted. Stage 0C has not started.

No production application code has been started. No application framework has been initialized.

## Confirmed product requirements

- local-first
- offline-capable core authoring
- no mandatory login
- local artwork
- portable project sharing
- intuitive normal workflow
- advanced capability without exposing technical plumbing
- import and export as first-class capabilities
- eventual standalone mod or source export

## Current architecture hypothesis

Use a canonical project model with:

1. a fast data-driven runtime path for normal editing and testing
2. an optional generated standalone mod path for advanced export

This is not yet accepted architecture. Phase 0 exists to prove or reject it.

## Stage 0B findings

The BLANK source audit at commit
d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80 shows a fixed-shell runtime:

- four character slots
- 40 card slots per character, 160 compiled card shells in total
- three custom orb shells per character
- four custom status shells per character
- two summon shells per character
- one relic shell per character
- user-local JSON under user://forged/characters
- generated C# host types registered before the game model database is frozen
- runtime effects interpreted from validated data, with a bounded vocabulary

The approach is technically relevant to the project, but it is a constrained runtime contract, not a canonical project schema. It also depends on STS2, BaseLib, Harmony, Godot .NET, and the .NET 9 SDK.

## Git and upstream baseline

- baseline commit: ed350f410efcbd1892d8aad5b4b793d42b7836
- baseline message: chore: establish project baseline
- BLANK checkout: research/upstream/BLANKthespire
- BLANK commit: d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
- BLANK branch: main
- no Git remote is configured for this project
- the BLANK checkout is ignored and remains clean

## Stage 0A result

The local Windows, Git, .NET, Steam, STS2, mods, BaseLib, and version environment
was audited without installing dependencies or modifying game content. No .NET
SDK was detected, and BaseLib was not detected in the installed STS2 tree.

## Immediate work

Next planned action, not started in this task:

obtain or install the missing prerequisites only after explicit authorization, then
attempt the documented BLANK build unchanged and record the exact result.

## Known decisions

- do not clone Slay's private implementation
- use Slay as a UX and interoperability reference only
- repository documents are durable project memory
- AGENTS.md stays concise and points to deeper docs
- do not build the desktop UI before runtime feasibility is established
- do not adopt BLANK's runtime contract as the canonical project schema
- do not modify the pinned upstream checkout

## Known unknowns

- practical capacity of a generic or precompiled runtime
- which STS2 content types truly require concrete compiled models
- reliable project-local artwork loading across supported platforms
- exact BaseLib and runtime compatibility requirements for current STS2 versions
- shape of the eventual canonical project schema
- whether the fixed-shell limits are sufficient for the intended MVP
- whether the documented BLANK build succeeds once prerequisites are available

