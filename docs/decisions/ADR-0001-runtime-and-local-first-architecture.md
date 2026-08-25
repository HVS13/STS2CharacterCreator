# ADR-0001: Runtime and Local-First Architecture

Status: Accepted  \
Date: 2026-08-25

## Context

Phase 0 tested the local runtime path against the installed STS2 build. The
proofs established that structured data can drive a custom character, cards,
upgrades, conditions, a custom additive status, and a relic trigger. A local
project-relative PNG was also displayed by a data-defined card. The runtime is
bounded by fixed compiled shells and a closed vocabulary, so it is useful as an
execution backend but is not a suitable canonical project format.

## Decision

We accept the following architecture:

- The product is a local-first desktop app.
- No mandatory login exists. Core editing works offline.
- Projects are user-owned local files.
- Portable projects contain project data and referenced local assets.
- The application owns the canonical project model.
- A BLANK-derived runtime is the initial execution backend.
- BaseLib is a runtime dependency, not part of the canonical model.
- Local artwork is stored and referenced by project-relative paths.
- Runtime-specific limits and slot details stay inside adapters and must not
  leak into the canonical schema or normal user interface.
- Standalone source or mod export is a later export adapter.
- Slay the Spire is an interoperability and UX reference, not a codebase to
  copy.

## Evidence

- Stage 0D proved structured card data changed observable combat behavior.
- Stage 0E.1 proved a project-relative local PNG remained usable after the
  project was moved.
- Stage 0F proved data-defined upgrade, condition, custom status, and relic
  behavior in one isolated runtime test.
- BLANK's fixed capacities and closed effect vocabulary remain explicit
  compatibility constraints.

## Consequences

The editor can present stable IDs, readable effect sentences, references, and
portable assets without coupling user projects to BLANK JSON. The runtime
adapter must validate capabilities, map canonical data into bounded runtime
slots, and report unsupported combinations clearly. The first Play workflow
can use the proven local runtime procedure while keeping deployment details
out of normal screens.

The initial v1 does not promise arbitrary STS2 mechanics. Unsupported systems
remain visible as bounded incomplete capabilities rather than forcing a broad
runtime redesign.
