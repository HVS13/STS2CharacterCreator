# BLANK Runtime Smoke Report

Audit date: 2026-08-24

Test window: approximately 18:19-18:21 Asia/Jakarta, based on the STS2 log timestamps and final log write time.

Status: **Stage 0D.1.2 complete. The earlier non-isolated Stage 0D.1 result remains historical and blocked. Stage 0D.2 was not started.**

This report covers only the reproducible compatibility checkpoint and controlled
runtime smoke test. Stage 0D.2 was not started.

## Outcome

The committed compatibility derivative rebuilt successfully and produced the
expected runtime files. The official BaseLib v3.4.5 release files were staged
from GitHub and hash-verified. Only the staged BaseLib and BLANK directories
were temporarily installed in the live mods directory.

The normal Steam launch reached the modded startup path. BaseLib loaded and
reported 280 successful patches with 0 failures. BLANK's assembly and PCK were
discovered, but its initializer threw a Harmony `AmbiguousMatchException` while
resolving `WaitHelper.Until`. STS2 then reported a separate duplicate-model
startup error for `CARD.TYPHOON` involving an existing workshop mod.

The two temporary local mod directories were removed after normal shutdown, and
the final local-mod inventory matched the baseline. No gameplay, run, character
import, or character creation was performed. No Godot installation, website,
desktop application, or additional local mod was introduced.

The strict no-save-change condition is not proven. The log records automatic
cloud synchronization, deletion of a stale `settings.save`, and writes to
`settings.save` during startup and shutdown. These were not intentional edits,
but they prevent this smoke test from being classified as a clean Stage 0D.1
pass.

## STS2 environment

- Steam branch: `public-beta`
- Steam build ID: `24724944`
- Local `sts2.dll` ProductVersion: `0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32`
- Log-reported game version: `v0.111.0`

## Git checkpoints

- Stage 0C.2 project documentation commit: `0a70d9204b34af8f18da33a9425fc144ddabdbb1`.
- BLANK compatibility branch: `experiment/current-sts2-compat`.
- BLANK compatibility commit: `8ff307d3eae4afbe111d91784b1bcff4f4dfe2af`.
- Compatibility parent commit: `d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80`.
- The compatibility worktree was clean after the commit. No push was performed.

## Build proof

The compatibility worktree was rebuilt from the committed compatibility commit.
The command ran from `research/upstream/BLANKthespire-compat/mod`:

```powershell
dotnet build .\BlankTheSpire.csproj --no-restore -t:Rebuild -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

Result: exit code 0, 330 warnings, 0 errors. The build produced the BLANK DLL,
PDB, JSON manifest, and PCK in the ignored sandbox output. Only the DLL, JSON,
and PCK were staged for the live smoke test.

## Runtime artifacts

### BaseLib

The source checkout was at tag `v3.4.5`, commit
`22757933ba10adc4322a628519a233a567507d87`. The individual runtime files came
from the [official BaseLib v3.4.5 release](https://github.com/Alchyr/BaseLib-StS2/releases/tag/v3.4.5).
They were staged under the ignored path
`research/build-output/runtime-staging/BaseLib/`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `BaseLib.dll` | 1,090,560 | `AD2F89E43E8B31DEBFAB65D783353D9429EBA59A2CFE904FF933A894CE79D32E` |
| `BaseLib.json` | 271 | `6D64D1BA9E48ABF6E15479A6BDA6F2D2B75A277453361A96CBCDD5508ACCCBA3` |
| `BaseLib.pck` | 131,880 | `A405F900CCFF9FEBD5DD16733DC6D40E8E71BB1237F4578C5291271C97AB2DAA` |

### BLANK

The files were staged under the ignored path
`research/build-output/runtime-staging/BlankTheSpire/`. The staging copy was
refreshed after the forced rebuild from compatibility commit
`8ff307d3eae4afbe111d91784b1bcff4f4dfe2af`.

The staged manifest reports BLANK version `v0.1.7`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `BlankTheSpire.dll` | 437,760 | `34B9A469A3EF2A62654320A9855835291A37FBD9192B361ABDC1A049FBF916B3` |
| `BlankTheSpire.json` | 296 | `FCB94D79DA8477E48D478134C4EFACBD0478DB7070FBE383E4F0A576A80EA25F` |
| `BlankTheSpire.pck` | 151,805 | `C8F9F834D4AAB213023DBB19EC19EB8F95D3DECA6676B51ABB4B40CCA3D99351` |

All six installed files matched their staging hashes before rollback. The
staging directories are ignored build output and are not project source.

## Baseline, install, and rollback

The live game path was:

`D:\SteamLibrary\steamapps\common\Slay the Spire 2`

The live mods path was:

`D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods`

Before installation, the only local mod was `UnifiedSavePath`. The target
directories `BaseLib` and `BlankTheSpire` were absent. The complete baseline
inventory was saved to the ignored file
`research/build-output/pre-smoke-mods-backup/live-mods-before.csv`.

The pre-existing log was copied to the ignored path
`research/build-output/sts2d1-log-before/godot.log` before launch. Only these
two directories were installed temporarily:

- `mods\BaseLib`
- `mods\BlankTheSpire`

The game was closed through its normal window-close path. Only those two
directories were then removed. The final checks reported:

- `BaseLib` present: false
- `BlankTheSpire` present: false
- STS2 process present: false
- final local-mod inventory matches baseline: true

## Launch and log evidence

STS2 was launched through Steam with:

```powershell
Start-Process -FilePath 'steam://rungameid/2868840'
```

The process appeared at the expected executable path, became responsive, and
was closed normally. No gameplay screen, run, character, or settings menu was
opened or interacted with. No direct visual confirmation of a BLANK settings
or menu screen was made.

The final log was copied to the ignored path
`research/build-output/sts2d1-log-after/godot.log`. Relevant evidence:

- Lines 19-20 found the local BaseLib and BLANK manifests.
- Line 21 reported the BLANK manifest's old-style dependency without a minimum
  version.
- Line 149 found an existing Steam Workshop BaseLib v3.4.5 and disabled that
  duplicate in favor of the local staged copy.
- Lines 1254-1280 loaded local BaseLib v3.4.5 and reported `280 patches
  successfully, 0 failed`.
- Lines 1281-1284 loaded the local BLANK manifest, DLL, and PCK.
- Lines 1285-1360 recorded the BLANK initializer exception. Lines 1288-1289
  identify `System.Reflection.AmbiguousMatchException` for the Harmony target
  `MegaCrit.Sts2.Core.AutoSlay.Helpers.WaitHelper:Until`.
- Line 1362 says BLANK initialization finished, but that line follows the
  initializer exception and is not evidence of a clean BLANK initialization.
- Line 1619 reported `RUNNING MODDED` with 53 mods loaded, 54 total.
- Line 7787 reported creation of `user://forged/cards` with no forged cards.
  This was an empty runtime directory creation, not character data creation.
- Line 7804 reported a game-startup error. Lines 7880-7883 identify a
  `DuplicateModelException` for `CARD.TYPHOON`, already mapped to
  `RyoshuMod.Typhoon`, then requested by `Typhoon`. This occurred in the
  existing workshop-heavy mod set and was not isolated from those mods.
- Lines 1624-1625 recorded cloud save synchronization and stale
  `settings.save` deletion. Lines 7976 and 8049 recorded writes to
  `settings.save`.
- Lines 8035-8043 show an existing RitsuLib workshop updater queued three
  workshop item updates. This was not caused by copying a new local mod, but it
  is external activity during the smoke test.

## Log finding classification

A. Existing/base/workshop findings included the Steam Workshop BaseLib duplicate, the `CARD.TYPHOON` conflict involving `RyoshuMod`, asset-cache warnings, and RitsuLib's existing workshop update activity.

B. BaseLib loaded successfully. It reported two skipped legacy targets, `ExhaustivePatch` and `PurgePatch`, but reported 280 patches applied and 0 failed.

