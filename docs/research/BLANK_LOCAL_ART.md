# BLANK Local Artwork Proof

Audit date: 2026-08-25

## Outcome

PASS. Runtime Strike displayed a PNG loaded from a normal local filesystem path
beside the test project. No network access was required.

## Source and runtime loading method

- Source worktree: `research/upstream/BLANKthespire-compat`
- Base BLANK commit: `7e5996fb2a16723684cb095951e97ba01e73fc69`
- Compatibility commit: `cb35c6348a48163207adbeb6ec26de6f94069245`
- Changed source files:
  - `mod/BlankTheSpireCode/Engine/CardSpec.cs`
  - `mod/BlankTheSpireCode/Engine/ForgedCards.cs`
  - `mod/BlankTheSpireCode/Engine/DataCard.cs`
- Runtime method: `art_path` is read from the forged card JSON. An absolute
  filesystem path is read with `System.IO.File.ReadAllBytes`, decoded with
  `Godot.Image.LoadPngFromBuffer`, and converted to a `Godot.ImageTexture`.
  The texture is exposed through a synthetic `res://` path with
  `TakeOverPath`, because STS2's card portrait API expects a resource path.
- The texture is held strongly for the runtime lifetime to match the existing
  BLANK Godot resource-loading pattern. Existing placeholder art remains the
  fallback when `art_path` is absent or invalid.

## Test data

- PNG: `research/build-output/0e/test-project/assets/runtime-strike.png`
- PNG SHA-256: `1F22CE84682FF6FDB2C98096BFC3D283EF1CE9A5CF2DB0F1C6DDC12737D0B5DB`
- Card JSON: `C:\Users\USER\AppData\Roaming\SlayTheSpire2\forged\characters\01\cards\01.json`
- Card JSON SHA-256: `D5CB0FD7F27B8A1446EBDA6392E1D2C88042D8A7504C2EE8775E19D6FD15DDB3`
- Card: Runtime Strike, cost 1, existing `damage: 11` definition unchanged.

## Runtime result

- BaseLib 3.4.5 initialized with 280 patches applied and 0 failed.
- BLANK initialized and loaded Runtime Test and Runtime Strike.
- The log recorded a successful local PNG load for the exact absolute path.
- The custom artwork was visible on Runtime Strike in combat. No network access
  was used.

## Errors

- Build: 0 errors and 330 existing warnings. DLL and PCK were produced.
- Runtime: one non-fatal old-style dependency manifest error was logged.
- Normal Godot shutdown emitted resource and RID leak diagnostics.
- No fatal runtime error, card-art load failure, or `[ForgedCardArt]` failure
  was recorded.

## Rollback

STS2 was closed normally. The rollback removed 22 extra user-data files and 5
extra empty directories, removed only the temporary `BaseLib` and
`BlankTheSpire` mod directories, and restored the verified baseline. All 294
user-data hashes matched, settings hashes were stable after 10 seconds, the
pre-existing `UnifiedSavePath` files matched, and the 53-directory Workshop
inventory was unchanged.

## Portable relative-path proof (Stage 0E.1)

Result: PASS. The same local artwork remained usable after the project was
moved and the original project location was unavailable.

- Stage 0E documentation checkpoint commit:
  `f21cc5518f67269b413f9f6ec9f60bd372632b90`
- Base BLANK commit:
  `7e5996fb2a16723684cb095951e97ba01e73fc69`
- Stage 0E.1 compatibility commit:
  `266871653767120db4978ff7c7d94dff1375dc3a`
- Stored card artwork value: `assets/runtime-strike.png`
- Original project root: `C:\Codex\STS2CharacterCreator\research\build-output\0e1\project-a`
- Moved project root: `C:\Codex\STS2CharacterCreator\research\build-output\0e1\moved\location\project-b`
- Original project available during the runtime proof: no
- Original absolute PNG path available during the runtime proof: no
- Project B PNG SHA-256:
  `1F22CE84682FF6FDB2C98096BFC3D283EF1CE9A5CF2DB0F1C6DDC12737D0B5DB`
- Project B card JSON SHA-256:
  `AD461F44F9AD050D89D6F05FAF6AA92D60CF49EBCA2BAF7769BEBD39EE34576B`

For a relative artwork value, BLANK combines the value with the physical
directory behind `user://forged`. The resolved runtime path was:

`C:\Codex\STS2CharacterCreator\research\build-output\0e1\moved\location\project-b\assets\runtime-strike.png`

Absolute filesystem paths and existing `res://` and `user://` paths remain
supported. The patch changed two source files, with 29 additions and 8
deletions. The build produced the DLL and PCK with 0 errors.

The runtime log recorded BaseLib initialization, BLANK initialization,
Runtime Test and Runtime Strike loading, and the resolved project-B path. The
user confirmed that Runtime Strike visibly displayed the custom artwork after
the move. No network access was required. The known non-fatal old-style
dependency-manifest error remained, with no fatal runtime or card-art error.

STS2 was closed normally. Rollback passed: all 294 user-data hashes matched,
settings and backup hashes were stable after 10 seconds, all 3 pre-existing
local-mod hashes matched, BaseLib and BLANK were absent, and all 53 Workshop
directories were unchanged.
