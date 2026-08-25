# Project Status

Last updated: 2026-08-25

## Current state

Phase 0 is complete. Phase 1, v1 application implementation, is in progress.
The accepted runtime and local-first architecture is recorded in
docs/decisions/ADR-0001-runtime-and-local-first-architecture.md.

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

The original non-isolated Stage 0D.1 attempt remains blocked as a historical result. The log also records automatic
settings.save synchronization and writes, so the strict no-save-change
criterion is not proven. The full evidence is in
docs/research/BLANK_RUNTIME_SMOKE.md. At that checkpoint, Stage 0D.2 was not started.

Phase 0, Stage 0D.1.1, non-launching WaitHelper diagnosis and compatibility rebuild, is complete as a bounded follow-up. The compatibility worktree commit 7e5996fb2a16723684cb095951e97ba01e73fc69 selects the current string overload deterministically and rebuilds with 0 errors and 330 warnings. The local assembly audit found that `nomods` disables all mods, while source-aware `ModSettings` enablement is applied before mod loading. The clean Stage 0D.1.2 retry completed using the isolation procedure in docs/research/STS2_MOD_ISOLATION.md.

Phase 0, Stage 0D.1.2, clean isolated BLANK runtime smoke-test retry, is complete as a bounded runtime proof. The game’s own settings serializer round-tripped a copy byte-for-byte, and a semantic diff proved that the temporary live edit changed only SettingsSave.ModSettings.ModList. A normal Steam launch loaded exactly local BaseLib v3.4.5 and patched BLANK, reached the main menu, and reported no WaitHelper or DuplicateModelException failure. STS2 did rotate the settings files and logged a cloud-save overwrite during startup, but both settings files, local mods, Workshop directory inventory, and BLANK-generated runtime artifacts were restored or verified after shutdown. At that checkpoint, Stage 0D.2 was not started.

Phase 0, Stage 0D.2A, minimal local data-defined character discovery proof, is complete. A source-derived `Runtime Test` class and one `runtime_test_strike` starter card were written to BLANK’s local class-slot paths, validated by the helper preflight, and accepted by BLANK’s definitive startup loaders. The isolated run loaded only local BaseLib v3.4.5 and patched BLANK, discovered the class and card, and reached the main menu without a run or combat. The forged tree, settings pair, temporary mods, BLANK cache files, and Workshop inventory were restored or verified. Direct character-select visuals were not captured. Automatic writes to existing modded profile/progress/preferences data and Steam Cloud remain a safety risk, as in Stage 0D.1.2. Evidence is in docs/research/BLANK_CHARACTER_PROOF.md.

Phase 0, Stage 0D.2B, controlled runtime combat proof, passed on 2026-08-25 under explicit authorization for a normal Steam launch and temporary user-data writes. BaseLib 3.4.5 and patched BLANK loaded `Runtime Test` and `Runtime Strike`. In the first combat, Nibbit changed from 44 HP to 33 HP with no Block, proving 11 damage from the data-defined `damage: 11` effect. The post-play log had no BLANK/runtime error or exception. The full rollback passed: all 294 user-data hashes, all 3 pre-existing local-mod hashes, and all 53 Workshop directory IDs matched the baseline. Evidence is in docs/research/BLANK_COMBAT_PROOF.md.

Phase 0, Stage 0E and Stage 0E.1, minimal project-local artwork proofs, passed on 2026-08-25. Stage 0E proved one absolute local PNG can be loaded through Godot `ImageTexture` resource takeover. Stage 0E.1 proved that `assets/runtime-strike.png` remains usable after moving the project and removing the original location. Runtime Strike visibly displayed the custom artwork with no network access. The two-file relative-path compatibility patch built a DLL and PCK with 0 errors. The full rollback restored all 294 user-data hashes, settings stability, the pre-existing local mod, and the 53-directory Workshop inventory. Evidence is in docs/research/BLANK_LOCAL_ART.md.

Phase 0, Stage 0F, minimal runtime breadth proof, passed on 2026-08-25. The
isolated Runtime Test proved a normal card upgrade, a custom additive status, a
turn-based conditional effect, and a once-per-combat relic trigger. Runtime
Upgrade displayed 12 damage after Runtime Smith and dealt 12 damage. Runtime
Power showed 2 stacks and increased a later upgraded attack from 12 to 14.
Runtime Conditional dealt 0 damage on turn 1 and 12 damage on turn 2. Runtime
Relic granted 3 Block at combat start. The existing BLANK compatibility DLL and
PCK were reused, with no Stage 0F source change. The full rollback restored all
294 user-data hashes, the forged data, the pre-existing local mod, settings,
and the 53-directory Workshop inventory. Evidence is in
docs/research/BLANK_BREADTH_PROOF.md.

