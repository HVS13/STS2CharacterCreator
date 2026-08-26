# AI character format

## For AI authors

1. Read this document.
2. Copy `examples/ai-character`.
3. Modify the canonical project files.
4. Keep all assets inside the project.
5. Run `npm run character:build -- <folder>`.
6. Do not return a project as complete unless the command exits 0.
7. Give the user the generated `.sts2char`.

This is the current offline authoring contract. The canonical source is a folder
containing `project.json`. The `.sts2char` file is a portable ZIP-compatible
archive of that folder. Do not author BLANK JSON, runtime slot files, DLLs, or
PCK files directly.

## Project structure

```text
MyCharacter/
  project.json       required canonical project data
  manifest.json      optional metadata, must be valid JSON when present
  assets/            project-owned local artwork and other files
    card/
  .sts2cc/           editor-local data, not included by the CLI packer
```

Localization is currently stored in `project.json.presentation.locales`. A
separate `locales/` directory is not read by the canonical parser.

## Required canonical data

`project.json` must be a JSON object with no unknown fields. Its required root
fields are:

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Canonical schema version. |
| `id` | string | Stable project ID. |
| `name` | string | Project name. |
| `description` | string | Project description. |
| `createdAt` | string | Creation timestamp or other author timestamp. |
| `updatedAt` | string | Last update timestamp. |
| `character` | object | Character definition. |
| `cards` | array | Card definitions. |
| `relics` | array | Relic definitions. |
| `potions` | array | Potion definitions. |
| `enchantments` | array | Enchantment definitions. |
| `mechanics` | object | Statuses, stances, orbs, and companions. |
| `presentation` | object | Artwork, dialogue, and localization. |

The `character` object requires `name`, `description`, `maxHp`, `maxEnergy`,
`startingGold`, `cardPoolColor`, `startingDeck`, and `startingRelics`. It may
also contain `artworkAssetId`.

Each `startingDeck` entry is `{ "cardId": string, "count": number }`. Each
`cardId` must reference an item in `cards`. Each `startingRelics` value must
reference an item in `relics`.

Each card requires `id`, `name`, `type`, `rarity`, `cost`, `target`, `tags`, and
`effects`. It may contain `description`, `upgrade`, and `artworkAssetId`.
An `upgrade` has `effects` and may have `cost`. Base and upgrade effect arrays
must have the same length for the current editor validator.

Each relic requires `id`, `name`, `description`, `tier`, and `hooks`. Each hook
requires `id`, `trigger`, `oncePerCombat`, and `effects`.

Each potion requires `id`, `name`, `description`, and `rarity`. Each enchantment
requires `id`, `name`, `description`, and `effectText`.

Each status requires `id`, `name`, `description`, `emoji`, `isBuff`, `hook`,
`amount`, `decay`, and `singleStack`. Stances, orbs, and companions each use
`{ "id": string, "name": string, "description": string }`.

`presentation` requires `artwork`, `dialogue`, and `locales`. An artwork entry
requires `id`, `name`, `relativePath`, `kind`, and `mimeType`. A dialogue entry
requires `id`, `key`, and `text`.

## Enums

Use these exact values:

```text
card.type:        attack | skill | power
card.rarity:      basic | common | uncommon | rare | token
card.target:      self | enemy | allEnemies | none
effect.type:      damage | block | draw | gain_energy | heal | lose_hp |
                  apply_status | apply_custom_status | upgrade_card | retain |
                  innate | exhaust | ethereal | scry | gain_orb_slot |
                  channel_orb | summon
condition.type:   turn_at_least | target_has_status | has_block | no_block |
                  hp_below_half | hand_size_ge | draw_pile_empty
status.hook:      damage_dealt | damage_taken | block_gained | energy_gain |
                  card_draw
status.decay:     none | lose_one_eot | lose_all_eot
relic.tier:       starter | common | uncommon | rare | boss | shop
relic.trigger:    turn_start | turn_end | attacked | on_card_played |
                  combat_end | on_damage_dealt | on_block_gained | on_hp_lost
potion.rarity:    common | uncommon | rare
artwork.kind:     card | character | relic | status | other
artwork.mimeType: image/png | image/jpeg
```

