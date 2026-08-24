# BLANK Compatibility Investigation

Status: **Stage 0D.1.1 complete as a bounded compatibility diagnosis and sandbox rebuild; clean Stage 0D.1 retry pending**

Audit date: **2026-08-24**

## Scope

This investigation tested the pinned BLANK source against the locally installed
STS2 assembly. It did not launch STS2, modify the game installation, install
Godot, install BaseLib into the live mods directory, or modify save files.

The original research checkout remains unchanged:

- path: `research/upstream/BLANKthespire`
- branch: `main`
- commit: `d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80`
- status: clean

The experiment used a separate ignored Git worktree:

- path: `research/upstream/BLANKthespire-compat`
- branch: `experiment/current-sts2-compat`
- base commit: `d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80`
- remote push: none
- parent repository tracking: ignored by `research/upstream/`

## Local STS2 API evidence

The installed files provide local identifiers, not a separately inferred public
semantic release number:

- Steam branch setting: `public-beta`, detected in
  `D:\SteamLibrary\steamapps\appmanifest_2868840.acf`
- Steam build ID: `24724944`
- `sts2.dll` ProductVersion:
  `0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32`
- `sts2.dll` assembly version: `0.1.0.0`
- `sts2.dll` path:
  `D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll`

An ignored .NET metadata utility read the local assembly without loading the
game. Relevant declarations were:

| Area | Pinned BLANK declaration | Local declaration | Result |
|---|---|---|---|
| Card result location | `protected override PileType GetResultPileTypeForCardPlay()` | `protected virtual CardLocation GetResultLocationForCardPlay()` | Migrated `DataCard` |
| Card-play modifier | `ModifyCardPlayResultPileTypeAndPosition(CardModel, bool, ResourceInfo, PileType, CardPilePosition)` returning `(PileType, CardPilePosition)` | `ModifyCardPlayResultLocation(CardModel, bool, ResourceInfo, CardLocation)` returning `CardLocation` | Migrated `ForgedCorruptionPower` |
| Damage modifier | `ModifyDamageAdditive(Creature, decimal, ValueProp, Creature, CardModel)` | `ModifyDamageAdditive(Creature, decimal, ValueProp, Creature, CardModel, CardPlay)` | Added unused `CardPlay` parameter to three overrides |
| Card location data | tuple `(PileType, CardPilePosition)` | `CardLocation(Player player, PileType pileType, CardPilePosition position)` | Existing player and position are preserved |
| Damage command | old call sites passed dealer and card source | current overloads use `CardModel` and `CardPlay`, or a `DamageVar` plus card source and `CardPlay` | Three clear call sites migrated |

The current related declarations also show:

- `CardCreationOptions.CardPools` is an `IReadOnlyCollection<CardPoolModel>`.
- `CardCreationOptions.TryGetSingleRarityInPool()` is present.
- `CardCreationOptions.CustomCardPool` is absent.
- `CardCreationOptions.AssertUniformOddsIfSingleRarityPool` is absent from the
  local metadata.
- `DamageVar` is constructed as `DamageVar(decimal damage, ValueProp props)`.

The public migration reference documents the tuple-to-`CardLocation` change in
the 0.108 to 0.109 migration table. It also documents the removal of
`CardCreationOptions.CustomCardPool` in that migration range:

- <https://tutorials.sts2modding.com/docs/07-migration-99-100/>

The current public hook-order reference describes `ModifyCardPlayResultLocation`,
`GetResultLocationForCardPlay`, and the current damage modifier sequence:

- <https://tutorials.sts2modding.com/en/docs/12-hook-trigger-order/>

These public pages are supporting evidence only. The local assembly metadata is
authoritative for the signatures used by this build.

## BaseLib experiment

The pinned project referenced BaseLib 3.2.1. NuGet listed BaseLib 3.4.5 as the
latest stable version at audit time, with a NuGet-listed Last Updated date of 2026-08-14 (the page did not expose a separate publication timestamp),
`.NET 9.0` support, and no package dependencies:

- <https://packages.nuget.org/packages/Alchyr.Sts2.BaseLib/3.4.5>

Only the `PackageReference` in the ignored compatibility worktree was changed
from `3.2.1` to `3.4.5`.

BaseLib-only result:

