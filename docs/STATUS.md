# Project Status

Last updated: 2026-08-24

## Current state

Planning and research only.

Phase 0, Stage 0A (environment audit) is complete. The factual report is in
docs/research/ENVIRONMENT.md.

No production application code has been started.

## Confirmed product requirements

- local-first
- offline-capable core authoring
- no mandatory login
- local artwork
- portable project sharing
- intuitive normal workflow
- advanced capability without exposing technical plumbing
- import/export as first-class capabilities
- eventual standalone mod/source export

## Current architecture hypothesis

Use a canonical project model with:

1. a fast data-driven runtime path for normal editing/testing
2. an optional generated standalone mod path for advanced export

This is **not yet accepted architecture**. Phase 0 exists to prove or reject it.

## Immediate work

Active plan:

docs/plans/active/000-phase-0-runtime-proof.md

Stage 0A result:

the local Windows, Git, .NET, Steam, STS2, mods, BaseLib, and version environment
was audited without installing dependencies or modifying game content. No .NET
SDK was detected, and BaseLib was not detected in the installed STS2 tree.

Next planned action, not started in this task:

inspect BLANK upstream unchanged, then attempt its documented build.

## Known decisions

- do not clone Slay's private implementation
- use Slay as UX/interoperability reference only
- repository documents are durable project memory
- AGENTS.md stays concise and points to deeper docs
- do not build the desktop UI before runtime feasibility is established

## Known unknowns

- practical capacity of a generic/precompiled runtime
- which STS2 content types truly require concrete compiled models
- reliable project-local artwork loading across supported platforms
- exact BaseLib/runtime compatibility requirements for current STS2 versions
- shape of the eventual canonical project schema
- exact Slay export schema until sample exports are provided