## IDs and references

IDs must be non-empty and use only ASCII letters, digits, dot, underscore, and
hyphen. They must be unique across the project. Names may contain spaces,
Unicode, and punctuation.

The important references are:

- `character.startingDeck[].cardId` to `cards[].id`.
- `character.startingRelics[]` to `relics[].id`.
- `effects[].statusId` and `effects[].condition.statusId` to
  `mechanics.statuses[].id`.
- `character.artworkAssetId` and `cards[].artworkAssetId` to
  `presentation.artwork[].id`.

## Effects and conditions

An effect requires `id` and `type`. It may contain `amount`, `target`,
`statusId`, `condition`, and `cards`. Use a positive `amount` for numeric
effects. `cards` is one of `all`, `hand`, `discard`, or `draw`.

A condition requires `type` and may contain `value`, `statusId`, and `negate`.
Use `statusId` only with a status-aware condition or effect.

The same effect shape is used in card effects, upgraded card effects, and relic
hook effects. The runtime adapter translates this canonical data into its
bounded runtime vocabulary.

## Localization and assets

`presentation.locales` is a map from a locale code such as `en` or `en-US` to a
map of string keys and translated strings. The current CLI checks locale code
shape but does not require every key to be present in every locale.

Artwork must be project-owned. `relativePath` must use forward slashes, be
relative to the project folder, contain no `.` or `..` path segment, and point to
an existing file. The file extension must match `mimeType`. Absolute paths,
paths outside the project, missing files, and remote URLs are invalid.

For the current runtime proof, a card artwork reference is emitted as a
project-relative `art_path`. The current runtime does not require network access.

AI authors describe canonical gameplay concepts only. They do not select
BaseLib, RitsuLib, MinionLib, or KitLib in project data. The application resolves
internal capability requirements when preparing a runtime.

## Runtime support and editor-only data

The current BLANK adapter has proven support for character base stats, a
starting deck, cards with the effect vocabulary above, card upgrades, additive
statuses, turn conditions, a bounded starter relic, and project-relative card
artwork. The proven initial limits are 40 cards, 4 statuses, and 1 relic.

Potions, enchantments, stances, orbs, companions, character artwork, relic
artwork, status artwork, dialogue, and localization remain canonical data but
are not emitted by the current BLANK runtime adapter. They can be preserved in
the project and archive for future runtime support. The current editor also
preserves these fields.

## Validation and commands

The machine-readable schema is
`schemas/sts2-character-project.schema.json`. It is generated from the same
`ProjectSchema` used by the application. It is not a second canonical model.

Run commands from the repository root:

```bash
npm run character:validate -- <project-folder>
npm run character:pack -- <project-folder>
npm run character:verify -- <file.sts2char>
npm run character:build -- <project-folder>
```

`validate` parses the schema, checks references and local assets, and reports
warnings for data beyond current runtime limits. `pack` first validates and
creates a sibling `<project-name>.sts2char` archive. `verify` extracts the
archive into a fresh temporary folder, parses and validates it, checks references
and assets, checks runtime compatibility diagnostics, and deletes the temporary
folder. Exit code 0 means valid. Any `ERROR` produces a nonzero exit code.

`build` runs validation, packing, and fresh archive verification. A successful
run prints `PASS`, the created archive path, and
`Native import verification: PASS`.

Errors are concise and machine-readable, for example:

```text
ERROR cards[0].effects[1].statusId: Missing status reference: burning
```

## Example

`examples/ai-character` is a complete minimal project. It contains one
character, one starting card, one simple damage effect, and one local PNG at
`assets/card/ai-strike.png`. Use it as the starting template for external
authors.

## Current limitations

- The schema is version 1 and strict. Unknown project fields are rejected.
- The current runtime adapter has the bounded capacities listed above.
- Runtime support for the canonical editor-only sections is not implied by a
  successful archive build.
- The CLI does not contact the network and does not use BLANK's website or API.