- restore: exit code 0
- build: exit code 1
- errors: the same five original override errors
- warnings: 242
- sandbox ModsPath: `C:\Codex\STS2CharacterCreator\research\build-output\blank-mods\`
- build artifacts: none

The package update did not resolve the five known API mismatches.

## Compatibility patches

### `DataCard.cs`

**OLD**

```csharp
protected override PileType GetResultPileTypeForCardPlay()
    => Spec.HasPurge ? PileType.None : base.GetResultPileTypeForCardPlay();
```

**NEW**

```csharp
protected override CardLocation GetResultLocationForCardPlay()
{
    var location = base.GetResultLocationForCardPlay();
    return Spec.HasPurge
        ? new CardLocation(location.player, PileType.None, location.position)
        : location;
}
```

**BEHAVIORAL DIFFERENCE**

None intended. A purge card still uses `PileType.None`. A non-purge card still
uses the base result. The new player and position fields are preserved.

**WHY EQUIVALENT**

The local API replaces the old pile-only result with a `CardLocation` record
struct. The old override changed only the pile type, so the adaptation changes
only that field.

### `ForgedCorruptionPower.cs`

**OLD**

```csharp
public override (PileType, CardPilePosition) ModifyCardPlayResultPileTypeAndPosition(
    CardModel card, bool isAutoPlay, ResourceInfo resources,
    PileType pileType, CardPilePosition position)
```

**NEW**

```csharp
public override CardLocation ModifyCardPlayResultLocation(
    CardModel card, bool isAutoPlay, ResourceInfo resources, CardLocation location)
```

The pass-through path returns `location`. The exhaust path returns a new
`CardLocation` with the existing player and position and `PileType.Exhaust`.

**BEHAVIORAL DIFFERENCE**

None intended. Only the result container and member name changed.

**WHY EQUIVALENT**

The local API uses `CardLocation` for the same pile and position decision. The
owner and position are preserved while the corruption rule changes only the
pile type for the owner's Skills.

### Damage modifier overrides

The following overrides gained the final `CardPlay cardPlay` parameter:

- `ForgedRelic.ModifyDamageAdditive`
- `ForgedStatusPower.ModifyDamageAdditive`
- `SpikeSharpenPower.ModifyDamageAdditive`

**BEHAVIORAL DIFFERENCE**

None intended. The new context parameter is not used by these existing rules.

**WHY EQUIVALENT**

The local virtual method has one additional context argument. The existing
damage delta logic and return values are unchanged.

### Additional clear call-site fixes

After the five override migrations, three files still used the removed
dealer-plus-card `CreatureCmd.Damage` argument shape:

- `Engine/TriggerRunner.cs`
- `Powers/ForgedBalancePower.cs`
- `Engine/EffectRunner.cs`

The calls now use the local `CardModel`/`CardPlay` slots, and the card-source
damage call passes the explicit final `CardPlay` slot. No damage amount,
`ValueProp`, target, or dealer behavior was otherwise changed. These were
bounded signature fixes, not runtime redesigns.

One missing `MegaCrit.Sts2.Core.Entities.Cards` import was added to
`SpikeSharpenPower.cs` after the first adapted compile.

## Build attempts after adaptation

All builds used the installed STS2 path as a read-only reference and the
ignored sandbox ModsPath. The original BLANK checkout was checked clean before
each build.

1. BaseLib 3.4.5 only: 5 errors, 242 warnings.
2. Five API migrations: one missing `CardPlay` namespace import remained.
3. After the import: 11 errors, 330 warnings.
4. After the three clear `CreatureCmd.Damage` call-site fixes: 2 errors, 330
   warnings.

The final two errors are:

1. `SingleRarityRewardPoolPatch.cs(35,31)`: current
   `CardCreationOptions` has no `CustomCardPool` property. Its Harmony target
   `AssertUniformOddsIfSingleRarityPool` is also absent from the local metadata.
   Replacing the property alone would leave the patch targeting a missing
   method and could change reward behavior. This needs a separate semantic
   investigation, not a guessed rename.
2. `BlankTheSpire.cs(13,14)`: analyzer `STS001` reports the four existing
   `THE_ARCHITECT.talk.BLANKTHESPIRE-BLANK_THE_SPIRE.*` keys as missing, even
   though they are present in
   `BlankTheSpire/localization/eng/characters.json`. Resolving this needs
   analyzer or localization-contract investigation and should not be hidden by
   deleting or weakening localization content.

The final compile produced no `BlankTheSpire.dll`, `.pdb`, `.json`, or `.pck`.
The sandbox output directory remained empty. PCK generation and runtime loading
therefore remain unproven.

## Patch size and maintainability

The ignored compatibility worktree changed 9 tracked BLANK files, with 23
insertions and 17 deletions. The source changes are mechanically small, but the
overall maintenance classification is **MODERATE**.

The five requested API migrations and three additional call-site migrations are
local and understandable. However, the current STS2 beta API also removes or
relocates reward-pool behavior and exposes a localization analyzer mismatch.
Those unresolved areas prevent a clean build and could require behavior-level
changes. The derivative is not ready to install or use as a maintained runtime.

## Safety result

- original `research/upstream/BLANKthespire`: clean at the pinned commit
- compatibility changes: only in the separate ignored worktree
- live mods: unchanged; `BlankTheSpire` was not present
- live BaseLib: not installed
- at the Stage 0C.2 checkpoint, STS2 was not launched
- Godot: not installed or launched
- save files and game content: not modified

## Exact commands used

Repository and worktree checks:

```powershell
git -C research/upstream/BLANKthespire status --short --branch
git -C research/upstream/BLANKthespire rev-parse HEAD
git -C research/upstream/BLANKthespire worktree add -b experiment/current-sts2-compat C:/Codex/STS2CharacterCreator/research/upstream/BLANKthespire-compat d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
git -C research/upstream/BLANKthespire-compat status --short --branch
git check-ignore -v research/upstream/BLANKthespire/README.md research/upstream/BLANKthespire-compat/README.md
git -C research/upstream/BLANKthespire-compat diff --check
git -C research/upstream/BLANKthespire-compat diff --numstat
```

Local metadata inspection:

```powershell
dotnet run --project .\research\build-output\sts2-metadata-inspector\sts2-metadata-inspector.csproj -- "D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll" "C:\Codex\STS2CharacterCreator\research\build-output\sts2-metadata.txt"
```

A first restore from the compatibility worktree root failed with MSB1009 because
the project file is under `mod`; no files were changed by that failed attempt.

Restore and build commands, run from the compatibility worktree's `mod`
directory:

```powershell
dotnet restore .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
dotnet build .\BlankTheSpire.csproj --no-restore -clp:ErrorsOnly -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

