# BLANK Runtime Analysis

Status: **Complete for Phase 0, Stage 0B local source audit**

Audit date: 2026-08-24

This report records the behavior of the pinned upstream checkout. A Stage 0C build
attempt is documented in docs/research/BLANK_BUILD.md. The attempt did not produce
a successful build or run. No source was copied from the checkout, and the checkout
itself was not modified.

## Upstream and provenance

Repository:

https://github.com/ryanrinkel/BLANKthespire

Pinned branch: main

Pinned commit:

d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80

Local checkout:

research/upstream/BLANKthespire

The checkout was clean at the pinned commit. The parent repository ignores
research/upstream/, so the upstream source is available for audit but is not part
of the project history.

## Evidence inspected

The conclusions below are based on these files and symbols at the pinned commit:

- mod/BlankTheSpire.csproj
- mod/Sts2PathDiscovery.props
- mod/BlankTheSpire.json
- mod/BlankTheSpireCode/MainFile.cs
- mod/BlankTheSpireCode/ForgeConfig.cs
- mod/BlankTheSpireCode/Engine/ForgedCharacters.cs
- mod/BlankTheSpireCode/Engine/ForgedCards.cs
- mod/BlankTheSpireCode/Engine/DataCard.cs
- mod/BlankTheSpireCode/Engine/EffectRunner.cs
- mod/BlankTheSpireCode/Engine/Conditions.cs
- mod/BlankTheSpireCode/Engine/BTS1Codec.cs
- mod/BlankTheSpireCode/Engine/RelicRunner.cs
- mod/BlankTheSpireCode/Engine/OrbRunner.cs
- mod/BlankTheSpireCode/Engine/SummonRunner.cs
- mod/BlankTheSpireCode/Cards/Forged/ForgedCardSlots.g.cs
- mod/BlankTheSpireCode/Cards/Forged/ForgedClasses.g.cs
- mod/BlankTheSpireCode/Powers/ForgedTriggerPower.cs
- mod/BlankTheSpireCode/Powers/ForgedStatusPower.cs
- mod/BlankTheSpireCode/Powers/ForgedOrb.cs
- mod/BlankTheSpireCode/Powers/ForgedSummon.cs
- mod/BlankTheSpireCode/Powers/ForgedSummonPower.cs
- mod/BlankTheSpireCode/Powers/ForgedRelic.cs
- mod/BlankTheSpireCode/Cards/Forged/ForgedSprite.cs
- mod/BlankTheSpireCode/Cards/Forged/ForgedSplash.cs
- mod/BlankTheSpireCode/Extensions/StringExtensions.cs
- mod/contract/VOCABULARY.md
- mod/contract/RELIC_VOCABULARY.md
- generation/btsgen/slotgen.py
- generation/btsgen/bts1.py
- README.md, INSTALL.md, and docs/plans/STS2_MOD_PLAN.md

The C# importer and runtime were treated as authoritative where generator comments,
legacy schemas, and contract prose differ.

## Build requirements

### Toolchain and dependencies

The mod project declares:

- .NET target framework net9.0.
- Godot.NET.Sdk/4.5.1 as the project SDK.
- Alchyr.Sts2.BaseLib version 3.2.1.
- Krafs.Publicizer version 2.3.0.
- Alchyr.Sts2.ModAnalyzers with an unpinned Version="*".
- BSchneppe.StS2.PckPacker version 0.1.1.
- 0Harmony.dll and sts2.dll resolved from the local STS2 data directory.

The project publicizes the sts2 assembly and references it without copying it to
the mod output. The game assembly is therefore a build-time prerequisite and must
match the installed game closely enough for the source to compile and load.

Sts2PathDiscovery.props discovers Windows Steam and STS2 paths from the Steam
registry/library and the STS2 uninstall registry key. It also supports explicit
MSBuild property overrides. The Windows data directory is
data_sts2_windows_x86_64, and the mods directory is <STS2>/mods/.

### Documented commands and outputs

The upstream README documents this mod build:

~~~~text
cd mod
dotnet build
~~~~

The expected outputs are BlankTheSpire.dll, BlankTheSpire.json, and a PCK
asset package. mod/tools/package_release.ps1 packages the deployed
BlankTheSpire files together with BaseLib files for installation.