C. BLANK produced the old-style dependency warning, the missing minimum-game-version warning, the initializer Harmony exception, and the empty `user://forged/cards` directory creation.

D. Fatal startup findings were the BLANK initializer exception and the later duplicate-model startup error. No missing BLANK DLL or PCK error was reported.

## Result by component

| Component | Result | Evidence |
| --- | --- | --- |
| Compatibility build | Pass | Exit 0, 330 warnings, 0 errors |
| BaseLib runtime load | Pass | v3.4.5 loaded, 280 patches applied, 0 failed |
| BLANK file discovery | Pass | Local DLL and PCK loaded |
| BLANK initializer | Fail | Harmony ambiguous overload exception |
| Overall game startup | Fail | Duplicate model startup error was reported |
| Normal shutdown | Pass | Window close returned true and process exited |
| Rollback | Pass | Only two temporary directories removed; inventory matched |
| Strict no-save-change condition | Not proven | Log recorded automatic `settings.save` writes |

## Commands used

The principal commands for this checkpoint were:

```powershell
git -C research/upstream/BLANKthespire-compat status --short --branch
git -C research/upstream/BLANKthespire-compat rev-parse HEAD
dotnet build .\BlankTheSpire.csproj --no-restore -t:Rebuild -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
Start-Process -FilePath 'steam://rungameid/2868840'
rg -n -C 4 "RUNNING MODDED|forged/cards|Encountered error on game startup|DuplicateModelException|ModelDb already contains ID CARD\.TYPHOON" "C:\Users\USER\AppData\Roaming\SlayTheSpire2\logs\godot.log"
Remove-Item -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods\BaseLib','D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods\BlankTheSpire' -Recurse -Force
```

The artifact download, copy, hash, inventory, and process checks were run with
PowerShell `Invoke-RestMethod`, `Copy-Item`, `Get-FileHash`,
`Get-ChildItem`, and `Get-Process`. No installer or package manager was used
for the runtime smoke test.

## Safety and stopping point

- No STS2 character was created, imported, or played.
- No run was started.
- No forged character or card data was created. BLANK only created its empty
  `user://forged/cards` directory during initialization.
- No source was copied into the parent project.
- The original BLANK checkout remained at its pinned commit and clean.
- No Godot installation or launch occurred.
- No BLANK website or desktop app work occurred.
- No Stage 0D.2 work occurred.
- The temporary local mod installation was rolled back.
- Automatic `settings.save` and existing workshop updater activity remain risks
  from this launch and are documented above.

Stage 0D.1 stops here. Do not begin Stage 0D.2 until the BLANK initializer
failure, the existing duplicate-model conflict, and the save-write risk have
an explicit next-stage disposition.

## Stage 0D.1.1 non-launching follow-up

Audit date: **2026-08-24**

Stage 0D.1.1 completed the diagnosis and compatibility rebuild without launching
STS2. No live mod, Workshop, save, or settings file was changed. Stage 0D.2 was
not started.

### WaitHelper result

The local `sts2.dll` has two public static non-generic `WaitHelper.Until` overloads:

- `Task Until(Func<bool>, CancellationToken, TimeSpan?, Func<string>)`, metadata token `0x0600590A`
- `Task Until(Func<bool>, CancellationToken, TimeSpan?, string)`, metadata token `0x06005909`

The second overload is the one compatible with BLANK's `string? timeoutMessage`
prefix parameter. The previous name-only `AccessTools.Method` lookup was
ambiguous. The compatibility worktree now passes all four parameter types to
select the string overload deterministically. The patch is recorded in commit
`7e5996fb2a16723684cb095951e97ba01e73fc69`. Harmony's overload-targeting
references are recorded in `docs/research/BLANK_COMPATIBILITY.md`.

### Rebuild result

The patched compatibility worktree rebuilt with exit code 0, 330 warnings, and 0
errors. The DLL, JSON manifest, and PCK were produced under the ignored
`research/build-output/blank-mods/` directory. This is compile proof only. It is
not a new runtime proof.

### Isolation result

