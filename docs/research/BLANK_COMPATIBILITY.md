# BLANK Compatibility Investigation

Status: **Stage 0C.2 complete as a bounded sandbox build proof**

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
- STS2: not launched
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
- live mods: unchanged; normalized before/after inventories matched and no BlankTheSpire directory was present
- save files, game files, and unrelated mods: not modified
- STS2: not launched
- Stage 0D: not started