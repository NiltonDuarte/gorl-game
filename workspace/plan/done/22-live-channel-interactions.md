# 22. Live channel interaction loop

## Goal

Replace clip creation as the primary loop with a video-channel-style live interface where the player changes scenes and gives the streamer items.

## Scope

- Rework the main screen around channel identity, tabs, live player, chat, and audience stats.
- Add typed scene and gift catalogs, with each choice increasing exactly one streamer attribute.
- Add comfort, style, energy, and mood to game state; let their average influence idle view growth.
- Show a persistent gift visual on the character and reactions to scene and item actions.
- Migrate version 1 local saves into the new game-state shape.

## Acceptance

- The player can move Foodie Beauty between scenes and see one attribute increase.
- The player can send an affordable gift, see its item visual, and see one attribute increase.
- Channel views continue to accrue while active and offline.
- Existing version 1 views, fans, and content state survive migration.
- TypeScript and production build pass; scene and gift interactions are smoke-checked in the browser.

## Completion notes

Implemented in ticket 22. Each scene/gift catalog entry names one attribute and increase amount. Gifts spend views and persist the latest received item appearance. Save schema v2 migrates v1 saves with baseline attributes. The YouTube-inspired live channel layout, scene movement, item delivery, attribute growth, and persistence were checked in the browser; TypeScript and Vite production build pass.
