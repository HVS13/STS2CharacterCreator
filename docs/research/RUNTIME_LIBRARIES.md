# STS2 Runtime Libraries

Audit date: **2026-08-26**

Status: the core BaseLib path remains proven. Optional-library runtime loading
is recorded as **untested** until a real STS2 load proof is completed.

## Policy

The canonical `.sts2char` format does not contain library IDs, package names, or
runtime-specific fields. The application derives internal capabilities and
resolves them to implementation libraries at Play or development time.

| Library | Role | Current pin | STS2 0.111.0 result |
| --- | --- | --- | --- |
| BaseLib | Required core | v3.4.5, `22757933ba10adc4322a628519a233a567507d87` | **Proven** with build `24724944` |
| RitsuLib | Optional advanced layer | v0.5.14, `8fca891d65de050b1848b9dc4e1fcc449dacf253` | **Untested** runtime load. DLL build passed |
| MinionLib | Optional minion, summon, and companion layer | v0.6.2 release commit `bdd8bcec4691b9974f5b47542f3f073b1448fd2b`; current source checked at `817eb721843354937021a312b55edf02544d000b` | **Untested** runtime load. Current source build passed, PCK was not produced |
| KitLib | Development and QA only | v0.33.0 release commit `9aaaa15cae03273d82ad6667f562cab473df1976`; current source checked at `ab43d0bf4fd9709f4b7bcb327b6778d2e7949d95` | **Untested** developer runtime load. Core build passed |

BaseLib is bundled because it is the required dependency of the existing
BLANK-derived runtime. RitsuLib, MinionLib, and KitLib are not bundled or
downloaded by normal Play. A required optional library must already be present
and detectable, otherwise Play reports that additional runtime components are
required.

## Install layout

The native detector checks only the local mod folder shape and manifest ID. It does not replace an optional folder.

| Library | Local folder | Manifest | PCK |
| --- | --- | --- | --- |
| BaseLib | mods/BaseLib | BaseLib.json | required |
| RitsuLib | mods/STS2-RitsuLib | mod_manifest.json | none |
| MinionLib | mods/MinionLib | MinionLib.json | required |
| KitLib | mods/KitLib | mod_manifest.json | none |
## Upstream findings

### BaseLib

- Repository: <https://github.com/Alchyr/BaseLib-StS2>
- License: MIT
- Manifest: `BaseLib.json`, with `has_dll: true`, `has_pck: true`, and no dependencies.
- The v3.4.5 source targets .NET 9 and its project declares C# language version
  14. The installed SDK accepted the focused build when `LangVersion=preview`
  was supplied.
- The focused source build passed with 0 errors and 1,117 existing compiler
  warnings. The application continues to use the already-proven bundled
  release files rather than this build output.

### RitsuLib

- Repository: <https://github.com/BAKAOLC/STS2-RitsuLib>
- License: MIT
- Release v0.5.14 and the checked current `main` commit are the same commit.
- Current source declares compatibility targets including `0.111.0` and uses
  a DLL-only `STS2-RitsuLib` manifest with no runtime dependencies.
- The DLL build against the local STS2 0.111.0 assemblies passed with 0 errors
  after the upstream manifest-generation target was skipped. The target failed
  under the installed SDK because its inline task loaded an incompatible
  `System.Text.Json` assembly. No upstream source was patched.
- No STS2 startup or RitsuLib initialization proof was performed.

### MinionLib

- Repository: <https://github.com/FuYnAloft/MinionLib>
- License: LGPL-3.0-only
- Release v0.6.2 documents STS2 public-beta `0.110.1`. The current source
  defaults to that reference version, although its core project compiled
  against the local 0.111.0 `sts2.dll` in the focused check.
- The core manifest declares both a DLL and a PCK and no additional runtime
  dependencies. Older BaseLib and RitsuLib adapter projects exist in the
  current checkout, but the v0.6.2 core does not require those adapters for
  the baseline.
- The focused core build passed with 0 errors. Godot was not available, so no
  PCK was exported. STS2 loading and a minion proof remain untested.

### KitLib

- Repository: <https://github.com/WRXinYue/STS2-KitLib>
- License: MIT
- Release v0.33.0 is the current release. The checked current source still
  pins its fallback beta references to STS2 `0.110.1`; its comments identify a
  constructor difference beginning in `0.111+`.
- KitLib core has no PCK and is marked as non-gameplay in its manifest. Its
  optional satellites and MCP tooling are not part of normal Play.