Read-only inspection of the local assembly found that STS2 checks `nomods` before
mod discovery. That key skips all mod initialization. For normal mod loading, STS2
scans local and Workshop sources, applies source-aware `ModSettings` enablement,
then calls `TryLoadMod`. No per-mod command-line selector was found.

The best available future method is to use the game's built-in per-mod settings to
disable all Workshop entries while leaving only local official BaseLib v3.4.5 and
local patched BLANK enabled. This changes `settings.save`, so it requires an exact
pre-test backup, controlled cloud synchronization, and byte-for-byte restore. The
full procedure and rejected alternatives are in
`docs/research/STS2_MOD_ISOLATION.md`. No part of that procedure was performed
here.

### Follow-up status

The WaitHelper compatibility blocker is resolved in the compatibility worktree.
The original Stage 0D.1 result remains blocked because the prior launch was not
isolated from the existing Workshop-heavy mod set and recorded automatic
`settings.save` activity. A future clean Stage 0D.1 retry requires separate
authorization and the documented isolation protocol.

## Stage 0D.1.2 clean isolated retry

Audit date: **2026-08-24**

This section records the separately authorized clean retry after the Stage 0D.1.1 diagnosis. It does not start Stage 0D.2. No character, card, run, combat, settings menu, or gameplay interaction was performed.

### Checkpoint and build

- Stage 0D.1.1 documentation checkpoint: `9d6f13c3c17fd581a50c3594997db19fc254ca4f`.
- Compatibility worktree commit used: `7e5996fb2a16723684cb095951e97ba01e73fc69`.
- Compatibility worktree was clean before staging.
- Rebuild result: exit code 0, 330 warnings, 0 errors.
- The current staged `BlankTheSpire.dll` hash was `D59B1472F217FD283E87C106F82EA14499D63598FC55465452A9ABA2DA3A118A`. The JSON and PCK hashes remained `FCB94D79DA8477E48D478134C4EFACBD0478DB7070FBE383E4F0A576A80EA25F` and `C8F9F834D4AAB213023DBB19EC19EB8F95D3DECA6676B51ABB4B40CCA3D99351`.
- Official BaseLib v3.4.5 files were staged and hash-verified before installation. No package manager or installer was used for the runtime test.

### Settings proof and isolation

The pre-run live settings hashes were:

- `settings.save`: 9,450 bytes, `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`.
- `settings.save.backup`: 8,997 bytes, `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`.

The game’s own `MegaCrit.Sts2.Core.Saves.JsonSerializationUtility` was invoked by a temporary ignored probe. Parsing and serializing a copy returned `Success=True`, `Status=Success`, 9,450 output bytes, and the exact original `settings.save` hash. This no-op proof completed before the live settings file was touched.

A second game-serializer probe changed only `SettingsSave.ModSettings.ModList` on a copy. The semantic comparison outside `mod_settings.mod_list` returned true. The preview retained all 54 existing entries, disabled the 53 unrelated entries, changed the existing BaseLib source to `mods_directory`, and appended one local `BlankTheSpire` entry. Exactly these two entries were enabled:

```text
BaseLib:mods_directory
BlankTheSpire:mods_directory
```

The physical local mods directory temporarily contained the pre-existing `UnifiedSavePath` plus the two staged test directories. `UnifiedSavePath` was disabled by the settings list and the log confirmed it was skipped. All 53 Workshop directories remained present and their directory inventory was unchanged.

### Startup result

STS2 was launched through the normal Steam URI with no custom game arguments:

```powershell
Start-Process -FilePath 'steam://rungameid/2868840'
```

The log recorded:

- All unrelated local and Workshop entries were skipped as disabled.
- The duplicate Workshop BaseLib was disabled in favor of the local BaseLib.
- BaseLib v3.4.5 initialized and applied 280 patches successfully with 0 failed.
- BLANK DLL and PCK were loaded, and `Finished mod initialization for 'BLANK the spire'` was recorded.
- `RUNNING MODDED` reported `Loaded 2 mods (56 total)`.
- The main menu was reached. `Time to main menu: 21,356ms`.
- No `WaitHelper`, `AutoSlaySmokeHook`, `MissingMethodException`, or `DuplicateModelException` match was present in the final-run log.