Publishing requires a valid GodotPath. The project invokes Godot headless to
export the PCK during publish. The build file also copies DLL, PDB, JSON, and PCK
outputs into the discovered game mods directory. This means a normal build can
write into the installed game tree if the relevant target is enabled.

### Local prerequisite status

The Stage 0A environment audit found:

- STS2 and sts2.dll are detectable locally.
- No .NET SDK is installed or visible to dotnet.
- BaseLib was not detected in the installed STS2 mods tree.
- A compatible Godot .NET SDK and a usable GodotPath were not verified.

No dependency was installed and no BLANK build, restore, publish, or run was
attempted in Stage 0B.

## Runtime architecture and data flow

BLANK is a mod loaded into STS2. It is not a separate game runtime. Its data-driven
layer is placed behind precompiled C# model shells because the host model registry
and BaseLib bind content identity to concrete .NET types and pools during startup.

The observed flow is:

1. MainFile.Initialize is the mod entrypoint. It creates a Harmony instance,
   applies patches, registers the mod configuration, and prepares generated emoji
   icons. The compiled card, character, power, orb, summon, and relic shells are
   then available to the STS2/BaseLib model discovery path.
2. The in-game ForgeConfig.ImportClass action accepts a BTSC class code. The
   codec strips whitespace, checks the magic/version, decompresses the payload,
   verifies CRC-32, and returns JSON data. It does not execute code from the code.
3. ForgedCharacters.TryImportClassBundle requires a character object and a
   non-empty card array. It validates the character, checks starting-deck slot
   references, validates every card with the live ForgedCards validator, chooses
   a class slot, and writes class/card JSON under Godot user:// storage.
4. Optional relic data at the bundle root is folded into the character object.
   Optional splash_url, sprite_url, and relic_icon_url fields are handled by
   ForgedSplash as best-effort downloads. These are not needed for the data
   importer to accept the class.
5. A restart is required. On the next process, the generated shell types read the
   cached JSON through ForgedCharacters. The class shell creates its starting
   deck from slot references, and each card shell gets a CardSpec from its slot.
6. DataCard declares the host game's dynamic card variables and routes custom
   execution to EffectRunner. Trigger, relic, orb, summon, and custom-status
   shells route their data to specialized runners.

ForgedCharacters and ForgedCards load their JSON into cached dictionaries.
They do not provide live mid-run registration. New or changed files require a
restart, and model pools are effectively frozen after host initialization.

## Character representation

The runtime character record is CharacterSpec in
mod/BlankTheSpireCode/Engine/CharacterSpec.cs.

Its data includes:

- Name and Description.
- MaxHp, validated from 1 through 999.
- MaxEnergy, validated from 1 through 10.
- StartingDeck, an array of 1-based card slot and count pairs.
- HSV card-pool color values.
- OrbSlots, validated from 0 through 10.
- An optional ordered custom-orb pool.
- An optional custom-status pool of up to four entries.
- An optional summon pool of up to two entries.
- An optional single custom starter relic.

The class file is:

user://forged/characters/KK.json

Class card files are:

user://forged/characters/KK/cards/NN.json

The generated ForgedCharacterSlotKK shell is a
PlaceholderCharacterModel. It supplies HP, orb slots, starting deck, card pool,
relic pool, potion pool, localization, and character-select visibility from the
record. An empty class spec is hidden from character select. A class without a
custom relic receives BurningBlood.

The runtime character schema is slot-oriented, not ID-oriented. Starting-deck
entries refer to card positions in the bundle and not to arbitrary registered
card IDs. This simplifies importer ordering but is a coupling point for any
portable project format.

## Card representation

CardSpec in mod/BlankTheSpireCode/Engine/CardSpec.cs contains:

- ID, cost, card type, rarity, target, and ordered effects.
- An optional ordered upgrade effect list and optional post-upgrade cost.
- Optional title and description.
- X-cost and token flags.
- Optional declarative tags.
- An empty-slot marker.

The supported card types are attack, skill, and power. Supported rarities include
basic, common, uncommon, rare, and token. Card JSON is parsed into a spec, but
the actual host model is a concrete shell type. The shell constructor reads the
spec and DataCard supplies the shared behavior.

Standalone forged cards use user://forged/cards/NN.json. Class cards use the
class-specific directory above. Empty slots are hidden and do not enter reward
pools or the card library. Token cards are kept out of normal generation and the
compendium, and are used for special class mechanics such as the signature blade.

