# Architecture

Status: **Pre-implementation hypothesis**

This document describes the intended architecture direction. Phase 0 exists to prove or reject the most important assumptions before we commit to the application architecture.

## Product architecture

The target system has one canonical project representation feeding two execution paths.

```text
                Canonical Project
                       |
          +------------+------------+
          |                         |
   Instant Runtime             Standalone Export
          |                         |
 Generic STS2 runtime          Generate source/assets
 reads project data                  |
          |                      Local build
          |                         |
       Play fast              Independent STS2 mod
```

## Why two paths

### Instant runtime

The default authoring loop should prioritize:

- fast iteration
- offline use
- easy sharing
- minimal setup for casual users
- local artwork
- no compiler knowledge

A generic runtime may allow many edits to remain data changes rather than unique C# compilation work.

### Standalone export

Advanced users may eventually want:

- normal C# source
- an independent mod
- GitHub-hosted source
- manual extension
- release packaging
- Workshop publishing

That should be an export path, not a requirement for normal editing.

## Canonical project model

The canonical project model must be ours.

It must not be identical to:

- Slay Character Creator JSON
- BLANK's schema
- RitsuLib's models
- BaseLib classes
- generated C#

Those formats should be adapters around our model.

Expected high-level entities may include:

```text
Project
|- Character
|- Cards
|- Relics
|- Mechanics
|- Potions
|- Enchantments
|- Stances
|- Orbs
|- Companions
|- Keywords
|- Assets
|- Localization
```

Do not lock this schema until the runtime feasibility work gives us enough evidence.

## Project storage

Target principle:

> Project files are the source of truth.

A database may later exist for caches, indexes, or app metadata, but a user's project should remain understandable and portable as normal files.

Expected future forms:

### Folder project

Useful for Git, Syncthing, Dropbox, NAS, and manual editing.

```text
MyCharacter/
  project.json
  manifest.json
  assets/
  locales/
```

### Portable project

A ZIP-compatible custom container, tentatively:

```text
MyCharacter.sts2char
```

It should include project data and local artwork.

## Desktop application

Likely future stack, subject to post-Phase-0 confirmation:

- Tauri
- React
- TypeScript
- Zod
- Zustand or similarly small state layer

Do not initialize this stack during Phase 0.

## Runtime

Current hypothesis:

- adapt a permissively licensed data-driven STS2 runtime approach
- keep our schema separate from the runtime contract
- use adapters
- load project data from local files
- load local art where technically safe and reliable
- keep BaseLib as a dependency where appropriate rather than copying it

The runtime must report compatibility and useful errors in a form the future editor can map back to project entities.

## Effects and conditions

Long term, project logic should use a typed intermediate language rather than arbitrary C# as the primary representation.

Example conceptual form:

```text
If target has Poison:
    Deal 12 damage
Otherwise:
    Deal 7 damage
```

The same representation should eventually support:

- visual editing
- validation
- runtime execution
- generated descriptions
- C# generation
- balance analysis
- import/export adapters

Do not design the full language before runtime experiments establish real constraints.

## Compatibility

STS2 and community libraries can change.

Compatibility concerns should eventually be isolated behind explicit capabilities/profiles rather than scattered version checks.

Example future capabilities:

```text
supportsCustomOrbs
supportsCompanions
supportsMultiUpgrade
supportsCustomTargeting
```

## Architectural quality bar

The architecture is acceptable only if it supports these product properties:

- offline core authoring
- no mandatory account
- portable projects
- local artwork
- intuitive normal workflow
- deterministic validation
- recoverable errors
- future standalone export
- future import adapters
- future game-version compatibility