One non-fatal manifest compatibility error remained:

```text
Detected old-style dependencies without min version specified! It works for now but this will be removed in a future release.
```

The log also warned that BLANK does not declare a minimum game version. These are manifest warnings for the current build, not startup blockers. The previous Workshop-heavy `CARD.TYPHOON` duplicate-model error did not recur in this isolated run.

### Rollback

STS2 was closed through its normal window-close path and the process exited. The game had rotated the settings files during startup:

- post-run `settings.save`: `02E3C809A1F3A9F18717AAA2AECD5C128A290F1A8FF21C6BE3030E326FF7F20F`.
- post-run `settings.save.backup`: `3833361053DCC21E2D7DE013448CB3856CDB8DF921BC5A39D7C90CC2DF4B8339`.

Both exact pre-run copies were restored after shutdown. A settling check confirmed:

- `settings.save` restored to `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`.
- `settings.save.backup` restored to `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`.
- `BaseLib` and `BlankTheSpire` local directories absent.
- Local mod inventory exactly matched the pre-run `UnifiedSavePath` inventory.
- Workshop directory count remained 53 and the full directory inventory matched the pre-run inventory.
- No unsubscribe or Workshop directory mutation command was issued. Steam subscription state itself is not directly observable from local process inspection.
- BLANK’s six emoji `.png` files, six `.res` files, and empty `forged\characters` directory created during initialization were removed. The pre-existing empty `forged\cards` directory was left untouched.
- No run, character, card, or gameplay save was created or intentionally edited. The log did record a cloud-save overwrite and settings rotation, so remote Steam Cloud state cannot be independently proven from this local audit.

### Commands used for this retry

```powershell
dotnet build .\BlankTheSpire.csproj --no-restore -t:Rebuild -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
dotnet run --project .\research\build-output\settings-roundtrip\settings-roundtrip.csproj -- 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll' '.\research\build-output\smoke-0d1-2\before\settings.save' '.\research\build-output\smoke-0d1-2\settings-roundtrip.save'
dotnet run --project .\research\build-output\settings-isolation\settings-isolation.csproj -- 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll' '.\research\build-output\smoke-0d1-2\before\settings.save' '.\research\build-output\smoke-0d1-2\isolation-preview.save'
Start-Process -FilePath 'steam://rungameid/2868840'
rg -n -C 2 "patches successfully|RUNNING MODDED|Finished mod initialization|Time to main menu|WaitHelper|DuplicateModelException|old-style dependencies" .\research\build-output\smoke-0d1-2\after\godot.log
Remove-Item -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods\BaseLib','D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods\BlankTheSpire' -Recurse -Force
Get-FileHash -LiteralPath <account-scoped-settings.save-path> -Algorithm SHA256
Get-FileHash -LiteralPath <account-scoped-settings.save-path>.backup -Algorithm SHA256
```

The guarded PowerShell steps also recorded the pre-run hashes, verified target directories were absent, copied only the six staged runtime files, restored both settings copies, and compared the local and Workshop inventories. Temporary probes and runtime output remain under ignored `research/build-output/` paths.

### Result classification

| Component | Result |
| --- | --- |
| Settings no-op round-trip on copy | Pass, exact byte hash match |
| ModList-only isolation preview | Pass, non-ModList semantic equality |
| BaseLib v3.4.5 runtime load | Pass, 280 patches, 0 failed |
| BLANK runtime initialization | Pass |
| Main-menu reachability | Pass |
| Known WaitHelper failure | Not present |
| Known DuplicateModelException | Not present |
| Rollback and local inventory | Pass |
| Workshop directory inventory | Pass, 53 of 53 unchanged |
| Remote Steam Cloud/subscription state | Not independently verifiable locally |

Stage 0D.1.2 is complete. Do not start Stage 0D.2 as part of this task.