The card ID is useful for same-class references such as add_card,
transform_card, and graft_card. It does not remove the need for a concrete
compiled model type, because the host registry still binds the playable card to
its shell type and pool.

## Effects and actions

The hand-written interpreter is EffectRunner. The current supported card
vocabulary includes these groups:

- Core card behavior: damage, block, draw, apply_status, gain_energy,
  heal, lose_hp, exhaust, innate, retain, and ethereal.
- Orbs: gain_orb_slot, channel_orb, and evoke.
- Persistent engines and triggers: add_trigger, forge, and balance_step.
- Custom class content: apply_status_custom, summon, summon_attack,
  buff_summon, heal_summon, shield_summon, add_card, and
  summon_blade.
- Deck and hand operations: discard, scry, upgrade_card, purge,
  purge_card, transform_card, and graft_card.
- Other bounded mechanics: corruption and blade_empower.

The source also contains apply_custom and summon_spike exploratory or
hard-coded operations. They are not part of the normal LLM contract and should
not be treated as generic project primitives.

Supported amount scales include x, cards_in_hand, cards_retained,
unspent_energy_last_turn, forged, damage_dealt_unblocked,
target_debuff_count, and tag_cards_owned. Scales are restricted to specific
operations. For example, damage_dealt_unblocked is used for ordered lifesteal,
and forged adds the player's Forge counter to a damage or block value.

The importer applies structural limits before writing content. Important limits
include:

- at most one multi-hit damage effect per card;
- at most one calculated damage or block value per card;
- no duplicate dynamic-variable keys such as two independent damage values;
- at most one trigger power per card;
- compatible effect-count lists for base and upgrade versions;
- bounded add_card, balance_step, heal_summon, and shield_summon amounts;
- class-only operations require class card hosts and resolve names against the
  current class;
- trigger payloads use a narrower sub-vocabulary and cannot contain nested
  triggers or unsupported target/scale combinations.

The runners use STS2/BaseLib command paths for damage, block, draw, energy,
healing, powers, card piles, orbs, and pets. This is a runtime adapter, not a
general scripting VM. Unsupported operations are rejected by validation. The
executor also throws for an operation that reaches EffectRunner without a
supported case, which is why validation is a required safety boundary.

## Conditions

Condition is an optional single when predicate on an effect or trigger. The
current condition kinds in Conditions.cs are:

orbs_match, orb_count_ge, target_has_status, no_block,
hp_below_half, has_block, enemy_count_ge, turn_at_least,
hand_size_ge, retained_last_turn, forged_ge, draw_pile_empty,
hp_lost_ge, light_ge, dark_ge, and centered.

Each condition has a kind, optional numeric value, optional status, and a
negate flag. Card-play conditions may use card and target context. Trigger and
relic conditions are evaluated at fire time with no selected target, so their
allowed condition subset is narrower. There is no general boolean condition tree
or explicit AND/OR composition. A card effect gets one condition object.

## Statuses and custom mechanics

Base status application is a closed list of STS2 powers, including the standard
buffs and debuffs such as Strength, Dexterity, Vulnerable, Weak, Frail, Poison,
Focus, Block-related powers, and temporary stat variants. The exact list is in
ForgedCards.SupportedStatuses and the status switch maps in the runners.

Custom class statuses are CustomPowerModel shells. A class can declare up to
four. The pinned implementation supports additive modifiers for one hook per
status:

- damage_dealt
- damage_taken
- block_gained
- energy_gain
- card_draw

Custom statuses can be counter or single-stack and can decay by losing one stack
or all stacks at the end of the owner's turn. Multiplicative modifiers, hit-count
modifiers, and reactive custom-status hooks are not supported by this runtime
version. Emoji text is rendered into a runtime icon resource.

No separate stance or form model was found in the runtime or contract. A class
can approximate a mode swap through the class-only transform_card primitive,
but that is a permanent run-deck card transformation, not a first-class stance
state.

## Relics

RelicSpec is a class's optional single starter relic. Each class has one
precompiled relic shell. A class with no forged relic uses BurningBlood.

