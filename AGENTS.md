# Gorl Reactor contributor guide

## Project direction

Gorl Reactor is a browser based idle game about tuning in to Foodie Beauty’s live channel, moving her between scenes, and sending gifts that shape her comfort, style, energy, and mood. The channel earns views while active and offline. Use the video-channel interface and gameplay documented in `README.md` as the current product direction.

## Working agreements

- Treat technical quality as a core project requirement. Optimize for code that is easy to understand, change, and review—not just code that works once.
- Use TypeScript throughout the application. Keep strict type checking enabled; do not use `any` to silence errors. Prefer `unknown` at untrusted boundaries and narrow it before use.
- Model the game domain explicitly. Avoid primitive obsession: don't pass unrelated `string`/`number` values around when they represent concepts such as `SceneId`, `ItemId`, `Views`, `Fans`, or `Seconds`. Use named types, discriminated unions, and small value objects/helpers where they make invalid states harder to express. Keep these abstractions proportionate; don't wrap every primitive without a domain reason.
- Represent finite states with unions/enums rather than magic strings or booleans whose meaning depends on context. Prefer explicit input/output types for important operations.
- Validate data at boundaries: loaded saves, browser storage, and external or user-authored content. Once validated, pass typed domain data through the rest of the application.
- Keep game rules independent from Phaser scenes and UI presentation.
- Keep scenes, gifts, streamer attributes, and balance values in content data rather than scene code.
- Use one simulation path for active and offline progress.
- Persist local saves with a version, validate loaded data, and provide migrations when the shape changes.
- Make every scene and item effect legible: show which single attribute it raises and by how much.
- Treat canon as project content. Don't invent established Gorl canon; use clearly fictional placeholder content until approved material is available.

## Maintainable code

- Keep modules focused: organize by game capability (such as interactions, progression, simulation, and persistence), and give each module a clear responsibility.
- Keep Phaser scenes responsible for presentation and translating player input into domain actions. Put rules and calculations in framework-independent game modules.
- Prefer small functions with clear names, explicit inputs, and predictable outputs. Keep side effects—storage, timers, randomness, and rendering—at clear boundaries.
- Avoid Fowler's code smells, especially primitive obsession, long functions, duplicated logic, large conditional branches, feature envy, and shotgun changes. When a smell appears, extract a well-named domain concept or focused module instead of layering on another special case.
- Name units and meanings clearly (for example, `offlineCapSeconds` rather than `cap`). Avoid unexplained magic values in simulation and progression.
- Make state transitions explicit and preserve invariants in one place. Avoid partially initialized objects and loosely shaped records when a discriminated union or constructor can enforce valid states.
- Prefer straightforward code over clever abstractions. Share code when it represents the same rule, but don't create generic frameworks for one use case.
- Update documentation and the task plan when implementation changes project structure, domain rules, or developer workflow.

## Development

- Stack: TypeScript, Phaser, and Vite.
- Keep TypeScript strictness enabled and resolve type errors rather than suppressing them. Use narrow, intentional type assertions only at validated integration boundaries, with a brief explanation where safety is not obvious.
- Install dependencies with `npm install`.
- Start the local server with `npm run dev`.
- Create a production build with `npm run build`.

## Structure

- `src/game/`: simulation, state, data, and persistence.
- `src/scenes/`: Phaser scenes and interaction presentation.
- `src/ui/`: browser UI outside the game canvas, if needed.
- `workspace/plan/`: implementation tasks and planning notes.
