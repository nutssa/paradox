# PARADOX — The Game That Refuses to Be Impossible
*Break the rules. Not the game.* · Hacktoberfest Georgia 2026 · Track 02

Two humans share one 12×9 tile maze, each through their own AI agent (P1 **WORLDWEAVER**, P2 **CHAOS ENGINE**).
Agents only *propose* typed edits; a deterministic BFS solver over (row, col, hasKey) checks the exit is still reachable
from the player's **current** position. Impossible edits are shown in red and cannot be committed.

## Architecture
- `src/lib/engine/` — pure engine: types, level, ops validation, BFS solver, deterministic repair, commit logic + tests (`bun run test`).
- `src/lib/room.functions.ts` — server API: createRoom, joinRoom, getRoomSnapshot, movePlayer, proposeEdits, proposeManual,
  blockExitDemo, requestCounterproposal, findSafeRepair, approveProposal, dismissProposal, resetLevel.
- `src/lib/room.server.ts` — DB access, token auth, AI agent calls (strict JSON schema → Zod → solver).
- Realtime: broadcast ping + 2–5 s polling fallback; header shows LIVE / POLLING.

## Demo checklist
1. Create room (tab A) → copy invite link.
2. Open the link in a second browser / tab (tab B) and join.
3. Move the player with WASD in tab A — tab B follows.
4. P1 asks WORLDWEAVER "Add a wall to make a nicer detour" → ghost preview, VERIFIED → approve.
5. P1 clicks **Block the exit (demo)** → red ghost, "The solver saved the game" on both screens.
6. P2 clicks **Ask CHAOS ENGINE to repair** (real AI) or **Find safe repair (algorithmic)**.
7. Approve the verified repair → revision bumps, shortest path animates on both screens.
8. Walk to the exit (grab the key first) → WIN.