Relic hooks support turn_start, turn_end, attacked, on_exhaust,
on_card_played, combat_end, on_card_drawn, on_damage_dealt,
on_block_gained, and on_hp_lost. Hooks can have a fire-time condition, a
target of self, enemy, all enemies, or attacker where valid, and a
once_per_combat gate.

Relic effects are a restricted no-card subset: damage, block, draw, energy,
heal, lose HP, base status application, Forge, class orb channeling, and class
summoning. Relic modifiers support max_energy, first_attack,
cost_reduction, and start_combat_block. combat_end is restricted to heal.

The runtime parser currently reads the relic name, ID, description, tier, hooks,
and modifiers. The contract prose also describes an icon_emoji field, but the
C# TryParseRelic path does not retain that field in RelicSpec. The runtime
instead uses a cached relic_icon_url PNG when available and falls back to the
shipped relic placeholder.

## Orbs, stances, and companions

### Orbs

A class can declare an ordered orb pool containing base lightning, frost, or
dark entries and up to three custom orb definitions. Custom orbs have passive
and evoke effect lists, passive/evoke headline values, a hue, and a description.
The class also declares its starting orb slots. random is resolved within the
class pool, not the global orb pool.

Orb effects are restricted to damage, block, draw, gain energy, heal, gain orb
slot, channel orb, and base status application. Damage and block are Focus-scaled.
Custom orb art is not shipped. The runtime draws a procedural colored circle for
the HUD and borrows the Lightning icon for the hover fallback.

### Companions

The runtime calls these summons, not companions. A class can declare up to two
custom summon definitions. A summon has a maximum HP, an optional move cycle,
an attackable flag, optional on_summon actions, and optional enemy-facing
on_death actions.

Summons are compiled CustomPetModel shells with a shared
ForgedSummonPower. The power runs the move cycle at the end of the player's
side, and SummonRunner executes attack, block, status, and self-heal actions.
The class's card actions can summon one living minion, grow its maximum HP,
buff it, heal it, shield it, or attack through it. An existing living summon is
reused rather than creating an unrestricted second copy. Normal summon visuals
borrow the shipped Osty visual. attackable: false produces an ethereal ally
with no normal HP-bar interaction.

## Assets and packaging

The PCK contains the mod's shipped placeholder assets and localization. The
repository includes generic card portraits by card type, generic power and relic
icons, character-select placeholders, energy icons, and the mod image. The
StringExtensions helpers resolve them under res://BlankTheSpire/images/ and
fall back to generic images when a requested resource does not exist.

The runtime does not expose a general local file path for a class's card artwork.
Class card descriptions and titles are injected in code, and card portraits use
the shipped type-based placeholders. Custom statuses use rendered emoji icons.
Custom orbs use procedural color art. Custom summons borrow Osty visuals.

Optional class art is downloaded during import from URL fields and cached as:

- user://forged/characters/KK/splash.png
- user://forged/characters/KK/sprite.png
- user://forged/characters/KK/relic.png

Downloads are synchronous and best-effort. A failed download does not reject the
class, but this path is not offline. The core class/card JSON path remains local
after import. A future local-first creator should not copy this URL-only art
assumption as its asset model.

## Generic and precompiled slot strategy

The generated source and constants establish these capacities:

| Resource | Capacity | Source evidence |
| --- | ---: | --- |
| Standalone forged card slots | 40 | ForgedCards.SlotCount, ForgedCardSlots.g.cs |
| Forged character slots | 4 | ForgedCharacters.ClassCount, ForgedClasses.g.cs |
| Cards per forged class | 40 | ForgedCharacters.CardsPerClass, ForgedClasses.g.cs |
| Custom orbs per class | 3 | ForgedCharacters.MaxCustomOrbs, slotgen.py |
| Custom statuses per class | 4 | ForgedCharacters.MaxCustomStatuses, slotgen.py |
| Custom summons per class | 2 | ForgedCharacters.MaxSummons, slotgen.py |
| Custom relics per class | 1 | ForgedCharacters.MaxRelics, slotgen.py |

The class path therefore has 160 compiled card shells across four classes, plus
four character shells and the corresponding trigger, orb, status, summon, and
relic shells. The standalone 40-card pool is separate from the per-class pools.