Safety inventory command:

```powershell
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods' -Force -Recurse
Get-ChildItem -LiteralPath 'C:\Codex\STS2CharacterCreator\research\build-output\blank-mods' -Force -Recurse
git -C research/upstream/BLANKthespire status --short --branch
```

## Recommendation

Keep Stage 0D stopped. Stage 0C.2 is complete as a bounded sandbox build proof. Do not install or launch this derivative without separate authorization.

## Final 0C blockers

Stage 0C.2 resolved the two final compile blockers in the ignored compatibility worktree. The original BLANK checkout was not changed.

### Reward-pool migration

Old behavior: SingleRarityRewardPoolPatch patched the old CardCreationOptions.AssertUniformOddsIfSingleRarityPool method. It read the old CustomCardPool property and changed RarityOdds to Uniform when the pool contained one rarity, then skipped the old assertion. It did not select a pool, card, merchant source, or serialized reward.

Current API: local sts2.dll exposes CardCreationOptions.CardPools, CardPoolFilter, WithCardPools, WithFilter, WithRarityOdds, and TryGetSingleRarityInPool. It does not expose CustomCardPool or AssertUniformOddsIfSingleRarityPool. Current CardReward constructors use CardCreationOptions, or explicit offered cards plus reroll options.

Implementation: removed the obsolete SingleRarityRewardPoolPatch.cs from the ignored compatibility worktree. No replacement hook was added. BaseLib 3.4.5 was inspected at tag v3.4.5, commit 22757933ba10adc4322a628519a233a567507d87. Its current serialization path uses card pools and filters, and its legacy path is conditional on the old property being present. This confirms that a property rename or a new broad Harmony patch would not be a justified equivalent.

Behavioral difference: none for the targeted local runtime, because the old assertion target and property are absent. The old guard is no longer callable. Behavior on older runtimes is outside this compatibility target and was not preserved by adding a speculative current-runtime hook.

### STS001 investigation

Full diagnostic from the pre-fix build:

