# Gorl Reactor task plan

Tickets are split into small, reviewable units. Tickets 01–21 document the original clip-focused prototype; ticket 22 records the shift to live channel interactions. Refine upcoming work against the current product direction in the project README.

## Completed

- Tickets [01–14](done/) established the TypeScript/Phaser scaffold and the original clipping prototype.
- Tickets [15–21](done/) added local saves, offline progress, return recap, polish, responsive layout, pacing, and content expansion hooks for that prototype.
- [22. Live channel interaction loop](done/22-live-channel-interactions.md) replaced the clip desk with a video-channel interface and added scene changes, gifts, streamer attributes, and save migration.

## Current design decisions

- One live character: Foodie Beauty in a stylized sealing pose, labeled as fan art pending canon approval.
- Every scene change raises exactly one named streamer attribute; every gift also raises exactly one named attribute.
- Comfort, style, energy, and mood are capped at 100. Their average contributes to idle channel view growth.
- Views are the spendable resource; fans are based on lifetime views and represent lasting audience reach.
- Active and offline progress use the same simulation; offline catch-up is capped at 8 hours.
- Local saves use schema v2. The loader migrates v1 saves while preserving their existing channel progress.
- Scene and item descriptions are fictional placeholders until canon-approved content is added.

## Next refinements

1. [ ] Tune the view economy and gift prices around a first-session interaction.
2. [ ] Add more scene-specific animation and item reactions.
3. [ ] Decide how attributes affect audience responses and channel milestones.
4. [ ] Add explicit interaction and save-migration tests.
5. [ ] Review small-screen layout and reduced-motion behavior.
