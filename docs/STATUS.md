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

Phase 0, Stage 0C.1, current STS2 compatibility investigation and minimal BLANK adaptation, is complete as a bounded experiment. Its two final blockers were resolved in Stage 0C.2. The investigation and final proof are in docs/research/BLANK_COMPATIBILITY.md.

Phase 0, Stage 0C.2, final BLANK compatibility blockers, is complete as a sandbox build proof. The compatibility worktree now builds with 0 errors and 330 warnings and produces a DLL, PDB, JSON manifest, and PCK under the ignored research/build-output/blank-mods/ path. STS2 was not launched, and live mods, save files, and game files were not modified.

The .NET 9 SDK is now installed as explicitly authorized. Godot was not installed.
BaseLib was restored only as a NuGet build dependency and was not installed into
the live STS2 mods directory.

Phase 0, Stage 0D.1, reproducible compatibility checkpoint and controlled
runtime smoke test, was attempted on 2026-08-24. The compatibility derivative
was committed as 8ff307d3eae4afbe111d91784b1bcff4f4dfe2af and rebuilt with 0
errors. A normal Steam launch reached RUNNING MODDED. BaseLib v3.4.5 loaded and
reported 280 successful patches with 0 failures. BLANK's DLL and PCK were
discovered, but its initializer failed with a Harmony AmbiguousMatchException
for the current WaitHelper.Until overloads. STS2 also reported a separate
CARD.TYPHOON duplicate-model startup error in the existing workshop-heavy mod
set. The temporary BaseLib and BlankTheSpire directories were removed and the
final local-mod inventory matched the baseline.

Stage 0D.1 is blocked, not complete. The log also records automatic
settings.save synchronization and writes, so the strict no-save-change
criterion is not proven. The full evidence is in
docs/research/BLANK_RUNTIME_SMOKE.md. Stage 0D.2 was not started.

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

## Stage 0C findings

- NuGet restore succeeded with the local STS2 path and sandbox ModsPath override.
- The normal build exited 1 with 5 errors and 242 warnings.
- The five errors are CS0115 override mismatches against the installed sts2.dll API.
- No DLL, PDB, JSON, or PCK was produced.
- The live STS2 mods directory was unchanged.
- The BLANK checkout remained at the pinned commit with a clean tracked working tree.
- At that checkpoint Stage 0D had not started.

The precise errors, warning summary, package versions, commands, and safety inventory
are recorded in docs/research/BLANK_BUILD.md.

## Stage 0C.1 findings

- The installed STS2 branch setting is public-beta, with Steam build ID 24724944.
- Local metadata confirms the result-location and damage-hook signature changes.
- BaseLib 3.4.5 was tested in a separate ignored worktree. It did not remove the original five override errors.
- Five API migrations and three additional clear CreatureCmd.Damage call-site fixes reduced the final compatibility build to 2 errors and 330 warnings.
- Stage 0C.2 proved the reward patch was an obsolete old-runtime assertion guard, removed it from the ignored compatibility worktree, and moved four existing dialogue keys from characters.json to ancients.json to satisfy STS001.
- The final compatibility build exits 0 with 330 warnings and produces a DLL, PDB, JSON manifest, and PCK in the sandbox output.
- The compatibility derivative changed 12 ignored worktree files. No parent project source, original BLANK source, STS2 file, save, or live mod was changed.
- At that checkpoint Stage 0D had not started.

## Git and upstream baseline

- initial baseline commit: ed350f410efcbd189292d8aad5b4b793d42b7836
- baseline message: chore: establish project baseline
- Stage 0B documentation commit: e66e7862848a0b0731e885da3a932f36a277c5f6
- Stage 0C documentation checkpoint: d8bb3cf88990a7ce1e6c0758f86f4595c9a8edc4
- Stage 0C.2 documentation commit: 0a70d9204b34af8f18da33a9425fc144ddabdbb1
- BLANK compatibility commit: 8ff307d3eae4afbe111d91784b1bcff4f4dfe2af
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

Stage 0D.1 is blocked after the controlled smoke test. Do not start Stage 0D.2. First review the BLANK initializer overload failure, the existing duplicate-model conflict, and the automatic settings.save and workshop-update activity. Any corrective runtime experiment needs a separately scoped authorization.

## Known decisions

- do not clone Slay's private implementation
- use Slay as a UX and interoperability reference only
- repository documents are durable project memory
- AGENTS.md stays concise and points to deeper docs
- do not build the desktop UI before runtime feasibility is established
- do not adopt BLANK's runtime contract as the canonical project schema
- do not modify the pinned upstream checkout
- compatibility experiments must use a separate ignored BLANK worktree
- do not leave BaseLib or experimental BLANK artifacts installed in the live STS2 mods directory; any temporary install requires an explicit controlled rollback
- do not install Godot during Phase 0

## Known unknowns

- practical capacity of a generic or precompiled runtime
- which STS2 content types truly require concrete compiled models
- reliable project-local artwork loading across supported platforms
- exact BaseLib and runtime compatibility requirements for current STS2 versions
- shape of the eventual canonical project schema
- whether the fixed-shell limits are sufficient for the intended MVP
- whether BLANK's AutoSlay timeout patch must select a specific current WaitHelper.Until overload
- whether the existing workshop CARD.TYPHOON conflict can be separated from BLANK runtime proof
- whether a safe smoke-test procedure can avoid automatic settings.save writes and workshop updates
- whether a compatible BLANK commit is preferable to maintaining the committed local experiment