BlankTheSpireCode/Character/BlankTheSpire.cs(13,14): error STS001:
Localization THE_ARCHITECT.talk.BLANKTHESPIRE-BLANK_THE_SPIRE.0-0r.char,
THE_ARCHITECT.talk.BLANKTHESPIRE-BLANK_THE_SPIRE.0-0r.next,
THE_ARCHITECT.talk.BLANKTHESPIRE-BLANK_THE_SPIRE.0-1r.ancient,
THE_ARCHITECT.talk.BLANKTHESPIRE-BLANK_THE_SPIRE.0-attack not found for
symbol 'BlankTheSpire.BlankTheSpireCode.Character.BlankTheSpire'

The analyzer was Alchyr.Sts2.ModAnalyzers 0.1.9, assembly Sts2ModAnalyzers.dll, rule STS001, severity Error. Its source was checked at commit 46c6a91ff24d47062d6b28cb734a8f855e1da0b6, with MIT licensing. The compiler command included all four localization files as AdditionalFiles, so analyzer discovery was working.

Root cause: the four required THE_ARCHITECT.talk keys were in localization/eng/characters.json. The analyzer requires those dialogue keys in localization/eng/ancients.json. The empty ancients.json made the keys appear missing.

Fix: moved the four existing keys to ancients.json. No localization content was deleted, invented, or suppressed.

### Build proof

The final normal build exited 0 with 330 warnings and 0 errors. It produced:

- research/build-output/blank-mods/BlankTheSpire/BlankTheSpire.dll
- research/build-output/blank-mods/BlankTheSpire/BlankTheSpire.pdb
- research/build-output/blank-mods/BlankTheSpire/BlankTheSpire.json
- research/build-output/blank-mods/BlankTheSpire/BlankTheSpire.pck

Command:

dotnet build ./research/upstream/BLANKthespire-compat/mod/BlankTheSpire.csproj --no-restore -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"

This proves compilation and sandbox packaging. It does not prove runtime loading because STS2 was not launched.

### Safety

- original BLANK checkout: clean at d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
- BaseLib source checkout: clean at v3.4.5, commit 22757933ba10adc4322a628519a233a567507d87
- ModAnalyzers source checkout: clean at commit 46c6a91ff24d47062d6b28cb734a8f855e1da0b6
- at the Stage 0C.2 checkpoint, live mods were unchanged; normalized before/after inventories matched and no BlankTheSpire directory was present
- at the Stage 0C.2 checkpoint, save files, game files, and unrelated mods were not modified
- at the Stage 0C.2 checkpoint, STS2 was not launched
- at the Stage 0C.2 checkpoint, Stage 0D had not started

## Stage 0D.1 controlled runtime result

Stage 0D.1 did not produce a clean runtime compatibility proof. No compatibility source was changed during the smoke test. The source was built from committed compatibility commit `8ff307d3eae4afbe111d91784b1bcff4f4dfe2af` and the staged files were hash-verified before installation.

BaseLib v3.4.5 loaded from the local mods directory and reported 280 successful patches with 0 failures. BLANK's manifest, DLL, and PCK were found. Its initializer then failed at `BlankTheSpireCode.Testing.AutoSlayEmbarkTimeoutPatch.TargetMethod()` with Harmony `System.Reflection.AmbiguousMatchException` for `MegaCrit.Sts2.Core.AutoSlay.Helpers.WaitHelper:Until`. The later `Finished mod initialization` line is not treated as a clean success because it follows that exception.

The game also reported `DuplicateModelException` for `CARD.TYPHOON`, already mapped to `RyoshuMod.Typhoon` and then requested by `Typhoon`. That error occurred with the existing workshop-heavy mod set and was not isolated from those mods. The runtime log also shows automatic `settings.save` writes and existing RitsuLib workshop update activity.

The local BaseLib and BLANK directories were removed after normal shutdown. The final local-mod inventory matched the pre-smoke baseline. No character, run, import, or BLANK settings/menu interaction occurred. Stage 0D.2 remains stopped pending explicit disposition of the initializer failure, the existing-mod startup conflict, and the save-write risk.

## Stage 0D.1.1 WaitHelper diagnosis and compatibility fix

Audit date: **2026-08-24**

Stage 0D.1.1 was completed as a non-launching diagnosis, minimal compatibility
patch, and sandbox rebuild. STS2 was not launched during this follow-up. The
original pinned BLANK checkout remained unchanged. The edit was made only in the
ignored compatibility worktree.

### BLANK target and previous failure

`AutoSlaySmokeHook.cs` defines a parameterless `[HarmonyPatch]` class,
`AutoSlayEmbarkTimeoutPatch`. Its `TargetMethod()` previously called the
name-only lookup:

