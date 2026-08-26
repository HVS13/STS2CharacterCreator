# ADR-0002: Capability-Driven Runtime Libraries

Status: Accepted  \
Date: 2026-08-26

## Context

The existing runtime path proves a bounded BaseLib and BLANK backend. Future
STS2 capabilities may be better implemented by specialized libraries, but the
canonical project format must remain portable and independent of those
libraries.

## Decision

- BaseLib is the required runtime core for the existing backend.
- RitsuLib is an optional implementation dependency for advanced capabilities.
- MinionLib is an optional implementation dependency for minions, summons, and
  companions.
- KitLib is development and QA tooling only. It is never a generated character
  runtime dependency and is never staged by normal Play.
- The application uses an internal capability vocabulary and one centralized
  registry to resolve transitive library requirements.
- Optional libraries are not fetched or overwritten by normal Play. An existing
  install is detected by its manifest and DLL. Missing or untested components
  are reported explicitly.
- Runtime staging snapshots and restores only the local components owned by the
  Play workflow. Unrelated mods, Workshop content, saves, and Steam Cloud are
  outside the rollback boundary.

## Consequences

Simple projects continue to use the existing BaseLib path. Future gameplay
systems can select implementation backends without adding third-party fields to
canonical project data. The resolver can report a high-level readiness result,
while diagnostics retain exact library and compatibility information.

Optional features remain unavailable until their specific library build and
runtime load are proven against the active STS2 build. A compile result alone is
not sufficient.
