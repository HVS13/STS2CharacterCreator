# STS2 Mod Isolation Findings

Audit date: **2026-08-24**

Status: **Stage 0D.1.2 clean retry complete. Stage 0D.2 was not started.**

This document records the safest reproducible way found to prepare a future smoke
test with only official BaseLib v3.4.5 and the patched BLANK compatibility build
enabled. The procedure was executed once under separate Stage 0D.1.2 authorization and rolled back.

## Current inventory

The live installation was inspected read-only after the Stage 0D.1 rollback:

- Live local mods path: `D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods`
- Current local directory count: 1, `UnifiedSavePath`
- Current local `BaseLib` directory: absent
- Current local `BlankTheSpire` directory: absent
- Workshop content root: `D:\SteamLibrary\steamapps\workshop\content\2868840`
- Current Workshop directory count: 53

These counts describe the current filesystem only. The earlier Stage 0D.1 log
also showed 53 Workshop mods plus the two temporary local test mods during that
launch.

## Local assembly evidence

The local `sts2.dll` was inspected without loading the game. Its mod manager has
the following relevant behavior:

1. `ModManager.Initialize` checks the executable argument key `nomods`. If it is
   present, the manager logs that mod initialization is skipped and returns.
2. Otherwise it scans the local `mods` directory and, in the local build, the
   `mods_STEAMTEST` directory when present.
3. If Steam is initialized, it calls `ReadSteamMods`, which enumerates subscribed
   Workshop items and scans each installed item recursively for `.json` manifests.
4. It calls `CheckSteamBranchSupport`, then `RemoveDisabledMods`, then
   `SortModList`.
5. Only after those steps does it call `TryLoadMod`, which loads the DLL or PCK
   and runs the initializer or Harmony patches.

The local enum has distinct sources:

- `ModSource.ModsDirectory = 1`
- `ModSource.SteamWorkshop = 2`

`ModSettings.ModList` contains `SettingsSaveMod` entries with `Id`, `IsEnabled`,
and `Source`. `ModSettings.IsModDisabled(id, source)` matches those fields, and
`RemoveDisabledMods` removes disabled entries before `TryLoadMod`. This is the
game's built-in per-mod selection mechanism. It is source-aware, so a local
BaseLib entry and a Workshop BaseLib entry can be treated separately.

## Command-line findings

The only explicit mod-related command-line key found in the local assembly was
`nomods`. No per-mod selector, local-only selector, or Workshop-only selector was
found in the inspected command-line strings or `ModManager` metadata.

`nomods` is not suitable for the requested smoke test because it disables
BaseLib and BLANK as well as every unrelated mod. It is useful only as a
no-mods baseline, and it was not executed during this task.

## Settings persistence

The local `SettingsSave` type contains a `ModSettings` property. The current
settings file is the account-scoped `user://steam/<account-id>/settings.save`
container, represented locally under the STS2 roaming-data directory. It is a
settings container, not a run save, but it contains mod enablement state alongside
normal game settings.

Read-only pre-run inspection found:

- `settings.save`: 9,450 bytes, SHA-256 `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`
- existing `settings.save.backup`: 8,997 bytes, SHA-256 `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`
- the two pre-run files were already different
- the pre-run settings data contained `BaseLib` and no `BlankTheSpire` entry

The Stage 0D.1.2 no-op proof used the game’s own `JsonSerializationUtility` on a
copy and returned an exact byte-for-byte hash match. The isolation preview changed
only `SettingsSave.ModSettings.ModList`: all 53 unrelated entries were disabled,
the local BaseLib source was selected, and a local BlankTheSpire entry was added.
The game rotated both settings files during startup, so both exact pre-run copies
were restored after shutdown. Remote Steam Cloud state is not directly observable
from local process inspection.

## Candidate isolation methods

| Method | Result for this smoke test | Main risk or limitation |
|---|---|---|
| `nomods` argument | Reject | Disables BaseLib and BLANK too |
| Built-in per-mod `IsEnabled` state | Best available | Changes `settings.save`; requires cloud-safe backup and restore |
| Rename or remove Workshop directories | Reject | Modifies or risks Workshop content, explicitly out of scope |
| Unsubscribe Workshop items | Reject | Changes external Steam state, explicitly out of scope |
| Steam offline/settings changes | Reject for current task | Changes Steam state and does not prove per-mod selection |
| Unverified per-mod CLI flag | Reject | No such supported selector was found locally |

## Recommended future clean retry

The recommended method is a separately authorized, reversible settings-state
isolation run:

1. Confirm STS2 and Steam have no active game process. Record hashes for both
   `settings.save` and `settings.save.backup` into the ignored audit output.
2. Preserve exact byte-for-byte copies outside the live settings directory. Do
   not edit the live files directly for this audit.
3. Use the game's supported mod-management UI to disable every Workshop mod,
   including the Workshop BaseLib duplicate, and leave only local official
   BaseLib v3.4.5 and local patched BLANK enabled. Do not unsubscribe anything.
4. Install only those two test directories, launch through the normal Steam path,
   and capture the log. Do not create a run, character, forged card, or imported
   content.
5. After the process exits, verify the local-mod inventory, capture settings and
   log hashes, then restore the exact settings files only after the game and any
   cloud synchronization activity are stopped.
6. Verify the restored hashes match the pre-test hashes. If cloud synchronization
   cannot be controlled, do not call the run clean. Use a disposable profile or
   another separately approved isolation mechanism instead.

This procedure is the best available game-supported method, not a proven
no-write method. Stage 0D.1.1 intentionally did not perform any of these
state-changing steps; Stage 0D.1.2 later executed the procedure and rolled it back.

## Safety boundary

- STS2 was not launched during Stage 0D.1.1; the separately authorized Stage 0D.1.2 retry was launched normally through Steam.
- No live local mod, Workshop directory, Steam setting, save, or settings file was
  changed during Stage 0D.1.1.
- The Stage 0D.1.2 settings backup and restore hashes match exactly.
- Stage 0D.2 was not started.

## Stage 0D.1.2 result

The isolation procedure was executed on 2026-08-24 and rolled back after the game
reached the main menu. The live settings edit was made from a game-serializer
preview, not by hand-editing JSON. Only local BaseLib v3.4.5 and patched BLANK were
enabled. The pre-existing local `UnifiedSavePath` directory remained installed but
was disabled. All 53 Workshop entries were retained and disabled. The final log
reported `Loaded 2 mods (56 total)`, BaseLib initialization, BLANK initialization,
and `Time to main menu: 21,356ms`.

The final-run log contained no `WaitHelper` failure and no
`DuplicateModelException`. It did contain the non-fatal old-style dependency
message because BLANK’s manifest dependency does not specify a minimum version,
and a warning that BLANK has no minimum game version.

After normal shutdown:

- both `settings.save` and `settings.save.backup` matched their exact pre-run hashes;
- the local mod inventory matched the pre-run inventory exactly;
- the Workshop directory inventory matched all 53 pre-run IDs;
- no unsubscribe or Workshop directory mutation command was issued;
- the six BLANK-generated emoji PNG files, six resource files, and empty
  `forged\characters` directory were removed; the pre-existing `forged\cards`
  directory was not changed;
- no character, card, run, or gameplay save was created or intentionally edited.

The game did log a cloud-save overwrite and settings rotation. That local evidence
means remote Steam Cloud state cannot be called unchanged with certainty. This is a
remaining risk, not a failure of the local rollback.
