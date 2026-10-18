# PARADOX — The Game That Refuses to Be Impossible

> **Break the rules. Not the game.**

**Hacktoberfest Georgia 2026 · Track 02 — Multiplayer Agentic Experiences**  
**Status: Working hackathon MVP / proof of concept — not a finished game or a general-purpose game engine**

**[Play PARADOX](https://paradox-puzzle-lab.lovable.app)** · **[View the source code](https://github.com/nutssa/paradox)**

## The idea, in 30 seconds

Imagine a video game you can redesign **while somebody is playing it**.

Two people enter the same world, each with a different AI agent. One asks for a new obstacle. The other asks for a trap, a detour, or a tougher challenge. Their ideas become proposed changes to the *same live game board*.

But there's a catch: what if one of those changes makes the game impossible to win?

**PARADOX is a game that refuses to let that happen.** Before a proposed change becomes part of the world, the **Proof Core** checks whether the player can still reach the exit. If the edit blocks every valid route, players see why it fails instead of losing their playable game. An AI agent can suggest a different solution; a separate deterministic repair tool can also find a safer alternative. People review and approve changes before they go live.

**The bigger idea:** What if humans and AI could freely co-create interactive worlds, while the world itself knew which rules must never be broken?

## The problem we are exploring

Creating a game collaboratively is exciting, but changes interact in unexpected ways. A wall added by one designer can invalidate a route another designer created; a locked door can make an objective unreachable; an AI-generated change can look plausible without actually working.

This becomes especially interesting when **multiple AI agents and humans edit one shared world at the same time**. Simply synchronizing edits is not enough: everyone can see the same board even when its gameplay logic is broken.

PARADOX explores a different approach: **creative freedom with verifiable constraints**. AI proposes possibilities; an independent algorithm checks them; humans stay in control.

## How the current MVP works

1. **Two players share one room.** They can join from separate browsers or tabs, with a synchronized board and activity history.
2. **Each player has their own AI agent.** **WORLDWEAVER** focuses on creative level design; **CHAOS ENGINE** introduces mischief and challenge. Both receive the shared map and recent changes.
3. **Agents propose, never silently apply.** Suggestions are converted into a limited set of typed tile-edit operations, such as adding walls or lava, moving the exit, or changing keys and doors.
4. **The Proof Core evaluates the result.** A deterministic breadth-first search (BFS) explores states of **(row, column, hasKey)**, starting from the player's *current position*. It checks whether a legal path to the exit still exists.
5. **The world accepts only reviewed, safe changes.** Solvable proposals can be approved by a player. Invalid or impossible proposals are rejected without changing the committed board.
6. **Players can repair a paradox.** The other agent can propose a counter-solution, or a clearly labeled algorithmic fallback can search for a valid repair. Proposed repairs are checked again before approval.

The result is part puzzle game, part collaborative creation experiment, and part demonstration of how AI-generated actions can be **tested instead of trusted**.

## Why the Proof Core matters

The Proof Core is **not another chatbot**. It does not ask an LLM whether a level “looks solvable.”

It executes a real search algorithm that accounts for walls, lava, collectible keys, locked doors, the player's current position, and the exit. This gives each proposal a concrete, inspectable pass/fail result and—when solvable—a path that the interface can display.

**The distinction matters:** language models can be imaginative but inconsistent. A deterministic verifier gives the agents a dependable boundary to create within.

### A moment to try in the demo

**Ask an agent to change the world → attempt an edit that seals the exit → watch the Proof Core reject it → request a repair → approve the verified alternative → continue playing.**

The impossible-edit button is an explicitly labeled **deterministic demo preset**, not a claimed AI-generated response. AI-generated repair and algorithmic fallback are identified separately.

## What is implemented today

This repository contains a **working, deliberately small prototype**:

- One playable **12 × 9** tile-based maze with walls, lava, a key, locked doors, a character, and an exit.
- Player movement, key collection, door traversal, victory, and reset.
- Two player seats in a room, shared state, live synchronization, and a polling fallback.
- Two separately prompted AI agents that suggest structured edits.
- Proposal previews, rejection reasons, human approval, revision tracking, and activity history.
- A deterministic BFS solvability checker and safe-repair mechanism.
- Automated tests of the game engine, constraints, and proposal behavior.

This proves a **specific interaction**; it does not claim to be a complete game-design platform. The current agents operate on a predefined set of tile edits. The verifier establishes **reachability of the exit**, not whether every possible future game mechanic would be balanced, enjoyable, or bug-free.

## The larger vision — beyond this hackathon MVP

**We are not pitching the 12 × 9 maze as the final product. We built it as a playable demonstration of a much bigger possibility.**

Imagine evolving PARADOX into a platform where friends, creators, and AI agents build entire games together *in real time*, not merely placing tiles but inventing objectives, changing mechanics, creating stories, and experimenting with surprising rules.

Potential next steps include:

| From the current MVP | Toward a fuller vision |
| --- | --- |
| One handcrafted puzzle chamber | Many levels, environments, and game genres |
| A small set of predefined edit operations | Richer rules, objectives, interactions, and visual creation tools |
| Two players with individual agents | More creators and specialized agents collaborating on the same world |
| Reachability verification | Stronger game-specific guarantees, constraint checks, and playtesting simulations |
| Approval of individual changes | Versioned experiments, undo/branching, and understandable change histories |
| A compact live demo | A place to create, share, remix, and play community-built experiences |

Those possibilities are **future directions, not features claimed to exist in the submitted prototype**. Each would introduce new technical challenges, especially verifying more complex rules and resolving multi-agent conflicts safely.

The most exciting direction isn't simply “AI makes levels.” It's **co-creation with guardrails**: AI can be wildly creative, and the system can still explain *what changed, why it is safe, and who approved it*.

## Why Track 02 — Multiplayer Agentic Experiences?

PARADOX is designed around the track rather than adding AI as an afterthought:

- **Two humans:** distinct participants work on the same live game.
- **Two agents:** each participant controls an AI collaborator with its own creative role.
- **Shared context:** both agents work from the evolving board and recent activity.
- **Conflicting suggestions:** proposals can interfere with the game's constraints; the verifier catches invalid results, and agents can suggest alternatives.
- **Coordinated outcomes:** edits remain proposals until the system checks them and a human approves them.

This is a concrete experiment in collaborative agentic systems, where **technical correctness is part of the interaction itself**.

## Try it yourself

**Live app:** https://paradox-puzzle-lab.lovable.app

1. Open the app and create a room as Player 1.
2. Copy the invite link and open it in an incognito/private window to join as Player 2. **One laptop is enough** to try both perspectives.
3. Move the character with WASD or arrow keys and see the shared state update.
4. Ask WORLDWEAVER or CHAOS ENGINE to suggest a change; inspect the preview before approving it.
5. Click **Attempt Impossible Edit** to demonstrate an invalid proposal. The board stays unchanged.
6. Request an AI counterproposal or select **Find Safe Repair** for a deterministic fallback.
7. Approve a verified repair and display the restored route.

A second participant provides the intended experience, but two browser sessions on one laptop also demonstrate the underlying multiplayer behavior.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Interface and app | React, TypeScript, TanStack Start, Tailwind CSS |
| Data and real-time collaboration | Supabase, room-scoped player tokens, broadcast updates with polling fallback |
| AI agents | Lovable AI Gateway, structured model outputs, server-side validation |
| Puzzle and verification engine | TypeScript, breadth-first search over position/key state, typed edit operations |
| Testing | Vitest |

### Code map

- `src/lib/engine/` — maze definitions, game rules, typed edit validation, BFS solver, deterministic repair, tests.
- `src/lib/room.functions.ts` — authenticated game actions and proposal/approval endpoints.
- `src/lib/room.server.ts` — room persistence, agent contexts, model calls, and activity events.
- `src/components/game/` — game board, animated tiles, and agent visuals.
- `src/routes/room.$code.tsx` — the playable shared-room interface.

### Running checks

```bash
npm install
npm test
npm run build
```

Backend features require appropriate Supabase and AI Gateway configuration; a plain local install does not provision these services automatically.

---

**PARADOX is a hackathon MVP built to answer one question: _Can a shared AI-created game world let us experiment with almost anything, while reliably refusing the changes that break its essential rules?_**

Our prototype shows what that idea looks like when it becomes playable. The full potential goes much further.
