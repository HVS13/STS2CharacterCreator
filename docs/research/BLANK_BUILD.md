# BLANK Build Report

Status: **Stage 0C.2 complete as a bounded sandbox build proof**

Audit date: 2026-08-24

## Provenance

- Repository: https://github.com/ryanrinkel/BLANKthespire
- Local checkout: research/upstream/BLANKthespire
- Branch: main
- Commit: d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
- Upstream status after the build attempt: clean, `main...origin/main`

## Environment

- Operating system: Windows 11 Pro x64, build 26200
- STS2 path: D:\SteamLibrary\steamapps\common\Slay the Spire 2
- STS2 assembly: D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll
- STS2 local identifiers: ProductVersion 0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32, assembly version 0.1.0.0, Steam build ID 24724944
- .NET SDK: 9.0.317
- .NET SDK path: C:\Program Files\dotnet\sdk\9.0.317\
- Godot executable: not found on PATH
- BaseLib in live STS2 mods: not detected

The .NET SDK was installed through the explicitly authorized Microsoft winget
package Microsoft.DotNet.SDK.9, version 9.0.317. No Godot executable was
installed. BaseLib was restored as a NuGet package for the BLANK build, but was
not installed into the live STS2 mods directory.

## Exact restore and build commands

Commands were run from research/upstream/BLANKthespire/mod.

Restore, exit code 0:

```powershell
dotnet restore .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

Normal build, exit code 1:

```powershell
dotnet build .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

One diagnostic-only rebuild was used to capture the complete error list after
the normal build output was dominated by warnings. It did not restore packages
or modify source:

```powershell
dotnet build .\BlankTheSpire.csproj --no-restore -clp:ErrorsOnly -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

The diagnostic rebuild also exited with code 1.

## Restored packages

Resolved package identities from the generated
mod/.godot/mono/temp/obj/project.assets.json:

- Alchyr.Sts2.BaseLib 3.2.1
- Alchyr.Sts2.ModAnalyzers 0.1.9, from the project wildcard reference
- BSchneppe.StS2.PckPacker 0.1.1
- Godot.SourceGenerators 4.5.1
- GodotSharp 4.5.1
- GodotSharpEditor 4.5.1
- Krafs.Publicizer 2.3.0

Restore succeeded. This proves package resolution, not runtime compatibility.

## Build result

The build reached C# compilation and failed with five CS0115 errors:

1. DataCard.GetResultPileTypeForCardPlay() has no suitable method to override.
2. ForgedCorruptionPower.ModifyCardPlayResultPileTypeAndPosition(...) has no suitable method to override.
3. ForgedRelic.ModifyDamageAdditive(...) has no suitable method to override.
4. ForgedStatusPower.ModifyDamageAdditive(...) has no suitable method to override.
5. SpikeSharpenPower.ModifyDamageAdditive(...) has no suitable method to override.

The affected source locations were DataCard.cs line 251, ForgedCorruptionPower.cs
line 58, ForgedRelic.cs line 226, ForgedStatusPower.cs line 90, and
SpikeSharpenPower.cs line 43.

The normal build reported 242 warnings. The visible warnings were primarily
CS8669 nullable annotations in generated ForgedCardSlots.g.cs and
ForgedClasses.g.cs, plus CS8764 nullability mismatches in ForgedBalancePower.cs.

The failure is an STS2 API compatibility blocker. The pinned BLANK source
expects virtual members that are not present in the installed sts2.dll API.
No source patch was attempted.

## Artifacts

No successful build artifacts were produced:

- BlankTheSpire.dll: not produced
- BlankTheSpire.pdb: not produced
- BlankTheSpire.json: not produced
- BlankTheSpire.pck: not produced
- normal mod/bin output: no files produced
- sandbox output: C:\Codex\STS2CharacterCreator\research\build-output\blank-mods\ remained empty

The PCK was not tested because compilation failed before packaging. No external
Godot executable was present, and no Godot installation was attempted.

## Safety verification

The live mods directory was inventoried before and after the build attempt.
Before and after, it contained only:

- UnifiedSavePath directory, last write 2026-08-23T20:47:57.7221105+07:00
- UnifiedSavePath.dll, 7,680 bytes, last write 2026-08-14T05:27:54.7203721+07:00
- UnifiedSavePath.json, 326 bytes, last write 2026-08-14T04:30:44.9450154+07:00
- UnifiedSavePath.pck, 12,204 bytes, last write 2026-08-14T05:27:56.8755319+07:00

The live path was unchanged. The BlankTheSpire directory did not exist before
or after the build. No save files, game files, or installed mods were modified.

The upstream Git checkout remained at the pinned commit with a clean tracked
working tree. Restore/build generated ignored build metadata under the upstream
checkout, but no source files were changed.

## Stage 0C.1 compatibility experiment

Stage 0C.1 used the separate ignored worktree
`research/upstream/BLANKthespire-compat` on branch
`experiment/current-sts2-compat`, based at the same pinned commit. The original
`research/upstream/BLANKthespire` checkout stayed clean.

The local Steam manifest reports the `public-beta` branch and build ID
`24724944`. Local `sts2.dll` metadata reports ProductVersion
`0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32` and assembly version `0.1.0.0`.
No separate public semantic release number was inferred.

NuGet listed `Alchyr.Sts2.BaseLib` 3.4.5 as the latest stable version at audit
time, with a NuGet-listed Last Updated date of 2026-08-14 (the page did not expose a separate publication timestamp). The compatibility worktree
changed only its BaseLib PackageReference from 3.2.1 to 3.4.5 for the first
experiment. Restore succeeded. The BaseLib-only build still failed with the
same five override errors and 242 warnings.

Local metadata confirmed these current signatures:

- `CardModel.GetResultLocationForCardPlay()` returns `CardLocation`.
- `AbstractModel.ModifyCardPlayResultLocation(...)` takes and returns
  `CardLocation`.
- `AbstractModel.ModifyDamageAdditive(...)` has a final `CardPlay` parameter.
- `CardLocation` contains the player, pile type, and pile position.
- `CardCreationOptions.CustomCardPool` and
  `AssertUniformOddsIfSingleRarityPool` are absent.

The compatibility worktree applied five direct API migrations, then three clear
`CreatureCmd.Damage` call-site fixes and one missing namespace import. The final
worktree diff was 9 files, 23 insertions, and 17 deletions. The final sandboxed
build exited 1 with 2 errors and 330 warnings:

1. `SingleRarityRewardPoolPatch.cs(35,31)` still references the removed
   `CardCreationOptions.CustomCardPool`. The old Harmony target is also absent,
   so a property rename would not preserve behavior.
2. `BlankTheSpire.cs(13,14)` reports analyzer error `STS001` for four existing
   character dialogue keys, even though those keys are present in
   `BlankTheSpire/localization/eng/characters.json`.

The final build produced no DLL, PDB, JSON, or PCK. The sandbox ModsPath remained
empty. The live mods directory remained unchanged and contained no
`BlankTheSpire` directory. No STS2 launch, Godot installation, live BaseLib
installation, save-file change, or game-file change occurred.

Compatibility references:

- <https://packages.nuget.org/packages/Alchyr.Sts2.BaseLib/3.4.5>
- <https://tutorials.sts2modding.com/docs/07-migration-99-100/>
- <https://tutorials.sts2modding.com/en/docs/12-hook-trigger-order/>

Exact Stage 0C.1 commands, run from the compatibility worktree's `mod`
directory:

```powershell
dotnet restore .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
dotnet build .\BlankTheSpire.csproj --no-restore -clp:ErrorsOnly -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

Stage 0D was not started.

## Final 0C blockers

The two final Stage 0C.1 compile blockers were resolved only in the ignored compatibility worktree research/upstream/BLANKthespire-compat.

