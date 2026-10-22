# Architecture

## One turn, two independent boards

`src/game/` is the pure rules layer. The engine compresses a row, merges each tile
at most once, and computes merge points. The coordinator maps one of six global
directions to two local board directions. Tiles never cross a face boundary.
Only a changed face receives a random tile. Unaffected face objects keep their
identity, so the renderer can skip them.

The multiplier is captured before a turn: zero, one, two, or three completed
faces award ×1, ×2, ×4, or ×8 on future merges. Reaching 2048 does not freeze a
face; a face stops only when no legal move remains. The run ends when all three
faces are blocked. Keep these rules in engine tests, not component conditionals.

## Input and state

`src/input/` translates gestures and keys into directions.
`src/state/useGameController.ts` owns the current run, animation lock, best score,
and persistence. Stable callbacks read the latest game through refs; this avoids
re-registering input handlers on every render and prevents rapid input from
using a stale turn. Save writes are serialized so an older snapshot cannot finish
after a newer one and overwrite it.

## Drawing and animation

`src/geometry/` defines the shared cube coordinate system. Components draw cells
and tiles using that same geometry. `FaceGrid` is memoized using React's normal
prop comparison; unchanged faces need not redraw when another face moves.
There is no SVG geometry cache. Keep animation origins at each tile's center and
preserve reduced-motion behavior. Avoid changing game state on animation frames.

## Persistence and integrations

`src/storage/` validates and normalizes versioned local saves. Browser storage can
be unavailable or malformed; local play must still work. There is no online
leaderboard backend. Store links and text sharing are separate from game rules.
No Apple purchase or Game Center implementation belongs in this public web repo.

## Verification and deployment

Tests cover rules, topology, persistence, input, presentation, and the web-only
public boundary. Type checking, lint, formatting, tests, and production export
run in CI. GitHub Pages deploys only from `main` after those checks succeed.
The exported `dist/` directory is generated, never hand-edited or committed.
