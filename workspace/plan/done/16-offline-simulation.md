# 16. Elapsed-time simulation

**Goal:** Advance published clips and automation while the player is away.

**Scope:** Calculate elapsed time from saved timestamp, apply the same simulation rules as active play, and define a configurable offline cap.

**Depends on:** 09, 13, 15.

**Acceptance checks:** Returning after elapsed time grants expected views; active and offline calculations agree for equivalent elapsed time; long absences are bounded by the chosen cap.

**Implemented:** Offline catch-up calls the same one-second simulation as active play and caps elapsed time at 8 hours. A browser simulation check confirmed published-clip view growth during both active and offline intervals.