- The core build passed against the local game assemblies with 17 existing
  nullable-analysis warnings. Developer runtime loading was not performed.

## Capability resolution

The internal vocabulary is defined in
`src/lib/runtimeLibraries.ts`:

| Capability | Libraries selected |
| --- | --- |
| `core` | BaseLib |
| `advanced_runtime`, `custom_resources`, `advanced_hooks`, `custom_powers`, `orbs` | BaseLib + RitsuLib |
| `minions`, `summons`, `companions`, `minion_targeting` | BaseLib + MinionLib |
| Ritsu capability plus a minion capability | BaseLib + RitsuLib + MinionLib |
| `qa_automation` in development or test mode | KitLib only, unless core is also requested |
| `qa_automation` in normal Play | KitLib is reported as developer-only and is not staged |

The resolver expands dependencies, removes duplicates, and returns a stable
registry order. It reports `ready`, `missing`, `incompatible`, or `untested`.
An untested library never becomes a PASS result.

Current canonical projects derive only `core`, plus `orbs`, `companions`, or
summon capabilities when those gameplay concepts are present. This does not
make those future gameplay systems playable in the bounded BLANK adapter.

## Staging and rollback

Normal Play performs these operations:

1. Resolve the project capabilities.
2. Reject missing, incompatible, or untested required libraries.
3. Confirm the installed STS2 build is `24724944`.
4. Detect an already-installed optional library by its expected folder,
   manifest ID, and DLL. It is never overwritten by this path.
5. Snapshot only the existing local `BaseLib` and `BlankTheSpire` folders.
6. Install the bundled BaseLib and patched BLANK files.
7. Snapshot and replace the generated local `forged` data.
8. On rollback, restore the forged tree and the two staged runtime folders from
   the exact snapshots.

Unrelated local mods are not part of the snapshot. Workshop directories,
settings outside the staged runtime components, save data, and Steam Cloud are
not modified by the resolver or rollback code.

Optional libraries currently have no bundled artifacts in this repository. The
infrastructure therefore detects an existing compatible-shaped install and
reports missing components explicitly. It does not pretend that an untested
library is ready to play.

## Compatibility matrix

| Combination | Build | STS2 load | Status |
| --- | --- | --- | --- |
| BaseLib 3.4.5 + patched BLANK | Existing Phase 0 proof | Existing Phase 0 runtime proof | **Proven** |
| BaseLib + RitsuLib 0.5.14 | Ritsu DLL build passed | Not run | **Untested** |
| BaseLib + MinionLib 0.6.2 | Minion core build passed; PCK unavailable | Not run | **Untested** |
| BaseLib + RitsuLib + MinionLib | No combined artifact assembled | Not run | **Untested** |
| KitLib 0.33.0 developer environment | KitLib core build passed | Not run | **Untested** |

The matrix is intentionally conservative. A successful compile is not a
runtime compatibility proof.

## Focused commands

All commands were run from the repository root or from an ignored upstream
checkout. Output was written only to ignored `research/build-output` paths or
the normal dependency cache.

```text
dotnet restore research/upstream/STS2-RitsuLib/STS2-RitsuLib.csproj ...
dotnet build research/upstream/STS2-RitsuLib/STS2-RitsuLib.csproj -c Release --no-restore ... -p:Sts2ApiCompat=0.111.0 -p:RitsuLibSkipManifestGeneration=true
dotnet restore research/upstream/BaseLib-StS2/BaseLib.csproj ...
dotnet build research/upstream/BaseLib-StS2/BaseLib.csproj -c Release --no-restore ... -p:Sts2Path=<local STS2> -p:LangVersion=preview
dotnet restore research/upstream/MinionLib/MinionLib/MinionLib.csproj ...
dotnet build research/upstream/MinionLib/MinionLib/MinionLib.csproj -c Release --no-restore ... -p:Version=0.6.2
dotnet restore research/upstream/STS2-KitLib/src/KitLib.Core/KitLib.Core.csproj ...
dotnet build research/upstream/STS2-KitLib/src/KitLib.Core/KitLib.Core.csproj -c Release --no-restore ... -p:DeployToGame=false
npm run typecheck
npx vitest run src/lib/runtimeLibraries.test.ts src/lib/core.test.ts
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

No application-wide test suite was run. No upstream source was copied or
vendored, and no live STS2 installation was changed by these focused builds.
