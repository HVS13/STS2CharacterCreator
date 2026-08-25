# BLANK Character Discovery Proof

Audit date: **2026-08-24**

Status: **PASS for local discovery and registration.** The direct character-select visual was not captured because no safe local screenshot or UI-inspection mechanism was available. The source-backed visibility condition and clean startup evidence are recorded below. Stage 0D.2B was not started.

## Test character

The test used class slot `01` and no custom artwork, relic, orb, summon, status,
or network input.

| Field | Value |
| --- | --- |
| Contract/schema version | BLANK character JSON loader, current compatibility build; no separate character schema version field |
| Name | `Runtime Test` |
| Character ID | No character ID field exists in `CharacterSpec`; BLANK identity is the fixed class slot `01` |
| HP / energy | 70 / 3 |
| Starting deck | One entry: slot 1, count 1 |
| Card ID | `runtime_test_strike` |
| Card | `Runtime Test Strike`, attack, basic, cost 1, enemy target, damage 6 |
| Gold | No character-schema field; the normal game default was left unchanged |
| Class file | `user://forged/characters/01.json` |
| Class card file | `user://forged/characters/01/cards/01.json` |
| Encoding | UTF-8 JSON, compact, no BOM |
| Class-file SHA-256 | `9915DA5CEFC31D177DA3589F576F4F1D1055B8AB04DB0E37D0A19AD63343B753` |
| Card-file SHA-256 | `3A33295BAB96BA6321C31996F3F25A578BD75C887BE18E69DDB7BCFB19789C18` |

The workspace copy of the class bundle was also recorded at
`research/build-output/0d2a/artifact/RuntimeTest.bundle.json` with SHA-256
`FD7155152C82ED609C370BA59C7077C53ED113A0675968FA69197CBE534AE537`.

## Exact data pipeline

The source trace at the pinned BLANK checkout showed this pipeline:

1. The in-game import path accepts a `BTSC` code in `ForgeConfig.ImportClassCode`.
2. `ForgeConfig.ImportClass` calls `BTS1Codec.TryDecode`, which removes whitespace,
   checks the `BTSC` magic and vocabulary version, gunzips the payload, verifies
   CRC-32/IEEE over the raw UTF-8 JSON, and returns the class bundle JSON.
3. `ForgedCharacters.TryImportClassBundle` parses the bundle with `Godot.Json`.
   It requires a `character` object and a non-empty `cards` array, folds an
   optional top-level `relic` into the character, validates the character with
   `TryValidateCharacterDict`, validates every card with
   `ForgedCards.TryParseCardJson`, and checks every starting-deck slot against
   the bundle card count.
4. The importer serializes the validated character and each card with
   `Godot.Json.Stringify` and persists them through
   `ForgedCharacters.WriteClassFiles`.
5. The persisted paths are `ForgedCharacters.ClassPath(1)` and
   `ForgedCharacters.ClassCardPath(1, 1)`, which resolve to the two paths listed
   above. The class loader uses `TryParseClassJson` and
   `TryValidateCharacterDict`; the class-card loader calls
   `ForgedCards.TryParseCardJson` with `allowBasic: true` and
   `allowCustomOrbs: true`.
6. The generated `ForgedCharacterSlot01` shell reads
   `ForgedCharacters.SpecForClass(1)`, maps starting-deck slot 1 to
   `ForgedClass01Card01`, and returns `HideFromVanillaCharacterSelect =>
   Spec.IsEmpty`. A filled class therefore becomes eligible for the vanilla
   character-select model list without changing the generated shell.
7. STS2 model initialization registers the precompiled shell types. The runtime
   log then records the filled class and card before the main menu is reached.

The helper did not invoke the in-game importer because that would require
driving the mod settings UI. It generated the exact persisted JSON shape and
ran a source-derived minimum-contract preflight. BLANK's definitive Godot
validator ran at startup and accepted both files.

## Runtime result

- BaseLib v3.4.5 loaded from the local staged directory and reported 280 patches
  successfully, 0 failed.
- Patched BLANK loaded its DLL and PCK and finished initialization.
- The log reported `class 01 <- 'Runtime Test' (HP 70, deck 1 entries)`.
- The log reported `loaded 1 forged class(es)`.
- The log reported `class 01 card 01 <- 'Runtime Test Strike'`.
- `RUNNING MODDED` reported 2 enabled mods, 56 total entries.
- The main menu was reached in 15,924 ms.
- No `WaitHelper`, `MissingMethodException`, or `DuplicateModelException`
  failure appeared in the final captured log.
- Source and runtime evidence establish that the filled class is eligible for
  character-select registration. Direct visual confirmation of the `Runtime
  Test` label in the character-select screen was not safely available through
  the local tools, so it is not claimed here.
- No run was started, no character was embarked, and no combat was entered.

The remaining nonfatal findings were the old-style dependency manifest error, the
missing BLANK minimum-game-version warning, and unrelated missing placeholder
asset messages. None rejected the test character or prevented the main menu.

## User-data impact and rollback

Before writing, the complete `user://forged/` tree was inventoried and backed up
under the ignored `research/build-output/0d2a/rollback/forged/` path. It contained
only the pre-existing empty `forged/cards` directory. The settings pair was
backed up and hashed:

- `settings.save`: `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`
- `settings.save.backup`: `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`

After normal shutdown:

- the test class and card files were removed;
- the empty pre-existing `forged/cards` directory remained;
- all 12 BLANK-generated `bts_emoji_*.png` and `.res` files were removed;
- both settings hashes matched their pre-test values;
- the temporary BaseLib and BlankTheSpire local mod directories were removed;
- the original `UnifiedSavePath` local-mod inventory remained;
- all 53 Workshop directory IDs matched the pre-test inventory;
- no run-save file was found.

The game did automatically write existing modded profile/progress/preferences
files and reported a Steam Cloud overwrite during normal startup/shutdown. No
run was created or entered, but a strict byte-for-byte pre/post audit of those
gameplay-adjacent files was intentionally not performed because the task forbade
backing up or modifying gameplay saves. Remote Steam Cloud state is not locally
verifiable.

## Files and evidence

The ignored audit output contains:

- `research/build-output/0d2a/tools/character-proof.ps1`
- `research/build-output/0d2a/before/`
- `research/build-output/0d2a/rollback/`
- `research/build-output/0d2a/artifact/`
- `research/build-output/0d2a/runtime/godot.log`

No source patch was made to BLANK, and no application framework was initialized.
