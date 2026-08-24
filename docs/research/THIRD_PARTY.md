# Third-Party Research and Reuse Policy

This file tracks projects that may reduce the amount we need to build from scratch.

**Important:** License status must be verified again at the exact commit before copying or vendoring source.

Do not rely only on this research note for legal compliance.

## General policy

### Prefer

1. permissively licensed dependencies
2. adapters around upstream libraries
3. small, attributable copied components when they materially save work
4. independent implementation informed by public behavior/documentation

### Avoid

- copying minified browser bundles from closed-source products
- copying repositories with no explicit reusable license
- distributing decompiled STS2 source/assets
- coupling the canonical project model to a third-party framework

## Candidates

### BLANK the spire

Repository:

https://github.com/ryanrinkel/BLANKthespire

Why it matters:

- demonstrates a data-driven STS2 character runtime
- has a constrained contract/schema
- appears highly relevant to structured-data -> playable-character execution
- may contain runtime pieces worth adapting

Current research status:

- high priority for Phase 0
- verify exact license and preserve notices before reuse
- first prove the upstream mod builds unchanged
- do not adopt its schema as our canonical schema

### BaseLib-StS2

Repository:

https://github.com/Alchyr/BaseLib-StS2

Why it matters:

- common STS2 mod/content infrastructure
- likely appropriate as a dependency

Policy:

- prefer dependency use
- do not fork/vendor without a specific reason
- verify current license and compatible version before adoption

### sts2-mod-template

Repository:

https://github.com/sethmcleod/sts2-mod-template

Why it matters:

- working mod skeleton
- build/release/localization/assets patterns
- potential foundation for future standalone export

Policy:

- strong candidate for permissively licensed reuse
- verify license at pinned commit
- record copied paths and modifications

### STS2 Modding MCP

Repository:

https://github.com/elliotttate/sts2-modding-mcp

Why it matters:

- game inspection
- code generation
- build/deploy utilities
- automated development/testing ideas

Policy:

- selectively reuse or adapt only after exact license verification
- keep development tooling separate from the canonical project format

### AgentTheSpire

Repository:

https://github.com/cgxjdzz/AgentTheSpire

Why it matters:

- build/deployment helpers
- environment discovery
- packaging ideas

Policy:

- research candidate
- selectively reuse only after exact license verification

### RitsuLib

Repository:

https://github.com/BAKAOLC/STS2-RitsuLib

Why it matters:

- lifecycle/content/persistence/localization/compatibility helpers

Policy:

- optional integration
- do not make the project format depend on it
- verify license/version before adoption

### KitLib

Repository:

https://github.com/WRXinYue/STS2-KitLib

Why it matters:

- testing/debugging/browser/log utilities
- possible future developer/test bridge

Policy:

- optional development integration
- not a core runtime requirement

### MinionLib

Research candidate for advanced companions/minions.

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

- copy its minified/deployed JavaScript
- copy branding
- copy proprietary art/assets
- assume browser-delivered code grants reuse rights

If users provide exported project JSON, it may be analyzed for interoperability.

## Attribution inventory

When actual third-party source is adopted, add entries containing:

- upstream repository
- pinned commit/tag
- license
- local path
- copied/adapted files
- material modifications
- required notices
