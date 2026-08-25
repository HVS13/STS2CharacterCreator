# BLANK Runtime Breadth Proof

Audit date: 2026-08-25

## Outcome

PASS. One isolated Runtime Test proved a data-defined upgraded card, a custom
status, a conditional effect, and a deterministic relic trigger in STS2.
No network access was required. No BLANK source change was required for this
stage.

## Checkpoint and runtime versions

- Stage 0E.1 documentation checkpoint: `62129febefba52f8963accbb6f0a6c136643c0a1`
- Patched BLANK compatibility source: `7e5996fb2a16723684cb095951e97ba01e73fc69`
- Verified BLANK compatibility artifact: `266871653767120db4978ff7c7d94dff1375dc3a`
- BaseLib: 3.4.5
- STS2: v0.111.0
- Runtime source change required: no
- Build for Stage 0F: existing verified DLL and PCK reused. No new build was needed.

## Test data

The isolated project data was placed under the normal forged-data path and
validated by a source-derived preflight before launch.

- Class: Runtime Test, 70 HP, 3 energy, four card definitions, six starting cards
- Runtime Upgrade: cost 1, base damage 6, normal `upgrade.effects` damage 12
- Runtime Smith: cost 0, upgrades all cards and draws one card
- Runtime Power: cost 0, `damage_dealt` additive status, 2 stacks
- Runtime Conditional: cost 1, damage 10 when `turn_at_least: 2`, retained
- Runtime Relic: `turn_start`, once per combat, gain 3 Block
- Conditional limitation: BLANK has no condition for whether the player has a
  custom status. The existing `turn_at_least: 2` condition was used and is
  recorded as such.

JSON SHA-256 values:

- `research/build-output/0f/artifact/project/characters/01.json`: `D7C0460D90BCF5803D1466BC390B4D6A86699BC0B68160886BB5193DCA6CD98D`
- `research/build-output/0f/artifact/project/characters/01/cards/01.json` Runtime Upgrade: `100275CDC896D81729100A5B487EAE9F711DCAF7062C6DE2343E12C747D7D592`
- `research/build-output/0f/artifact/project/characters/01/cards/02.json` Runtime Smith: `E9ECC0C7917D967767700F88DECD9BD1D193C981AE9C60D86708A5020966B52F`
- `research/build-output/0f/artifact/project/characters/01/cards/03.json` Runtime Power: `0D10E8E697CA56F21058672CE8EABEB592C55E0894E73D4126D7A1B0385292C1`
- `research/build-output/0f/artifact/project/characters/01/cards/04.json` Runtime Conditional: `74DED1DCDD9DBB08C77685BBC242B855E3C630A1FBFF21D2A9884AD9026D1F2B`
- `research/build-output/0f/artifact/RuntimeBreadthTest.bundle.json`: `7148E888D3437A76864D6B47F7D6847BCB69EAD7DB90B5E47BFA88A27DBB8FBE`
- `research/build-output/0f/artifact/metadata.json`: `FC6C073E3D53FF31BD5A8B5CCA106A52ECEAA4C83E6F2C3FB582F7C62DEBC54D`

## Manual runtime evidence

- Relic: at combat start, the player visibly had 3 Block. The trigger was
  configured once per combat and was observed once.
- Upgrade: the validated base definition was 6 damage. After Runtime Smith,
  Runtime Upgrade visibly displayed `Deal 12 damage.`
- Upgraded card execution: enemy HP changed from 44 to 32. Calculated damage
  was 12, matching the upgraded definition. No enemy Block was visible.
- Status: Runtime Power was played and the player visibly showed 2 stacks.
- Status-modified card execution: enemy HP changed from 32 to 18. Calculated
  damage was 14, equal to upgraded damage 12 plus the 2-stack status bonus.
- Conditional false branch: Runtime Conditional was played on turn 1. Enemy
  HP remained 18, matching the false condition.
- Conditional true branch: after ending turn, Runtime Conditional was played
  on turn 2. Enemy HP changed from 18 to 6. Calculated damage was 12, equal to
  conditional base damage 10 plus the 2-stack status bonus.
- The enemy name was not recorded in the manual evidence.

## Logs and errors

The preserved post-run log is:

`research/build-output/0f/log-after/godot.log`

- BaseLib initialized, applied 280 patches, and reported 0 failed patches.
- BLANK loaded Runtime Test and all four Runtime Test card definitions.
- No fatal runtime exception, `[Forged]` rejection, card execution error,
  status error, relic error, or model-load error was recorded.
- A non-fatal old-style dependency manifest error was logged because a
  dependency did not specify a minimum version.
- A non-fatal `Asset not cached: user://bts_emoji_status1_1.res` warning was
  logged.
- Normal Godot shutdown emitted RID, shader, texture, font, and resource-leak
  diagnostics. These occurred at exit after the proof and did not prevent any
  of the four runtime proofs.

## Rollback

- STS2 was closed normally after the last conditional proof.
- The test forged tree was removed and the saved original forged tree was
  restored. Its hashes were verified during rollback.
- Temporary BaseLib and BlankTheSpire directories were removed from the live
  STS2 mods directory.
- All 294 baseline user-data file hashes matched.
- `settings.save` hash matched `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`.
- `settings.save.backup` hash matched `295448A054A30CB2D6F56EA02EA54760799B16908A2AD713E325A0D4A2DC8EE`.
- All 3 pre-existing local-mod file hashes matched.
- BaseLib and BlankTheSpire were absent after rollback.
- All 53 Workshop directory IDs matched. No Workshop content was moved or
  deleted.
- STS2 was not running after verification.