The v1 desktop application scaffold and initial editor implementation are now present. The application framework is initialized. No STS2 save, game, or Workshop content was modified during this implementation slice.

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

## Accepted architecture

Phase 0 accepted a local-first Tauri desktop application with an application-owned
canonical project model. The initial Play backend is a BLANK-derived runtime
behind an adapter, with BaseLib as a runtime dependency. Project-relative local
artwork and portable project files are first-class requirements. Runtime slots,
BLANK JSON, and fixed vocabulary limits stay inside the adapter. Standalone
source/mod export is deferred. The full decision is in
`docs/decisions/ADR-0001-runtime-and-local-first-architecture.md`.
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
- Stage 0D.1 documentation commit: 7fcbf0707559d40ecc3f6dd6acd5abfae92eaadc
- Stage 0D.1.1 documentation checkpoint: 9d6f13c3c17fd581a50c3594997db19fc254ca4f
- BLANK WaitHelper compatibility fix commit: 7e5996fb2a16723684cb095951e97ba01e73fc69
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

Phase 0 is closed. The capacity experiment was intentionally not performed.
Build v1 using docs/plans/active/001-build-v1.md. Do not start a separate
Phase 0 experiment unless an implementation blocker requires it.

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
- whether the compatibility target remains valid after future STS2 API changes
- whether the existing workshop CARD.TYPHOON conflict can be separated from BLANK runtime proof
- whether remote Steam Cloud state and subscription state can be independently verified from local inspection
- whether a compatible BLANK commit is preferable to maintaining the committed local experiment
- whether the current local input path can reliably activate a map node and enter combat in the controlled runtime test

## Phase 1 v1 release-readiness checkpoint

The v1 desktop application validation is complete as an audit, but the release
candidate is NOT READY.

Passed:

- Native installed-app golden journey, including close/reopen, artwork preview,
  undo/redo, and `.sts2char` export/import round trip.
- NSIS install, launch, uninstall, and preservation of an external user-project
  marker. NSIS is the supported Windows installer for v1.
- Bundled runtime setup. The app located STS2 build `24724944`, installed and
  verified the pinned BaseLib 3.4.5 and patched BLANK files, and required no
  manual runtime preparation.
- Local rollback after the controlled Play attempt. All 294 recorded user-data
  hashes, the forged tree, settings pair, three pre-existing local-mod hashes,
  and all 53 Workshop directory inventories matched baseline. BaseLib and
  BlankTheSpire were removed and STS2 remained stopped.

MSI is not release-blocking for v1. Non-elevated MSI installation returned
Windows Installer error 1925 on this host. An elevated control completed. The
host/admin-context dependency is documented, and MSI is not the recommended
v1 path.

The single controlled Play proof is not passed. The app validated the project,
generated and deployed runtime data, created a backup, and launched STS2 through
Steam. The runtime log reported BaseLib and BLANK initialization and a forged
class/card load, but the visible character-selection screen showed `BLANK the
spire`, not `QA Character`. No combat or 11-damage result was claimed, and Play
artwork was not claimed.

A confirmed adapter defect was found after the run: BLANK expects
`starting_deck` entries with `slot`, while the adapter emitted `card`. The
minimal correction is in `src/lib/runtimeAdapter.ts`. It was not retested in
STS2 because the one-shot Play proof was already used. The exact causal link to
the visual mismatch remains unproven.

Local Steam Cloud rollback is not deterministic. The local restored modded
progress file is 811 bytes with SHA-256
`C7E80BF9B220BC2828AEB8E8BBFEEAA4E421C2EA7B51D106249A71184CA0BE23`, while
Steam's remote cache retains a 1,415-byte file with SHA-256
`29154828477516ACF33922601575440D3F12F5224D77BF2898CA2AD705FC6219`. No
further overwrite was attempted.

Remaining v1 blockers:

- prove Play with the corrected adapter and a deterministic runtime data path;
- define a safe Steam Cloud rollback policy that does not leave test-generated
  remote progress state;

Do not start v2 or expand the runtime scope until these blockers are resolved.
