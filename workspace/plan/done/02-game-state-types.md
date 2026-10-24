# 02. Game state and domain types

**Goal:** Define the data model shared by simulation, UI, and saves.

**Scope:** Type streams, audience profiles, moments, clips, upgrades, helpers, trends, game state, and versioned save data. Keep runtime state separate from static definitions.

**Depends on:** 01.

**Acceptance checks:** Core entities have explicit types; IDs and references are consistent; game state can represent a fresh game and the planned first playable loop.
