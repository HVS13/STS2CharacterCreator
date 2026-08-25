# V1 Validation and Fix

Status: Complete with remaining Play and Steam Cloud rollback blockers
Date: 2026-08-25

## Outcome

The native editor journey, NSIS installer, and bundled runtime setup are
proven. The release candidate remains NOT READY. The single controlled Play
attempt launched STS2, but character selection showed `BLANK the spire` instead
of `QA Character`. No combat or card-damage proof was claimed. The local
filesystem rollback was exact and stable, but Steam Cloud retained a
post-test modded progress file, so remote rollback is not deterministic.

## Scope and safety

- Used the installed Windows desktop application, not browser/dev mode, for
  the native journey and Play attempt.
- Used only the pinned BaseLib 3.4.5 and BLANK compatibility artifacts from
  Phase 0.
- Enabled only the temporary BaseLib and patched BLANK runtime during Play.
- Did not change BLANK source, game installation files, Workshop content, or
  unrelated installed mods.
- Closed STS2 after the failed character-selection proof and stopped without
  retrying the controlled Play experiment.

## Findings

### Installer

- Direct release EXE launched and responded.
- NSIS installed successfully into an isolated directory, launched, and the
  existing uninstall check preserved an external user-project marker.
- MSI returned Windows Installer error 1925 in a non-elevated bounded test.
  An elevated control completed. MSI is host/admin-context dependent and is
  not the supported v1 distribution path.

### Native golden journey

PASS. The installed app completed New Project, QA Character, QA Strike, cost
1, base damage 11, upgrade damage 15, native PNG selection and preview, save,
close/reopen, edit, undo, redo, `.sts2char` export, import into a different
empty directory, reopen, and data/artwork confirmation.

### Runtime setup

PASS. The Settings Runtime control located STS2, verified build `24724944`,
installed the six pinned runtime files, and verified their exact SHA-256 bytes.
Repeating setup is idempotent. No manual BaseLib or BLANK preparation was
required by the user.

### Play

FAIL. The app performed validation, runtime generation, deployment backup,
temporary forged-data deployment, and Steam launch. The current STS2 log
reported BaseLib initialization, BLANK initialization, and a forged runtime
class/card load, but the visual character-selection result was `BLANK the
spire`, not `QA Character`. The required manual character proof therefore
failed before combat. QA artwork in Play was not claimed.

A source audit after the run found one confirmed adapter defect: BLANK expects
`starting_deck` entries with `slot`, while the app emitted `card`. The minimal
field correction is now in `src/lib/runtimeAdapter.ts`. The correction was not
retested in STS2 because the authorized one-shot Play proof had already been
used. Its causal relationship to the visual mismatch is not proven.

### Rollback

Local rollback PASS. After closing STS2:

- all 294 recorded user-data files matched baseline hashes, with no missing,
  extra, or changed files;
- the forged tree was restored to the pre-run `cards` directory only;
- the two settings hashes matched exactly:
  - `settings.save`: `2C79C018F26BCDF2A5A32018F1698CC7B872204CDDBCBF90A5B48938C9ECA12E`
  - `settings.save.backup`: `295448A054A30CB2D6F56AEC02EA54760799B16908A2AD713E325A0D4A2DC8EE`
- the three pre-existing local-mod file hashes matched;
- BaseLib and BlankTheSpire were absent after cleanup;
- all 53 Workshop directories matched by ID, file count, and byte count;
- STS2 remained stopped across two checks ten seconds apart.

Steam Cloud is not restored deterministically. Its local remote cache still
contains `modded/profile1/saves/progress.save` at 1,415 bytes with SHA-256
`29154828477516ACF33922601575440D3F12F5224D77BF2898CA2AD705FC6219`, while
the restored local baseline is 811 bytes with SHA-256
`C7E80BF9B220BC2828AEB8E8BBFEEAA4E421C2EA7B51D106249A71184CA0BE23`. No
further overwrite was attempted.

## Fixes applied

- Bundled the exact proven BaseLib and patched BLANK runtime files with
  third-party notices.
- Added idempotent setup, build-ID verification, and exact runtime hash
  verification.
- Added normal-user Runtime status and setup controls without exposing
  implementation names in the normal UI.
- Corrected the runtime adapter's BLANK starting-deck field from `card` to
  `slot`.

## Validation evidence

- `npm run typecheck`: passed.
- `npm run test`: passed, 3 tests.
- `cargo check --manifest-path src-tauri/Cargo.toml`: passed.
- `cargo test --manifest-path src-tauri/Cargo.toml`: passed, 2 tests.
- `npm run build`: passed.
- `npm run tauri build`: passed.
- Native screenshots and isolated installer/runtime artifacts are under the
  ignored `research/build-output/v1-validation` and `research/build-output/v1-release-check`
  directories.

## Validation state

- Installer: NSIS supported; MSI is optional and requires an elevated,
  host-dependent Windows Installer context.
- Native golden journey: PASS.
- Runtime setup: PASS.
- Play: FAIL, because QA Character was not visible in character selection.
- Rollback: local filesystem PASS; deterministic Steam Cloud rollback FAIL.
- Release candidate: NOT READY.

## Completion decision

Do not call v1 ready. Resolve the Play data-path/serialization mismatch and
establish a rollback policy that does not leave Steam Cloud with test-generated
state. Do not repeat the Play experiment in this task.
