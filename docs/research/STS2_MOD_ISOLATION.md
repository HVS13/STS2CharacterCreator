# STS2 Mod Isolation Findings

Audit date: **2026-08-24**

Status: **Stage 0D.1.1 investigation complete. No runtime launch was performed.**

This document records the safest reproducible way found to prepare a future smoke
test with only official BaseLib v3.4.5 and the patched BLANK compatibility build
enabled. It does not authorize that future launch.

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

Read-only inspection found:

- `settings.save`: 8,997 bytes
- existing `settings.save.backup`: 8,997 bytes
- the two current files have the same SHA-256 hash
- the current settings data contains `BaseLib` text and no `BlankTheSpire` text

The identical backup is existing game state. It was not created or changed during
this task. The prior Stage 0D.1 log recorded cloud synchronization, deletion of a
stale settings file, and writes to `settings.save`. Therefore a settings backup is
mechanically possible, but restoring it is a state mutation and cloud sync can
reintroduce a different copy.

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
no-write method. The current task intentionally did not perform any of these
state-changing steps.

## Safety boundary

- STS2 was not launched during Stage 0D.1.1.
- No live local mod, Workshop directory, Steam setting, save, or settings file was
  changed during Stage 0D.1.1.
- No `settings.save` backup or restore was performed during Stage 0D.1.1.
- Stage 0D.2 was not started.
