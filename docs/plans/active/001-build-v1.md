# Build v1 STS2 Character Creator

Status: In progress

## Objective

Build the Windows-first local desktop editor described by the product and UX
documents. The normal workflow is create or open a project, edit content,
validate it, preview it, save it, export or import it, and press Play.

## Implementation sequence

1. Bootstrap the Tauri, React, TypeScript, Vite, Zod application shell.
2. Implement the canonical project model, folder persistence, autosave,
   migrations, recent projects, and portable `.sts2char` import/export.
3. Implement the stable editor shell with Character, Cards, Items, Mechanics,
   Presentation, and Settings navigation.
4. Implement character, card, upgrade, status, relic, artwork, localization,
   and supported-content editing with readable previews.
5. Add validation, safe references, delete warnings, undo/redo, search, and
   actionable empty and error states.
6. Implement the runtime adapter, setup detection, Play workflow, and concise
   troubleshooting output using the proven local runtime constraints.
7. Run fast type, unit, Rust, and production-build checks. Defer broad manual
   and in-game regression testing until the major v1 surface exists.

## Constraints

- Keep canonical data independent from BLANK JSON and runtime slots.
- Keep the core workflow offline and account-free.
- Store user assets inside the project and preserve them in portable export.
- Use semantic HTML and accessible controls. Do not hand-build complex widget
  semantics from generic elements.
- Do not add cloud services, telemetry, AI, arbitrary C# editing, or Workshop
  publishing.
- Do not copy BLANK source into the application.

## Substantial-v1 acceptance

The application launches, creates/opens/saves projects, imports/exports a
portable project with artwork, edits a character and cards, supports upgrades,
effects, conditions, statuses, relics, validation, references, undo/redo,
autosave, search, previews, and the Play workflow. Unsupported runtime areas
are clearly bounded and do not block the supported path.
