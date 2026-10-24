# 15. Versioned local save

**Goal:** Persist the game locally and recover safely from unusable data.

**Scope:** Serialize game state and last-active timestamp to localStorage; add a schema version, validation, and new-game fallback.

**Depends on:** 02, 09, 11, 12, 13.

**Acceptance checks:** State survives reload; malformed or missing data does not prevent starting; save version is explicit; persistence code is isolated from scenes.

**Implemented:** `localSave.ts` writes schema v1 saves, validates save envelopes and game-state data, handles storage failures, and reports malformed or unsupported saves. The scene auto-saves on a timer, state changes, page hide, and tab hide. Save and load behavior was checked in the browser; the TypeScript build passes.
