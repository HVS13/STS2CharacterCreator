# Project Status

Last updated: 2026-08-24

## Current state

Planning and research only.

Phase 0, Stage 0A, environment audit, is complete. The factual report is in
docs/research/ENVIRONMENT.md.

Phase 0, Stage 0B, BLANK runtime proof preparation and source audit, is complete.
The checkpoint commit is e66e7862848a0b0731e885da3a932f36a277c5f6.

Phase 0, Stage 0C, unchanged BLANK build, was attempted and is blocked by an
external STS2 API compatibility mismatch. The evidence is in
docs/research/BLANK_BUILD.md.

The .NET 9 SDK is now installed as explicitly authorized. Godot was not installed.
BaseLib was restored only as a NuGet build dependency and was not installed into
the live STS2 mods directory.

No production application code has been started. No application framework has been initialized.
Stage 0D has not started.

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

## Stage 0C findings

- NuGet restore succeeded with the local STS2 path and sandbox ModsPath override.
- The normal build exited 1 with 5 errors and 242 warnings.
- The five errors are CS0115 override mismatches against the installed sts2.dll API.
- No DLL, PDB, JSON, or PCK was produced.
- The live STS2 mods directory was unchanged.
- The BLANK checkout remained at the pinned commit with a clean tracked working tree.
- Stage 0D was not started.

The precise errors, warning summary, package versions, commands, and safety inventory
are recorded in docs/research/BLANK_BUILD.md.

## Git and upstream baseline

- initial baseline commit: ed350f410efcbd189292d8aad5b4b793d42b7836
- baseline message: chore: establish project baseline
- Stage 0B documentation commit: e66e7862848a0b0731e885da3a932f36a277c5f6
- BLANK checkout: research/upstream/BLANKthespire
- BLANK commit: d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
- BLANK branch: main
- no Git remote is configured for this project
- research/upstream/ and research/build-output/ are ignored
- the BLANK checkout is clean

## Stage 0A result

The local Windows, Git, Steam, STS2, mods, BaseLib, and version environment
was audited without modifying game content. The installed .NET SDK is now
9.0.317. BaseLib remains undetected in the live STS2 mods tree.

## Immediate work

Do not start Stage 0D yet.

First resolve the compatibility question identified by Stage 0C. The next decision is
whether to obtain a compatible BLANK and STS2 pair, or to formally defer source
adaptation until a later authorized stage. Do not patch BLANK as part of this report.

## Known decisions

- do not clone Slay's private implementation
- use Slay as a UX and interoperability reference only
- repository documents are durable project memory
- AGENTS.md stays concise and points to deeper docs
- do not build the desktop UI before runtime feasibility is established
- do not adopt BLANK's runtime contract as the canonical project schema
- do not modify the pinned upstream checkout
- do not install BaseLib into the live STS2 mods directory
- do not install Godot during Stage 0C

## Known unknowns

- practical capacity of a generic or precompiled runtime
- which STS2 content types truly require concrete compiled models
- reliable project-local artwork loading across supported platforms
- exact BaseLib and runtime compatibility requirements for current STS2 versions
- shape of the eventual canonical project schema
- whether the fixed-shell limits are sufficient for the intended MVP
- whether a compatible BLANK commit exists for the installed STS2 API
- whether a successful PCK-producing build requires an external Godot executable
