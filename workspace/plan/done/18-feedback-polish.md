# 18. Moment and publishing feedback

**Goal:** Make key actions feel responsive and rewarding.

**Scope:** Add lightweight animation or visual feedback for snipping, publishing, view spikes, and purchases; sound remains optional and has a mute path if added.

**Depends on:** 07, 08, 09, 12.

**Acceptance checks:** Feedback corresponds to the action/result; it does not obscure counters or block input; reduced-motion and sound preferences are respected where applicable.

**Implemented:** Snipping, publishing, purchases, and larger view pulses show short feedback toasts. The single live character reacts to snips, publishing, and view spikes. Ambient and reaction motion respects `prefers-reduced-motion`; no audio was added.