The reason is a host-engine constraint, not just a convenience choice. The
upstream plan records that BaseLib binds card identity to the concrete .NET type,
and that the host model/pool lists are computed during ModelDb.InitIds. The
generated shells provide one stable type per possible runtime identity while
keeping behavior in shared data interpreters. This is the most important design
pattern in BLANK, and also its hard capacity limit.

## Serialization and portability

BLANK defines two code kinds:

~~~~text
BTS1.<vocabVersion>.<base64url(gzip(json))>.<crc32>
BTSC.<vocabVersion>.<base64url(gzip(json))>.<crc32>
~~~~

The current vocabulary version is 39. The checksum is CRC-32/IEEE over the raw
UTF-8 JSON bytes. The class payload has this shape:

~~~~json
{
  "kind": "class",
  "character": { "...": "..." },
  "cards": [ { "...": "..." } ],
  "relic": { "...": "..." }
}
~~~~

The top-level relic member is optional and is folded into the character before
validation. Cards are stored in array order and starting-deck entries refer to
that order. The Python bts1.py helper assembles the same shape from the
KK.json plus KK/cards/NN.json layout.

This is a portable import code, not a canonical project file. It is bounded by
the current vocabulary version and slot counts, uses positional card references,
and writes into Godot's per-user data directory. It does not define a portable
project package containing arbitrary local assets.

## Validation, errors, and failure behavior

The codec rejects empty, malformed, unknown-magic, bad-version, decompression,
and checksum failures with human-readable errors. Codes newer than the runtime's
vocabulary version are rejected before payload validation.

The class importer rejects invalid JSON, wrong root types, missing character or
card arrays, empty bundles, more than 40 cards, invalid character ranges, invalid
starting-deck references, and any card that fails the live vocabulary validator.
It validates the complete bundle before writing it. Re-importing a class clears
stale card files for the selected class slot before writing the replacement set.

At startup, malformed or out-of-range card and class files are skipped and logged.
Missing files produce empty hidden slots. Unknown same-class card, orb, summon, or
status references generally log a warning and no-op at execution time. This is a
useful resilience boundary for bad data, but it also means a class can be accepted
with a runtime mechanic that silently does nothing when a referenced name is not
present.

## Reusable components and coupling assessment

No component was copied. These are the strongest candidates for a future adapter
or independent reimplementation:

