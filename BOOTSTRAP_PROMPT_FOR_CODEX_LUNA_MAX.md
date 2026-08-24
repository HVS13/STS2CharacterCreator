# Bootstrap Prompt for Codex Luna Max

Paste the following into Codex from the repository root after placing this starter pack there.

---

We are beginning Phase 0 of the STS2 Character Creator project.

Do not build the desktop application yet.

## Read first

Read these files in order:

1. `AGENTS.md`
2. `README.md`
3. `docs/STATUS.md`
4. `docs/product/PRODUCT.md`
5. `docs/product/MVP.md`
6. `docs/product/UX_PRINCIPLES.md`
7. `ARCHITECTURE.md`
8. `docs/research/THIRD_PARTY.md`
9. `docs/plans/active/000-phase-0-runtime-proof.md`

Treat the repository documents as authoritative project context.

## Goal for this task

Complete **Stage 0A only: Environment audit**.

Do not clone BLANK yet.
Do not install missing dependencies yet.
Do not initialize app frameworks.
Do not edit STS2 game files.
Do not modify save files or unrelated mods.

## Inspect and report

Determine, using safe local inspection:

- operating system
- current working directory
- Git version
- `dotnet --version`
- `dotnet --list-sdks`
- Steam installation path if detectable
- Slay the Spire 2 installation path if detectable
- path to `sts2.dll` if detectable
- STS2 mods directory if detectable
- whether BaseLib appears installed
- BaseLib version if safely detectable
- current STS2 version if safely detectable without modifying the installation

If something cannot be detected, say so. Do not guess.

## Repository changes allowed

Create:

`docs/research/ENVIRONMENT.md`

Update:

`docs/STATUS.md`

Do not modify other project files unless required to correct an objective factual error discovered during the audit.

## `ENVIRONMENT.md` should contain

- audit date
- OS
- Git
- .NET SDKs
- Steam path
- STS2 path
- `sts2.dll` path
- mods path
- BaseLib status
- STS2 version
- missing prerequisites
- exact commands used
- any uncertainty

Do not include secrets or unrelated personal filesystem information.

## Acceptance criteria

The task is complete only when:

1. `docs/research/ENVIRONMENT.md` exists.
2. Every requested environment item is either reported or explicitly marked undetected.
3. Missing prerequisites are listed without silently installing them.
4. `docs/STATUS.md` accurately reflects that Stage 0A is complete or blocked.
5. No STS2 save/game content was modified.
6. No application framework was initialized.

## Handoff

Return exactly these sections:

### Outcome
### Environment summary
### Changed files
### Commands run
### Missing prerequisites
### Risks or uncertainty
### Next recommended action

Do not start Stage 0B. Stop after the audit.
