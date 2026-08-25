# BLANK Combat Proof

Audit date: **2026-08-25**

Status: **BLOCKED before combat.** Stage 0D.2B was executed under the explicit
controlled Steam-launch authorization. The test character was visible and
selected in character selection, and one run started. The first reachable map
node did not open combat after bounded input attempts. `Runtime Strike` was not
played, so the expected 11 damage was not proven.

## Scope and safety controls

- STS2 was launched normally through Steam.
- The enabled settings list contained only local BaseLib 3.4.5 and the patched
  BLANK build. The pre-existing `UnifiedSavePath` directory remained installed
  but disabled.
- Workshop subscriptions and Workshop directories were not changed.
- No STS2 installation files, unrelated mods, or application-framework files
  were modified.
- The test stopped on the map. No combat, card play, or continued run was
  performed.
- The game was closed normally before rollback.

## Test fixture

The fixture used BLANK class slot `01` and no custom artwork, relic, orb,
status, summon, or network input.

| Field | Value |
| --- | --- |
| Character | `Runtime Test` |
| HP / energy | 70 / 3 |
| Starting deck | One copy of class card slot 1 |
| Card | `Runtime Strike` |
| Card ID | `sts2cc_0d2b_runtime_strike_11` |
| Type / rarity / cost / target | attack / basic / 1 / enemy |
| Effect | exactly one `damage` effect with amount `11` |
| Class file | `user://forged/characters/01.json` |
| Card file | `user://forged/characters/01/cards/01.json` |
| Class-file SHA-256 | `53290EE1674DA225A9EABB12DA4BF71D8FBEDF7D9F395485372A89F39F41A3ED` |
| Card-file SHA-256 | `C35E779DA7253BDD9E2E8D01D9A8036A2475361CDC27CA157CB9D72B4DEFDDB1` |
| Bundle | `research/build-output/0d2b/artifact/RuntimeCombatTest.bundle.json` |
| Bundle SHA-256 | `FD8DCF42C8B110A28671D1836EA9DB08539B3D760DD3D77A2E9E53150B206815` |

The local preflight passed the exact minimum class/card contract and the
deterministic damage assertion before launch.

## Runtime loading and execution path

The compatibility source shows the following path:

1. `ForgedCharacters.TryParseClassJson` validates the class through
   `TryValidateCharacterDict`.
2. `ForgedCharacters.LoadCards` reads the class card path and calls
   `ForgedCards.TryParseCardJson` with `allowBasic: true` and
   `allowCustomOrbs: true`.
3. The validated card becomes a `CardSpec` for the precompiled class-card
   shell.
4. `EffectRunner.Execute` handles the `damage` operation, creates
   `CommonActions.CardAttack(card, play, hits)`, and awaits `atk.Execute(ctx)`.

The relevant source is in the ignored compatibility checkout:

- `mod/BlankTheSpireCode/Engine/ForgedCharacters.cs:193-225,237-255`
- `mod/BlankTheSpireCode/Engine/ForgedCards.cs:434-450`
- `mod/BlankTheSpireCode/Engine/EffectRunner.cs:50-113`

This source trace explains the expected behavior. It is not a substitute for
the missing live combat observation.

## Runtime result

The saved startup log recorded:

- BaseLib v3.4.5 loaded and applied 280 patches successfully, with 0 failures.
- BLANK loaded class slot 01 as `Runtime Test` with HP 70 and one starting-deck
  entry.
- BLANK loaded class card 01 as `Runtime Strike`.
- STS2 reported `RUNNING MODDED` with 2 enabled mods.
- The normal character-selection flow displayed `Runtime Test`. The user
  explicitly confirmed that it was visible and selected.
- A singleplayer run started with seed `6UK85T18LYRY`. The map opened and the
  first reachable normal enemy nodes were visible.

The final captured screen remained the map after the reachable-node attempt.
The evidence is under the ignored path
`research/build-output/0d2b/runtime/`, including
`after-character-confirm.png`, `after-tutorial.png`, and
`combat-entry-postmessage.png`.

There was no combat screen, enemy health bar, card hand, card-play event, or
damage result. Therefore this experiment does not claim that `Runtime Strike`
dealt 11 damage in live STS2.

The map-entry issue was reproduced after confirming foreground ownership for
the STS2 window. The bounded attempts used the existing click helper, a direct
Windows `SendInput` click, a two-click activation, Enter activation, and a
window-message click on the same first reachable node. None advanced the map.
A non-reachable second-row node was clicked during coordinate calibration, but no alternate route or run progression was activated.

## User-data impact

Normal startup and run setup writes occurred within the user-data root, as
authorized. The post-close inventory compared with the verified pre-test
inventory showed:

- 20 added files, including the temporary forged class/card, BLANK-generated
  emoji assets, a new session log, Sentry run files, and a shader-cache file.
- 5 older log/Sentry files absent after shutdown.
- 7 changed files, including the settings pair, the modded profile progress
  pair, the main log, and Sentry metadata/settings.
- No new run-save file appeared in the inventory.

The log also showed normal Steam Cloud remote-store writes. Remote cloud state
is not independently inspectable from this local audit.

## Rollback and verification

The verified backup set under
`research/build-output/0d2b/rollback/` was used after the game exited.

- All 294 pre-test user-data files were restored byte-for-byte.
- The 20 test-created user-data files were removed.
- The settings hashes returned to their pre-test values:
  `settings.save` =
  `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`.
  `settings.save.backup` =
  `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`.
- The modded profile progress files returned to their pre-test hashes.
- Temporary local `BaseLib` and `BlankTheSpire` directories were removed.
- The pre-existing `UnifiedSavePath` files matched all 3 baseline hashes.
- All 53 Workshop directory IDs matched the baseline inventory.
- The STS2 process was absent.
- A second settings/progress hash check 10 seconds later found no delayed
  Steam Cloud rewrite.

## Commands and evidence

The bounded helper commands were:

```powershell
pwsh -File .\research\build-output\0d2b\tools\combat-proof.ps1 -Action Create
pwsh -File .\research\build-output\0d2b\tools\combat-proof.ps1 -Action Inspect
pwsh -File .\research\build-output\0d2b\tools\capture-sts2-window.ps1 -ProcessId 5888 -OutputPath <capture>
pwsh -File .\research\build-output\0d2b\tools\click-sts2-window.ps1 -ProcessId 5888 -RelativeX 502 -RelativeY 560
```

PowerShell inventory commands enumerated and SHA-256 hashed the live user-data
root, local mods root, and Workshop directory root before and after rollback.
The game was closed with a normal Alt+F4 window action. The final comparisons
were exact and are preserved as ignored CSV inventories in
`research/build-output/0d2b/rollback/`.

## Disposition

Stage 0D.2B is blocked at map-to-combat entry. The data-defined character and
card load successfully, but the required live card behavior remains unproven.
Do not treat this as a passing combat proof or start a broader runtime test from
this result.
