# Phase 0: Runtime Feasibility Proof

Status: **Complete**

## Purpose

Prove or reject the core technical assumption before building the desktop editor.

## Hypothesis

A generic, data-driven STS2 runtime can load enough character/card/mechanic data from local files to support a fast, intuitive offline creator.

## Non-goals

This phase does not:

- build the final editor
- initialize Tauri/React
- design the complete project schema
- implement cloud features
- implement AI features
- implement Steam Workshop publishing
- chase full Slay feature parity

## Stage 0A: Environment audit

Determine:

- operating system
- Git version
- installed .NET SDKs
- Steam location
- STS2 installation path
- `sts2.dll` path
- STS2 mods directory
- existing BaseLib installation/version if present
- STS2 version if safely detectable

### Done when

A factual environment report exists and all missing prerequisites are explicitly listed.

Do not silently install missing tools.

## Stage 0B: BLANK audit

Clone upstream into a research-only location.

Read at minimum:

- README
- LICENSE
- install/build documentation
- runtime/mod source
- contract/schema source

Document:

- data flow
- character representation
- card representation
- effects
- conditions
- runtime registration strategy
- generic/precompiled slot strategy
- asset loading strategy
- dependencies
- build procedure
- important limitations
- useful reusable components

### Done when

`docs/research/BLANK_RUNTIME.md` exists and is specific enough to support an architecture decision.

## Stage 0C: Build upstream unchanged

Attempt the upstream-documented build before redesigning anything.

### Done when

One of these is true:

1. the upstream runtime builds successfully and output artifacts are identified, or
2. a precise external blocker is demonstrated with the exact command/error.

A speculative “probably works” is not sufficient.

## Stage 0D: Minimal playable data experiment

Create the smallest custom-data experiment possible.

Target:

- one custom character
- a valid starting deck
- at least one custom card
- card behavior observable in combat

Example test card:

```text
Heavy Bonk
Cost: 1
Deal 11 damage
```

### Done when

Changing structured data changes observable playable behavior without manually authoring a unique card class for that exact test card, or the limitation is proven.

## Stage 0E: Local artwork experiment

Test whether project-local PNG artwork can be loaded reliably enough for the intended workflow.

Target:

```text
test-project/
  character-data.*
  assets/
    portrait.png
    heavy-bonk.png
```

### Done when

Local artwork appears correctly in game from a project-local path or an equally portable approach is proven.

## Stage 0F: Runtime breadth experiment

Test enough behaviors to determine whether the runtime model is viable beyond trivial cards.

Minimum target:

- custom card
- upgrade
- custom status/mechanic
- relic
- conditional effect

### Done when

We know which capabilities are genuinely data-driven and which require generated/compiled code.

## Stage 0G: Scalability experiment

Investigate the runtime's concrete-type/precompiled-slot constraints.

Do not assume upstream limits are acceptable.

Test increasing capacity while measuring or observing:

- game startup behavior
- model registration
- memory where practical
- stability
- content lookup
- hard engine/runtime limits

Suggested initial probes:

- 8 characters x 64 card slots
- 16 characters x 128 card slots

Adjust if upstream architecture makes a different matrix more meaningful.

### Done when

We have enough evidence to choose one:

A. generic runtime is the default authoring path  
B. hybrid runtime + generated code is needed earlier  
C. compile-generated models must remain the default

## Final deliverable

Create an ADR for the runtime strategy.

Update:

- `ARCHITECTURE.md`
- `docs/STATUS.md`

Phase 0 is complete only after the architecture decision is based on runtime evidence.
