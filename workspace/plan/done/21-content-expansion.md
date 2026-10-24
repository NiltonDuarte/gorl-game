# 21. Content expansion hooks

**Goal:** Keep later content additions data-driven and compatible with the core loop.

**Scope:** Identify extension points for additional streams, recurring jokes, trends, events, helper roles, collections, and cosmetics. Implement only the hooks needed to avoid coupling content to scene code.

**Depends on:** 02, 03, 05, 06, 10.

**Acceptance checks:** New content can be added without changing core simulation code; canon approval status is clear; later features remain out of the first playable path unless specifically promoted.

**Implemented:** Stream, moment, upgrade, helper, trend, and milestone definitions are grouped in a validated catalog. The scene and progression simulation consume catalog definitions, while stream approval status stays attached to the content entries.