The old reward patch referenced CardCreationOptions.CustomCardPool and Harmony target AssertUniformOddsIfSingleRarityPool. Both are absent from the installed sts2.dll. The old patch only forced uniform odds for a single-rarity custom pool. It did not select a pool or card. The patch was removed as obsolete for the current runtime. No speculative replacement hook was added. Current supported members are CardPools, CardPoolFilter, WithCardPools, WithFilter, WithRarityOdds, and TryGetSingleRarityInPool.

The STS001 analyzer error was emitted by Alchyr.Sts2.ModAnalyzers 0.1.9, Sts2ModAnalyzers.dll, rule STS001, at BlankTheSpireCode/Character/BlankTheSpire.cs(13,14). Its four missing keys were already present in characters.json but belonged in ancients.json. They were moved without suppressing the analyzer or deleting localization content. The project already passed both files as analyzer additional files.

The exact final command was:

dotnet build ./research/upstream/BLANKthespire-compat/mod/BlankTheSpire.csproj --no-restore -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"

Result: exit code 0, 330 warnings, 0 errors. The sandbox output contains a DLL, PDB, JSON manifest, and PCK. No publish command was used. STS2 was not launched.

## Remaining limitations after Stage 0C.2

- runtime loading and in-game behavior remain untested because STS2 was not launched
- at the Stage 0C.2 checkpoint, live BaseLib remained uninstalled
- Godot remains uninstalled and unlaunched
- at the Stage 0C.2 checkpoint, the compatibility derivative remained an ignored, uncommitted experiment
- at the Stage 0C.2 checkpoint, Stage 0D had not started

## Stage 0D.1 controlled runtime smoke test

Status: **blocked**. The complete runtime evidence is in
`docs/research/BLANK_RUNTIME_SMOKE.md`.

The committed compatibility derivative was `8ff307d3eae4afbe111d91784b1bcff4f4dfe2af`, based on the pinned BLANK commit `d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80`. A forced rebuild exited 0 with 330 warnings and 0 errors. Only the resulting DLL, JSON manifest, and PCK were staged.

Official BaseLib v3.4.5 release files were staged from the [official release](https://github.com/Alchyr/BaseLib-StS2/releases/tag/v3.4.5), tag commit `22757933ba10adc4322a628519a233a567507d87`. The staged SHA-256 values were:

- `BaseLib.dll`: `AD2F89E43E8B31DEBFAB65D783353D9429EBA59A2CFE904FF933A894CE79D32E`
- `BaseLib.json`: `6D64D1BA9E48ABF6E15479A6BDA6F2D2B75A277453361A96CBCDD5508ACCCBA3`
- `BaseLib.pck`: `A405F900CCFF9FEBD5DD16733DC6D40E8E71BB1237F4578C5291271C97AB2DAA`

The BLANK staged SHA-256 values were:

- `BlankTheSpire.dll`: `34B9A469A3EF2A62654320A9855835291A37FBD9192B361ABDC1A049FBF916B3`
- `BlankTheSpire.json`: `FCB94D79DA8477E48D478134C4EFACBD0478DB7070FBE383E4F0A576A80EA25F`
- `BlankTheSpire.pck`: `C8F9F834D4AAB213023DBB19EC19EB8F95D3DECA6676B51ABB4B40CCA3D99351`

The normal Steam launch reached `RUNNING MODDED`. BaseLib loaded and applied 280 patches with 0 failures. BLANK's DLL and PCK loaded, but its initializer failed with a Harmony `AmbiguousMatchException` for `WaitHelper.Until`. STS2 also reported an existing-workshop `CARD.TYPHOON` duplicate-model startup error. The two temporary local mod directories were removed after normal shutdown, and the final local-mod inventory matched the baseline.

The log records automatic `settings.save` synchronization and writes. No intentional character, run, save, or game-content edit was performed, but this means the strict no-save-change criterion is not proven. Stage 0D.2 was not started.
