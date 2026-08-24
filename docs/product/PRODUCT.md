# Product Definition

## Working concept

A local-first visual creator for Slay the Spire 2 custom characters.

It should let people create, edit, play, export, import, and share character projects without needing programming knowledge or an online account.

## Primary user

A Slay the Spire 2 player who has an idea for a custom character but may have little or no modding experience.

The product must also remain useful to experienced modders.

## Core promise

> Create a character visually, use your own local artwork, play it locally, and share the complete project with a friend.

## Product principles

### Intuitive by default

Do not force users into a separate “beginner mode” merely because the system is powerful.

Instead:

- show common settings first
- reveal rare settings when relevant
- use normal game language
- keep actions near the objects they affect
- provide immediate previews
- prevent invalid states where possible

### Local first

Core use should not depend on:

- an account
- a hosted database
- a remote compiler
- telemetry
- an AI provider
- an internet connection

### User-owned files

Projects and artwork belong to the user and live on their machine.

### Fast feedback

Editing should feel immediate.

Where possible:

- preview changes instantly
- validate while editing
- make errors actionable
- keep the edit-to-play loop short

### Powerful without exposing plumbing

The app can internally handle:

- runtime deployment
- BaseLib
- mod folders
- game detection
- validation
- generated code
- packaging

The normal user should not need to understand those systems.

## Long-term capability areas

Likely areas include:

- character identity and stats
- cards and upgrades
- statuses/mechanics
- relics
- potions
- enchantments
- stances
- orbs
- companions
- lore/dialogue
- localization
- art/assets
- validation
- testing
- balance support
- import/export
- standalone source/mod export
- project diff/share

Feature breadth must not come before usability.

## Success test

A new user should be able to discover how to create a simple character and play it without requiring an external guide for the normal path.
