# Gorl Reactor

A browser based idle game about tuning in to Foodie Beauty’s live channel and helping shape the stream. Move her between cozy scenes, send food and outfit gifts, and watch comfort, style, energy, and mood affect channel growth.

## Current game loop

1. Check the live channel and its chat.
2. Move the streamer to a scene; each scene raises one named attribute.
3. Spend channel views on a gift; each item raises one named attribute and appears on the stream character.
4. Let the channel keep earning views while you watch or are away.
5. Track fans and the four attributes, then choose how to shape the next stream.

The interface takes cues from a video channel page, with channel identity and tabs, a live player, chat, audience stats, and interaction controls. The character is a single stylized Foodie Beauty fan-art placeholder in the sealing pose. Stream scenes and gifts are fictional placeholders pending canon approval.

## Technology

- TypeScript for domain types, content data, simulation, and persistence.
- Phaser for the channel interface, live scene, character, and interactions.
- Vite for local development and browser builds.
- Browser `localStorage` for versioned local saves and offline progress.

Keep simulation rules independent from presentation. Active and offline progress use the same simulation path. Save schema changes require explicit migrations.

## Getting started

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Build the production bundle with:

```sh
npm run build
```

## Repository layout

```text
src/
  game/       State, simulation, content data, and persistence
  scenes/     Phaser scenes and game interactions
  ui/         Optional browser UI outside the Phaser canvas
workspace/
  plan/       Roadmap and implementation tickets
```

See [`AGENTS.md`](AGENTS.md) for project conventions and [`workspace/plan/README.md`](workspace/plan/README.md) for the roadmap.