```csharp
AccessTools.Method("MegaCrit.Sts2.Core.AutoSlay.Helpers.WaitHelper:Until")
```

The prefix is:

```csharp
private static void Prefix(ref TimeSpan? timeout, string? timeoutMessage)
```

It changes only the AutoSlay timeout whose message is `Room type not assigned`.
The previous Stage 0D.1 log showed Harmony failing while resolving this target
with `System.Reflection.AmbiguousMatchException`.

### Local overloads

Metadata inspection of the installed local `sts2.dll` found two public static,
non-generic `WaitHelper.Until` methods. Both return `Task` and both have four
parameters:

| Token | Signature | Optional parameters | Body evidence |
|---|---|---|---|
| `0x0600590A` | `Task Until(Func<bool> condition, CancellationToken ct, TimeSpan? timeout, Func<string> timeoutMessage)` | none | 79-byte async method body |
| `0x06005909` | `Task Until(Func<bool> condition, CancellationToken ct, TimeSpan? timeout, string timeoutMessage)` | `timeout = null`, `timeoutMessage = null` | 45-byte wrapper that constructs `Func<string>` and delegates to `0x0600590A` |

`TimeSpan?` is by value in both game methods. BLANK's `ref TimeSpan?` is a
Harmony prefix injection used to mutate the argument, not a claim that the
original game method has a by-reference parameter. The prefix's `string?` message
parameter matches the string overload, not the `Func<string>` overload.

The name-only lookup is therefore ambiguous on the current runtime. The correct
target is token `0x06005909`, the string overload that the prefix can receive.

Harmony's official documentation states that argument-type arrays are needed to
select among same-name overloads, and that a `TargetMethod` method can return the
exact `MethodBase`: [target-method annotations](https://github.com/pardeike/Harmony/wiki/Target-method-annotations), [patching](https://github.com/pardeike/Harmony/wiki/Patching), and the [HarmonyPatch API](https://github.com/pardeike/Harmony/blob/master/docs/api/HarmonyLib.HarmonyPatch.html).

### Minimal fix

The compatibility worktree now uses deterministic parameter matching:

```csharp
private static MethodBase? TargetMethod() =>
    AccessTools.Method(
        "MegaCrit.Sts2.Core.AutoSlay.Helpers.WaitHelper:Until",
        new[]
        {
            typeof(Func<bool>),
            typeof(CancellationToken),
            typeof(TimeSpan?),
            typeof(string)
        });
```

No prefix behavior, timeout value, AutoSlay flow, or unrelated patch was changed.

- Compatibility worktree: `research/upstream/BLANKthespire-compat`
- Branch: `experiment/current-sts2-compat`
- New commit: `7e5996fb2a16723684cb095951e97ba01e73fc69`
- Commit message: `fix: target current WaitHelper Until overload`
- Local Harmony assembly: `0Harmony, Version=2.4.2.0`

### Rebuild proof

The normal build command was run from the compatibility `mod` directory:

```powershell
dotnet build .\BlankTheSpire.csproj --no-restore -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
```

Result: exit code 0, 330 warnings, 0 errors. The rebuilt artifacts were written
only to the ignored `research/build-output/blank-mods/` directory:

- `BlankTheSpire.dll`, 437,760 bytes, SHA-256 `605219C5CF5A6799FBDCF4C11DB11422E6A989BB4ED7116FE9EABEB32633B4E9`
- `BlankTheSpire.json`, 296 bytes, SHA-256 `FCB94D79DA8477E48D478134C4EFACBD0478DB7070FBE383E4F0A576A80EA25F`
- `BlankTheSpire.pck`, 151,805 bytes, SHA-256 `C8F9F834D4AAB213023DBB19EC19EB8F95D3DECA6676B51ABB4B40CCA3D99351`

This proves that the deterministic target compiles against the local runtime. It
does not prove runtime loading until a future isolated smoke test is authorized.

### Isolation handoff

The local assembly audit found that STS2 applies source-aware `ModSettings` state
before calling `TryLoadMod`. The only explicit command-line key found was
`nomods`, which disables every mod and is not suitable for a two-mod test. No
per-mod CLI selector was found. The recommended future method is documented in
`docs/research/STS2_MOD_ISOLATION.md`. It requires an explicit settings backup,
controlled cloud-sync conditions, built-in per-mod disabling, and exact restore.
No settings or live mod state was changed during this follow-up.