| Upstream path | Role | Reuse value | Coupling and test status |
| --- | --- | --- | --- |
| mod/BlankTheSpireCode/Engine/EffectRunner.cs | Ordered effect interpreter over STS2 commands | Best reference for a bounded data-to-action runtime | High coupling to STS2 internals, BaseLib, and current APIs. Not built or tested in this audit. MIT notice required if copied. |
| mod/BlankTheSpireCode/Engine/ForgedCards.cs and CardSpec.cs | Card parsing, vocabulary, text synthesis, and structural safety checks | Good reference for a closed contract and graceful empty-slot behavior | The vocabulary is BLANK-specific and changes with its runtime. Prefer an adapter or independent model. MIT notice required if copied. |
| mod/BlankTheSpireCode/Engine/Conditions.cs | Small predicate evaluator with card and fire-time contexts | Reusable shape for explicit, bounded conditions | Coupled to STS2 combat state and BLANK's one-condition model. No tests run here. MIT notice required if copied. |
| mod/BlankTheSpireCode/Engine/BTS1Codec.cs | Versioned, checksummed data-only import code | Small and low-risk protocol reference | Portable primitives, but the version and payload shape are BLANK-specific. Reimplementing is likely safer than coupling. MIT notice required if copied. |
| generation/btsgen/slotgen.py and generated Cards/Forged/*.g.cs | Fixed generic shell generation | Direct evidence for the precompiled-slot strategy | Strong coupling to BaseLib type identity and current slot counts. Treat as research, not canonical project code. MIT notice required if copied. |
| mod/BlankTheSpireCode/Engine/ForgedCharacters.cs | Class file store, bundle validation, slot allocation | Useful reference for restart-based import and bounded class storage | Strong Godot/STS2 coupling and writes to user://; not suitable as the creator's canonical storage layer. MIT notice required if copied. |
| mod/BlankTheSpireCode/Cards/Forged/ForgedSprite.cs and ForgedSplash.cs | Placeholder and imported-art handling | Shows a fallback-first presentation path | URL download, Godot nodes, and non-portable user:// cache make direct reuse unsuitable for offline authoring. MIT notice required if copied. |

The most reusable component is the separation between a closed declarative
specification, one validator, and one ordered interpreter. The concrete STS2
commands and model shells should remain behind a project-owned adapter boundary.

## Biggest limitations relevant to this project

1. Capacity is fixed at four classes and forty cards per class. Raising it means
   regenerating and shipping more concrete model types.
2. Content identity is coupled to BaseLib and concrete .NET types. The runtime is
   data-driven only inside the precompiled shell set.
3. The effect vocabulary is intentionally closed. Arbitrary mechanics, native
   stance state, and unrestricted actions are not available without new code.
4. Custom statuses are additive-only, custom orb art is procedural, summon art is
   borrowed, and class card art has no general local-file path.
5. Optional art import uses network URLs, which conflicts with a strict offline
   workflow even though the core JSON import is local.
6. Imported content is stored in Godot user:// files and requires restart. The
   BTSC code is not a user-owned project package with embedded assets.
7. Build reproducibility is weakened by the unpinned ModAnalyzers package and by
   the dependency on the installed STS2 assemblies.

## Recommendation

BLANK proves that a bounded data-driven character runtime is plausible for STS2,
but it does not prove that an unrestricted visual creator can avoid compiled
capacity planning. Preserve the fixed-shell finding as an architecture constraint.

Do not copy BLANK source or adopt its JSON as the canonical project format. Stage 0C
attempted the unchanged build with the .NET 9 SDK available, while leaving Godot
uninstalled and directing ModsPath to a sandbox. The attempt failed during C#
compilation against the installed STS2 assembly. See docs/research/BLANK_BUILD.md
for the exact errors and safety verification.

## Stage 0D.2A persistence trace and discovery proof

The local source trace and isolated runtime proof confirm the exact character data path:

- `ForgeConfig.ImportClass` accepts a class code, calls `BTS1Codec.TryDecode`, and passes the decoded JSON to `ForgedCharacters.TryImportClassBundle`.
- `TryImportClassBundle` parses the bundle with `Godot.Json`, validates the character through `TryValidateCharacterDict`, validates each card through `ForgedCards.TryParseCardJson`, then serializes the validated dictionaries with `Godot.Json.Stringify` and writes them with `ForgedCharacters.WriteClassFiles`.
- `ForgedCharacters.ClassPath(1)` is `user://forged/characters/01.json`.
- `ForgedCharacters.ClassCardPath(1, 1)` is `user://forged/characters/01/cards/01.json`.
- Startup `ForgedCharacters.LoadClasses` calls `TryParseClassJson` and `TryValidateCharacterDict`. Startup `ForgedCharacters.LoadCards` calls `ForgedCards.TryParseCardJson` with basic cards allowed for class starters.
- The generated `ForgedCharacterSlot01` shell reads the loaded spec, maps starting-deck slot references to `ForgedClass01CardNN`, and hides only when `CharacterSpec.IsEmpty` is true. A filled class is therefore eligible for the model database and vanilla character-select list.

The complete `user://forged/` path inventory from source is:

- `user://forged/characters/KK.json`, the class definition;
- `user://forged/characters/KK/cards/NN.json`, the class-local card definitions;
- `user://forged/characters/KK/splash.png`, optional imported select background;
- `user://forged/characters/KK/sprite.png`, optional imported standing sprite;
- `user://forged/characters/KK/relic.png`, optional imported relic icon; and
- `user://forged/cards/NN.json`, the separate standalone forged-card pool.

No metadata or cache file path under `user://forged/` appeared in the source; the BLANK emoji cache is outside that tree.

`ForgedSplash.TryCacheFromBundle` is the writer for the three optional class-art
files. It performs synchronous URL downloads and was not called by the local
proof. BLANK also writes emoji cache files outside this tree as
`user://bts_emoji_{key}.png` and `user://bts_emoji_{key}.res` during mod startup.

The Stage 0D.2A test wrote a minimum `Runtime Test` class and one basic attack
card into class slot 01. The startup log reported the class and card as loaded,
then reached the main menu with local BaseLib v3.4.5 and BLANK enabled. No run or
combat was entered. The direct character-select visual was not captured, so the
source-backed `HideFromVanillaCharacterSelect` eligibility and loader evidence
are recorded as the registration proof, not as a visual screenshot.
