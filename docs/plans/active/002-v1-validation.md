
# v1 Validation and Fix

Status: Complete with release blockers
Date: 2026-08-25

## Outcome

The v1 editor and data paths passed the focused validation checks. The release
candidate is NOT READY because MSI installation did not complete on this host,
the full native dialog-driven golden journey was not completed, and Play cannot
be tested without the compatible local STS2 runtime. No STS2 launch, save write,
game-file write, Workshop change, or runtime deployment was made in this
validation pass.

## Scope and safety

- Validated the existing Vite editor path with the Playwright CLI.
- Built the desktop executable and both Windows installers.
- Exercised native archive helpers with focused Rust tests.
- Used only ignored temporary paths under research/build-output/v1-validation.
- Did not install or download BaseLib, BLANK, KitLib, or any other runtime.
- Did not modify STS2 saves, game files, Workshop content, or unrelated mods.

## Findings

### P0

None.

### P1

- MSI installation is blocked on this host. Four isolated silent attempts,
  including attempts with verbose logging and the Windows Installer service
  running, left msiexec.exe clients hung before producing a log or files. The
  temporary clients were stopped. NSIS passed separately.
- The complete native golden journey is not proven. The browser path passed
  editor interaction, but native folder/file dialogs were not completed in
  this environment. The native path therefore still needs a manual run for
  open/save, PNG selection, portable export/import, close/reopen, and artwork
  preview confirmation.
- Play is blocked before launch. The live environment audit reports BaseLib
  undetected. The application’s user-facing detection state is Play setup
  required. No dependency was installed and no STS2 launch was attempted.

### P2

- The Vite development page requests /favicon.ico, which returns 404. This is
  non-fatal and is not part of the packaged desktop path.
- A full manual pass for forced colors, reduced motion, dark mode, and 200%
  scaling remains outstanding. Semantic labels, keyboard shortcuts, focusable
  controls, and the narrow 800x600 layout were checked.

## Fixes applied

- Portable import now rejects a non-empty destination without changing it.
- Added native tests for the empty-destination rule and Unicode/space-preserving
  archive round trips.
- Added saved-artwork preview reload after reopening a project folder.
- Added the character to global search.
- Extended the Delete shortcut to cards, relics, statuses, and basic editable
  collections.
- Marked potion, enchantment, stance, orb, and companion editors as
  Editor preview only and not yet playable or exportable.
- Removed BaseLib and BLANK names from the normal Settings status display.
- Added representative runtime-adapter assertions for character, card, upgrade,
  condition, status, and relic output.

## Validation evidence

- Browser golden editor path: passed for project/card naming, cost 1, base
  damage 11, upgrade damage 15, save, search, duplicate, rename, Delete,
  Ctrl+S, Ctrl+Z, Ctrl+Y, and detection messaging.
- Search result set includes character, cards, relics, statuses, and the basic
  editable collections.
- Unsupported collection warning is visible in the normal editor.
- Narrow 800x600 browser snapshot completed without missing semantic controls.
- npm run typecheck: passed.
- npm run build: passed.
- npm run test: passed, 3 tests.
- cargo test --manifest-path src-tauri/Cargo.toml --lib: passed, 2 tests.
- cargo check --manifest-path src-tauri/Cargo.toml: passed.
- npm run tauri build: passed. Fresh MSI and NSIS bundles were produced.
- The temporary PNG is research/build-output/0e/test-project/assets/runtime-strike.png.
  SHA-256: 3410999A1FEC30015335ADBFAB3B656AA44FE0011C08559B1EE7F66CFD946907.
- The isolated QA project JSON SHA-256 is
  B8585D7EF28340982EFF4909F175DCABD2224A8CC3B01CB63073DAE6CA4C5CD6.
- NSIS silent install, launch, and uninstall passed in an isolated directory.
  An external user-project marker survived uninstall.
- MSI validation was blocked by the Windows Installer hang described above.
- The application executable launched and responded from the freshly built
  release output. STS2 was not launched.

## Validation state

- Installer validation: NSIS passed; MSI blocked by host installer behavior.
- Golden user journey: partial, browser editor path passed; native file-dialog
  path remains unproven.
- Portable project integrity: native helper tests passed.
- Project safety: code review passed for malformed JSON handling, validation
  errors, stable IDs, reference errors, autosave, and non-empty import
  protection. Full native interaction remains pending.
- UI/UX review: partial, semantic editor path and narrow layout passed.
- Keyboard/accessibility: partial, Ctrl+S/Z/Y/K/F, Delete, labels, and focusable
  controls passed; full modality pass remains pending.
- Search coverage: passed for the required major editable entity groups.
- Runtime adapter: passed for the representative proven contract.
- Play and rollback: blocked before launch because the compatible local runtime
  is absent. No rollback was needed and no live data changed.
- Release candidate: NOT READY.

## Completion decision

The validation audit is complete, but the release candidate is blocked. Before
calling v1 ready, complete the native dialog-driven journey, resolve or retest
MSI installation on a supported Windows Installer context, and run Play through
the application only after the compatible runtime is deliberately installed
under the existing isolated rollback procedure.
