# BLANK Build Report

Status: **Stage 0C blocked by an external STS2 API mismatch**

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

## Remaining blockers

- Find a BLANK commit compatible with the installed STS2 assembly, or defer any
  source adaptation to a later explicitly authorized stage.
- A successful PCK-producing build remains unproven.
- Godot external executable requirements remain untested because compilation
  failed first.
- BaseLib is available to the build through NuGet but is not installed in STS2.

Stage 0D was not started.
