# Third-Party Research and Reuse Policy

This file tracks projects that may reduce the amount we need to build from scratch.

**Important:** License status must be verified again at the exact commit before copying or vendoring source.

Do not rely only on this research note for legal compliance.

## General policy

### Prefer

1. permissively licensed dependencies
2. adapters around upstream libraries
3. small, attributable copied components when they materially save work
4. independent implementation informed by public behavior or documentation

### Avoid

- copying minified browser bundles from closed-source products
- copying repositories with no explicit reusable license
- distributing decompiled STS2 source or assets
- coupling the canonical project model to a third-party framework

## Verified upstream provenance

### BLANK the spire

Repository: https://github.com/ryanrinkel/BLANKthespire

Local research checkout: research/upstream/BLANKthespire

Pinned branch: main

Pinned commit: d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80

Remote: https://github.com/ryanrinkel/BLANKthespire

Checkout state: clean at the pinned commit. The checkout is ignored by the root .gitignore and is not tracked in this repository.

License file: LICENSE at the pinned commit

License: MIT License

Copyright notice: Copyright (c) 2026 Ryan Rinkel

Permissions: use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the original work without restriction.

Obligations: include the copyright notice and the MIT permission notice in copies or substantial portions of the work. Retain the warranty disclaimer and limitation of liability.

Scope note: the LICENSE file states that the MIT license covers the repository's original code and content only. Slay the Spire 2 and Mega Crit intellectual property is excluded. The repository describes itself as unofficial and says it does not include Mega Crit code, binaries, or copyrighted game data.

Reuse decision: no BLANK source was copied or vendored during Stage 0B. The repository is being used as a local, pinned research checkout only. Its schema is not adopted as the canonical project format.

Research findings:

- BLANK demonstrates a data-driven STS2 character runtime with fixed compiled shells and user-local JSON.
- It uses BaseLib, Harmony, and Godot .NET build tooling.
- Its runtime contract and fixed slot limits are documented in docs/research/BLANK_RUNTIME.md.
- Its source was inspected at the pinned commit. No upstream files were modified.

## Local experimental derivative

A compatibility derivative was created for Stage 0C.1 under the same BLANK MIT
license. It is not part of the parent repository history and was not pushed.

- path: `research/upstream/BLANKthespire-compat`
- branch: `experiment/current-sts2-compat`
- base commit: `d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80`
- license basis: BLANK MIT License at the pinned base commit
- tracking: ignored by the parent repository's `research/upstream/` rule
- original checkout: `research/upstream/BLANKthespire` remained clean

The derivative changed only these local experimental paths:

- `mod/BlankTheSpire.csproj`, BaseLib 3.2.1 to 3.4.5
- `mod/BlankTheSpireCode/Engine/DataCard.cs`
- `mod/BlankTheSpireCode/Engine/EffectRunner.cs`
- `mod/BlankTheSpireCode/Engine/TriggerRunner.cs`
- `mod/BlankTheSpireCode/Powers/ForgedBalancePower.cs`
- `mod/BlankTheSpireCode/Powers/ForgedCorruptionPower.cs`
- `mod/BlankTheSpireCode/Powers/ForgedRelic.cs`
- `mod/BlankTheSpireCode/Powers/ForgedStatusPower.cs`
- `mod/BlankTheSpireCode/Powers/SpikeSharpenPower.cs`

The source changes are a local API compatibility experiment. No source was
copied into this parent repository, no upstream file was modified, and the
BLANK schema/runtime contract was not adopted as the canonical project format.
If this derivative is ever distributed, retain the BLANK copyright and MIT
notices and review any non-BLANK dependencies separately.

## Candidates

### BaseLib-StS2

Repository:

https://github.com/Alchyr/BaseLib-StS2

Why it matters:

- common STS2 mod/content infrastructure
- likely appropriate as a dependency

Policy:

- prefer dependency use
- do not fork or vendor without a specific reason
- verify current license and compatible version before adoption

### sts2-mod-template

Repository:

https://github.com/sethmcleod/sts2-mod-template

Why it matters:

- working mod skeleton
- build, release, localization, and asset patterns
- potential foundation for a future standalone export

Policy:

- strong candidate for permissively licensed reuse
- verify license at a pinned commit
- record copied paths and modifications

### STS2 Modding MCP

Repository:

https://github.com/elliotttate/sts2-modding-mcp

Why it matters:

- game inspection
- code generation
- build and deploy utilities
- automated development and testing ideas

Policy:

- selectively reuse or adapt only after exact license verification
- keep development tooling separate from the canonical project format

### AgentTheSpire

Repository:

https://github.com/cgxjdzz/AgentTheSpire

Why it matters:

- build and deployment helpers
- environment discovery
- packaging ideas

Policy:

- research candidate
- selectively reuse only after exact license verification

### RitsuLib

Repository:

https://github.com/BAKAOLC/STS2-RitsuLib

Why it matters:

- lifecycle, content, persistence, localization, and compatibility helpers

Policy:

- optional integration
- do not make the project format depend on it
- verify license and version before adoption

### KitLib

Repository:

https://github.com/WRXinYue/STS2-KitLib

Why it matters:

- testing, debugging, browser, and log utilities
- possible future developer or test bridge

Policy:

- optional development integration
- not a core runtime requirement

### MinionLib

Research candidate for advanced companions and minions.

Policy:

- optional adapter only
- verify license obligations carefully before use
- do not copy into core without explicit review

### Slay Character Creator

Site:

https://slay.spencerstiles.com/

Use as:

- product behavior reference
- interoperability target
- UX inspiration
- exported-project research source

Do not:

- copy its minified or deployed JavaScript
- copy branding
- copy proprietary art or assets
- assume browser-delivered code grants reuse rights

If users provide exported project JSON, it may be analyzed for interoperability.

## Attribution inventory

When actual third-party source is adopted, add entries containing:

- upstream repository
- pinned commit or tag
- license
- local path
- copied or adapted files
- material modifications
- required notices
