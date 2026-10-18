# PARADOX — The Game That Refuses to Be Impossible

### Break the rules. Not the game.

**Hacktoberfest Georgia 2026 · Track 02: Multiplayer Agentic Experiences**  
**Status: Working hackathon MVP and proof of concept — not a finished game or a general-purpose game engine**

[**Play the live game**](https://paradox-puzzle-lab.lovable.app) · [**Explore the source code**](https://github.com/nutssa/paradox)

---

## Contents

1. [The idea: a world you can rewrite](#1-the-idea-a-world-you-can-rewrite)
2. [The problem PARADOX explores](#2-the-problem-paradox-explores)
3. [What makes PARADOX different](#3-what-makes-paradox-different)
4. [Meet the agents](#4-meet-the-agents)
5. [How the game actually works](#5-how-the-game-actually-works)
6. [Inside the Proof Core](#6-inside-the-proof-core)
7. [The proposal, verification and approval system](#7-the-proposal-verification-and-approval-system)
8. [What happens when a world becomes impossible?](#8-what-happens-when-a-world-becomes-impossible)
9. [The multiplayer experience](#9-the-multiplayer-experience)
10. [What we built for the hackathon](#10-what-we-built-for-the-hackathon)
11. [The bigger vision: beyond one puzzle](#11-the-bigger-vision-beyond-one-puzzle)
12. [Why this belongs in the multiplayer agentic track](#12-why-this-belongs-in-the-multiplayer-agentic-track)
13. [Visual design and world identity](#13-visual-design-and-world-identity)
14. [Technical architecture](#14-technical-architecture)
15. [Testing, limitations and honest MVP boundaries](#15-testing-limitations-and-honest-mvp-boundaries)
16. [Live demo for judges](#16-live-demo-for-judges)
17. [Frequently asked questions](#17-frequently-asked-questions)
18. [Final thought](#18-final-thought)

---

## 1. The idea: a world you can rewrite

**Imagine playing a video game that isn't completely fixed when you launch it.**

You are trying to find your way through a maze. There are walls, dangerous tiles, a key, locked doors and an exit. But instead of only solving the level, you and another player can change its design *while the game is still running*.

Each of you is accompanied by a different AI agent. You might ask your agent:

> "Make this route more challenging, but don't make the game unfair."

Your friend might tell the other agent:

> "Add a surprising obstacle near the exit."

A normal level editor would simply place the requested objects. An unconstrained generative AI might confidently propose something that looks interesting but cannot be completed. PARADOX treats each suggestion as an experiment. Before it becomes real, the game asks a crucial question:

**Can the player still win?**

If the answer is no, the proposed change is rejected. The actual game world stays intact. A different agent can suggest a counterproposal, or a deterministic repair mechanism can search for a safer alternative. Only after verification and human approval does the shared world change.

### The promise of PARADOX

PARADOX explores a future where **games are not just things people play, but worlds that players and AI can continuously co-create**.

That freedom creates a paradox: the more freely you can change the rules, the easier it becomes to destroy the experience. Our concept is a system that encourages creative changes *because* it has a way to check essential constraints.

**Two people. Two AI agents. One evolving world. A verifier that refuses the impossible.**

The current maze is deliberately small. It is a playable way to make that interaction concrete—not the limit of the idea.

---

## 2. The problem PARADOX explores

### Creativity can conflict with correctness

In a collaborative environment, a change that seems harmless in isolation can have consequences somewhere else. A wall might block the only valid route. A hazard might cut off access to a key. A moved exit might be separated from the player by locked doors.

This is an ordinary problem in game design, but it becomes especially interesting when multiple people—and increasingly, multiple AI agents—are editing the same state.

Imagine one agent building a clever detour while another closes an entrance. Both edits might be individually well-intentioned. Together they can make the environment impossible to complete.

### Sharing state is not the same as coordinating decisions

A synchronized application can successfully deliver the same invalid board to every connected player. Realtime updates answer "What changed?" They do **not**, by themselves, answer "Should this change be allowed?"

A creative AI can describe a convincing solution. That description is not mathematical evidence that the solution works.

PARADOX investigates how to combine three different kinds of responsibility:

| Responsibility | Who does it? | Why it matters |
| --- | --- | --- |
| **Imagine** possible changes | Human players and their AI agents | Keeps the experience unpredictable, expressive and fun |
| **Verify** the resulting world | Deterministic game engine / Proof Core | Tests a concrete constraint instead of trusting an AI opinion |
| **Decide** whether to apply the change | Human players | Preserves agency and accountability over the shared artifact |

The fundamental experiment is not "Can AI create a wall?" It is **"Can several human–AI collaborators safely change the same interactive system without accidentally invalidating what makes it work?"**

---

## 3. What makes PARADOX different

PARADOX combines ideas that usually appear in separate tools.

**It is a game.** Players can move through a real level, collect a key, unlock access, avoid hazards and reach an exit.

**It is a shared creation space.** Two player sessions observe the same evolving board, proposals and event history.

**It is agentic.** Each player can express a natural-language design intention through a differently instructed AI agent. The agent produces structured operations rather than simply answering a question.

**It has a rule-based safety boundary.** Proposed edits are checked by code that is independent of the language model.

**It treats failure as part of the experience.** When an impossible edit is rejected, that becomes an invitation to rethink, repair and negotiate a different version—not a silent error.

**It is human-directed.** AI suggestions and verified changes are not automatically committed. Human approval remains a separate step.

### A different kind of game design loop

Traditional puzzle:
**Observe → solve → finish.**

Traditional editor:
**Modify → save → test afterward.**

PARADOX's current concept:
**Imagine → propose → preview → verify → negotiate or repair → approve → play the new world.**

The interesting part is the loop. You can keep creating challenges, and the verifier gives you a boundary inside which to experiment.

---

## 4. Meet the agents

The current MVP introduces two named AI collaborators with different creative personalities. Each agent receives information about the shared maze, player state, recent actions and proposal context before responding.

### WORLDWEAVER — Player 1

**Role:** The thoughtful architect.

WORLDWEAVER is encouraged to create elegant detours, interesting structures, readable puzzles and meaningful key/door sequences. Its job is to help make the world more expressive without losing the player's ability to complete it.

**Visual identity:** A violet geometric oracle, represented by an eye nested inside diamond shapes.

**Example request:** "Create a more interesting route to the exit."

### CHAOS ENGINE — Player 2

**Role:** The playful challenger.

CHAOS ENGINE enjoys misdirection, lava, choke points, unexpected barriers and difficult choices. But its challenge is to make the puzzle more dramatic **without making it unwinnable**.

**Visual identity:** A coral cog-like character with a mischievous expression.

**Example request:** "Make the journey harder, but still possible."

### Are the agents actually separate?

Yes. The two player roles use distinct agent personas and receive context about the common room. They can independently propose different structured changes. Their output must still pass the same server-side validation and Proof Core checks.

The agents are **not** given unrestricted access to the database or authority to rewrite the world directly.

### The third character: the Proof Core

The Proof Core is visually represented as a lime-colored crystalline system. But unlike the two creative agents, **it is not an AI persona**. It is deterministic puzzle logic.

Its purpose is deliberately impartial: it cares about whether a proposal follows the implemented rules and whether the exit remains reachable, not whether a proposal sounds persuasive.

---

## 5. How the game actually works

### The playable world

The first prototype contains a **12-column × 9-row** tile maze. The board includes:

| Element | Meaning |
| --- | --- |
| Floor | Walkable space |
| Wall | Cannot be crossed |
| Lava | Cannot be crossed |
| Key | Collecting it gives the player key possession |
| Door | Can only be crossed if the player has a key |
| Exit | The target destination |
| Player | The little character exploring the world |

Movement is orthogonal: up, down, left and right. The board has a **shared player state** rather than two separate characters racing around the same grid. Either authorized player session can interact with the shared gameplay and creation controls.

Reaching the exit records a win and resets the puzzle for another round.

### Editing the world

Players can propose a small set of well-defined tile operations:

| Operation | Effect |
| --- | --- |
| addWall / removeWall | Place or remove a wall where legal |
| addLava / removeLava | Place or remove impassable lava where legal |
| placeKey / removeKey | Add or remove a key |
| placeDoor / removeDoor | Add or remove a locked door |
| moveExit | Move the exit onto a legal floor tile |

Each operation targets a specific row and column. Ordinary proposals are limited to three operations; repair proposals can contain up to four. Operations are also checked for invalid coordinates, duplicate target cells, incompatible source tiles and protected positions such as the player's current cell.

**An important distinction:** The current agents do not invent arbitrary programming languages, new physics or entirely new types of gameplay. They work with this implemented set of operations. Extending that creative vocabulary is part of the future vision.

---

## 6. Inside the Proof Core

The Proof Core is the technical heart of PARADOX.

Its central question is intentionally precise:

> Given the *current* board and player state, is there a legal sequence of moves that reaches the exit after this proposed edit?

### Why we use breadth-first search (BFS)

A level can look open but still be unsolvable. For example, a door might block the exit, with the only key trapped on the opposite side.

Checking merely whether adjacent floor tiles connect is insufficient, because the ability to cross a door depends on whether the player has collected a key.

The solver therefore explores states of the form:

~~~text
(row, column, hasKey)
~~~

The last value is a Boolean. It records whether the player has already collected a key.

That means these two situations are **different states**, even when the player occupies the same tile:

~~~text
(4, 5, false)  — player at row 4, column 5, without a key
(4, 5, true)   — same tile, but now the player can pass locked doors
~~~

The algorithm starts at the player's **actual current position**, not automatically at the original starting square.

### What happens during verification?

1. The game receives a proposed set of operations.
2. It checks whether the operations themselves are legal.
3. It constructs a candidate board **without mutating the accepted board**.
4. The solver searches legal moves from the player's current position.
5. If the exit is reachable, it returns a successful verdict and a shortest path.
6. If no valid route exists, it returns an unsuccessful verdict; the candidate board is not committed.
7. The server revalidates a proposal before approval because the room may have changed after the initial check.

BFS is useful here because, under the maze's uniform-cost movement rules, it finds a shortest path when one exists.

### What does the Proof Core prove—and what doesn't it?

| It checks in the MVP | It does not claim to guarantee |
| --- | --- |
| A valid route to the exit still exists | That the game is fun for every player |
| Movement respects walls, lava and doors | That all imaginable game mechanics are supported |
| Keys can be collected before using locked doors | That every proposed level has the perfect difficulty |
| The proposed edit follows implemented operation rules | That arbitrary code or AI-generated rules are safe |
| The current player state is considered | That every multiplayer race condition is already solved |

This limitation is a strength of the MVP's explanation: **we chose one important invariant and implemented a real verifier for it.**

It is verification through an algorithm, not an LLM claiming that a design looks correct.

---

## 7. The proposal, verification and approval system

PARADOX doesn't treat an AI response as an instruction that should immediately change the database. It treats it as a **proposal**.

The basic interaction is:

~~~mermaid
flowchart TD
    A["Human requests a world change"] --> B["WORLDWEAVER or CHAOS ENGINE"]
    B --> C["Structured edit proposal"]
    C --> D["Validate tile operations"]
    D --> E{"Operations legal?"}
    E -->|No| R["Reject proposal; keep committed board"]
    E -->|Yes| F["Proof Core: BFS on candidate board"]
    F --> G{"Exit reachable?"}
    G -->|No| R
    G -->|Yes| H["Preview verified proposal"]
    H --> I{"Human approves?"}
    I -->|No| J["Dismiss / leave unchanged"]
    I -->|Yes| K["Revalidate against latest room state"]
    K --> L{"Still valid and solvable?"}
    L -->|No| R
    L -->|Yes| M["Commit edit to shared world"]
    R --> N["AI repair or algorithmic fallback"]
    N --> D
~~~

### The preview matters

A **ghost edit** displays a proposed change without changing the world beneath it.

Players can inspect which cells would be affected, read the explanation and see whether the proposal passed verification. The visible distinction between an idea and an accepted change is essential to the concept.

### What is a revision?

Committed edits increment the room's board revision. The system also tracks player movement separately. This helps it understand when a proposal is based on an earlier state.

For instance, a previously legal wall may become invalid if the character moves onto that tile before approval. The server therefore checks again at approval time.

The current implementation includes revision/movement checks and retries on important actions, although arbitrary simultaneous edits still have concurrency edge cases described in [Current limitations](#15-testing-limitations-and-honest-mvp-boundaries).

### Why is human approval necessary?

Because **correctness and desirability are not the same thing**.

A level can be technically solvable and still be too frustrating, repetitive or different from what the players wanted. The Proof Core answers a narrow mathematical question. People decide whether the change is worth keeping.

This is the underlying design philosophy:

**AI proposes. Mathematics verifies. Humans decide.**

---

## 8. What happens when a world becomes impossible?

Consider a simple illustrative scenario.

Player 1 is approaching the exit. Player 2 wants to create a dramatic final obstacle. A proposed change places hazards around the only possible entrance. Without a verifier, the edited world could become impossible to complete.

In PARADOX, the system evaluates the candidate world **before applying it**. If BFS cannot reach the exit, the proposal is rejected. The players can see the rejected idea but continue playing on the last accepted board.

### The "Attempt Impossible Edit" button

The MVP includes a purposely dramatic demo interaction: **Attempt Impossible Edit**.

This action generates a **deterministic preset** that attempts to seal the exit using lava. It is **not presented as an AI-generated proposal**. That distinction is intentional: the demonstration remains predictable for judges while testing the same proposal-validation boundary.

The experience is built around a memorable moment:

**The world is threatened. The verifier refuses the change. The actual game is saved.**

### Two different paths to a repair

**Option A — AI counterproposal.** A player asks their AI agent to suggest a replacement that retains as much of the original idea as possible. The new operations are evaluated like any other proposal. AI-generated repairs can themselves fail verification.

**Option B — Deterministic algorithmic fallback.** If an AI response is unavailable or unsuitable, the system can search for a small change that makes the proposal solvable. Its current strategy considers keeping the original changes while opening a blocked tile; if that does not work, it tries dropping one offending operation. Candidates are checked by the same solver.

A repair is **not an automatic rollback or silent edit**. It remains a proposal for players to review and approve.

### Why this matters beyond puzzles

This is a miniature example of a broader pattern. A generative system can be useful at producing possibilities, while a separate evaluator checks whether those possibilities violate requirements. The same pattern can inspire collaboration tools, creative editors, simulations and other agent-assisted workflows.

PARADOX's present implementation only proves this approach within its small puzzle-rule system. Applying it elsewhere would require new domain-specific checks.

---

## 9. The multiplayer experience

This isn't a single-player game with two decorative chatbot panels.

Two human participants can enter the same room using separate sessions. Player 1 operates with WORLDWEAVER; Player 2 operates with CHAOS ENGINE.

### What is shared?

- The maze and shared player state.
- Player aliases and presence indicators.
- Committed board revisions and win count.
- Proposals, their outcomes and approval status.
- A recent event/activity history.
- Updates when either participant moves or changes the world.

The server maintains the authoritative state. Supabase Realtime broadcast messages encourage clients to refresh after changes; periodic polling provides a fallback if realtime updates are unavailable.

### Why multiplayer is important to the idea

The most interesting conflicts arise *because someone else is changing the same world*.

One agent may want to make a detour. The other may want to increase difficulty. A human may move while a proposal is being prepared. The shared artifact needs to remain understandable as these decisions interact.

This brings the project closer to a collaborative creation system than a traditional isolated AI chat.

### A note on collaboration today

The current MVP is optimized for two player seats and small, reviewed tile edits. It is **not yet a complete concurrent-editing platform** with fully atomic proposal transactions, unlimited collaborators, branching histories or conflict-free arbitrary modifications. Those are natural next engineering steps.

---

## 10. What we built for the hackathon

PARADOX is a **working proof of concept**, designed to validate the key idea through something users can actually play.

### Feature overview

| Feature | Implemented in the MVP? | Notes |
| --- | --- | --- |
| Playable maze, hazards, keys, doors and exit | **Yes** | 12 × 9 starter puzzle |
| Two players in one shared room | **Yes** | Two player seats, shared board |
| Separate Worldweaver and Chaos Engine personas | **Yes** | Real structured AI proposals |
| Live synchronization | **Yes** | Broadcast-triggered refresh and polling fallback |
| Natural-language requests for tile changes | **Yes** | Within a defined operation vocabulary |
| Preview before modifying the world | **Yes** | Ghost edits and proposal status |
| Deterministic solvability verification | **Yes** | BFS from current player state |
| Rejection of impossible candidate changes | **Yes** | Accepted board remains unchanged |
| Human approval of verified proposals | **Yes** | With server-side revalidation |
| AI repair proposals | **Yes** | Also checked by the solver |
| Algorithmic safe-repair fallback | **Yes** | Searches limited, verifiable alternatives |
| Multi-level campaign and procedural worlds | **Not yet** | Future direction |
| AI-generated mechanics, quests and stories | **Not yet** | Future direction |
| Unlimited agents, collaborative editing branches | **Not yet** | Future direction |
| General-purpose verification of arbitrary games | **Not yet** | Requires substantially broader engineering |

### What the prototype successfully illustrates

The achievement is not the number of tiles. The achievement is that a human can express a creative intention, an AI can turn it into an operation, an independent engine can inspect its consequences, another participant can respond, and the group can approve a safe version of the idea.

That entire loop is visible and interactive.

---

## 11. The bigger vision: beyond one puzzle

### What if games became living, collaborative creations?

The current maze is a test environment. The long-term idea is a platform where players don't merely select from predetermined challenges—they participate in **making and remaking the world itself**.

Imagine entering an evolving fantasy dungeon with friends. One AI agent specializes in level design, another in storytelling, another in balancing challenges. Players suggest unexpected ideas in natural language: a new secret passage, a twist in the objective, a puzzle that responds to team decisions.

Instead of treating every generated suggestion as immediately valid, the platform would evaluate the relevant requirements before accepting it. A richer system might check whether quests still have a solution, whether necessary items remain obtainable, whether cooperative objectives remain fair, or whether custom interactions produce contradictions.

That is **the proposed direction**, not what the current 12 × 9 MVP already does.

### A possible development roadmap

**Phase 1 — The proof of concept (implemented).**  
One maze, two human players, two AI collaborators, a narrow set of edits, one mathematical invariant, and a human approval loop.

**Phase 2 — A stronger collaborative editor (proposed).**  
More robust atomic conflict handling, clearer proposal histories, undo/redo, branchable versions of worlds, improved reconnection, richer edit tools and better explanations of why a change was rejected.

**Phase 3 — Richer creation (proposed).**  
Multiple levels, varied tile systems, customizable objectives, new mechanics, environment themes and additional specialized AI collaborators.

**Phase 4 — Worlds worth sharing (proposed).**  
Create, save, publish, play, remix and collaboratively evolve user-created experiences. Make the act of creating a level part of the multiplayer game.

**Phase 5 — More expressive proof systems (research direction).**  
Move beyond shortest-path reachability toward domain-specific gameplay constraints, automated scenario testing and stronger checks suited to more complex worlds. Not all desirable game qualities can be proved mathematically, so human playtesting would remain important.

### Why the concept has potential

At first glance, PARADOX looks like a small puzzle. But the underlying question has wider significance:

**How can multiple humans and AI agents be creative together without losing confidence in the shared thing they are building?**

The game provides a playful place to explore that question before attempting it at larger scale.

---

## 12. Why this belongs in the multiplayer agentic track

PARADOX was designed around the challenge of **multiple humans working on one shared artifact through separate agents**.

| Track principle | PARADOX's current interpretation |
| --- | --- |
| Multiple human participants | Two independent player seats |
| Distinct AI assistants | WORLDWEAVER and CHAOS ENGINE |
| Shared artifact | One mutable maze and shared player state |
| Agents take meaningful actions | They generate typed proposed operations |
| Collaboration can produce conflicts | Changes can invalidate routes or become stale |
| Coordination mechanism | Validation, human review, server revalidation and revision checks |
| Visible result | Both players see proposals and committed changes |

The agents do not need to agree in personality. They need to participate in a system with enough structure to make disagreement useful rather than destructive.

### Why a game is a good demonstration environment

A puzzle makes a technical invariant easy to understand. Anyone can see the consequence of blocking an exit. The solver's result can be visualized as a path. The conflict is immediate, concrete and testable.

That makes PARADOX both a game experience and an accessible demonstration of a deeper systems-design problem.

---

## 13. Visual design and world identity

PARADOX is deliberately styled as a playful neon indie game rather than an ordinary software dashboard.

- **Dark navy:** The atmosphere and foundation of the game world.
- **Electric lime:** Verification, viable routes and the impartial Proof Core.
- **Violet:** WORLDWEAVER, the geometric creative architect.
- **Coral/red:** CHAOS ENGINE, hazards and impossible-edit warnings.
- **Warm off-white:** The small playable character and legible interface text.

The design mixes pixel-inspired tiles, glowing maze elements, animated lava, ghost previews and arcade typography. The project uses **Silkscreen** for pixel-style labels, **Space Grotesk** for primary UI text and **JetBrains Mono** for technical/readout details.

The contrast between lime verification and coral rejection is more than decoration: it makes the central creative-versus-constraint conflict easy to recognize visually.

---

## 14. Technical architecture

### Stack

| Part of the product | Technology |
| --- | --- |
| Web experience | React, TypeScript, TanStack Start / Router |
| Styling and interface | Tailwind CSS, custom tile animations and game components |
| Backend actions | TanStack Start server functions |
| Shared persistence | Supabase |
| Live update notifications | Supabase Realtime, with polling fallback |
| AI agents | Lovable AI Gateway, distinct prompts and structured JSON output |
| Input and output validation | Zod and game-specific operation checks |
| Proof Core | Deterministic TypeScript breadth-first search |
| Tests | Vitest |

### Why these technical choices?

**Typed operations rather than free-form code.** The model returns an explicit operation name and coordinates. This makes proposals understandable, replayable and inspectable by a deterministic validator.

**Server-side validation rather than trusting the browser.** The browser can show an attractive proposal preview, but the decision to approve it goes through server logic and the engine's checks.

**A deterministic solver rather than a second AI critic.** The verifier does not depend on how confident a model sounds. It evaluates the implemented rules of movement and reachability.

**Shared room state rather than two local copies.** The board and proposals must have an authoritative representation so that both players are collaborating on the same object.

**Human approval rather than automatic agent authority.** Passing a reachability check does not mean the players must accept a change.

### How a proposal travels through the system

1. A player submits a natural-language instruction to an agent.
2. The server builds context: current board, player position and key possession, revision, recent shared activity and relevant proposal history.
3. The model returns an explanation, intent and structured operations.
4. The server validates the payload schema and proposed tile changes.
5. The Proof Core evaluates the candidate result.
6. A proposal record, status and event become visible in the shared room.
7. A human approves or dismisses it.
8. Approval attempts to revalidate against the latest board and player state before committing a new revision.
9. Other clients refresh their authoritative snapshots and see the result.

### Repository guide

| Source path | Responsibility |
| --- | --- |
| \`src/lib/engine/types.ts\` | Board, player, operation and verdict types |
| \`src/lib/engine/level.ts\` | Starter maze, parsing and board helpers |
| \`src/lib/engine/solver.ts\` | BFS pathfinding and constraint verdicts |
| \`src/lib/engine/ops.ts\` | Operation legality and proposed-board evaluation |
| \`src/lib/engine/repair.ts\` | Algorithmic repair search and exit-blocking demo preset |
| \`src/lib/engine/game.ts\` | Movement and proposal commit logic |
| \`src/lib/room.server.ts\` | Persistence, room authorization, proposal storage, agent calls |
| \`src/lib/room.functions.ts\` | Public-facing authenticated server actions |
| \`src/hooks/use-room.ts\` | Client synchronization and fallback refresh |
| \`src/components/game/\` | Board, character and agent visuals |
| \`src/routes/room.$code.tsx\` | Live game room interface |

### Running the project locally

~~~bash
npm install
npm run dev
~~~

Run automated checks:

~~~bash
npm test
npm run build
npm run lint
~~~

The browser application and source are public, but recreating the full backend locally requires appropriate **Supabase and AI Gateway configuration**. Credentials should be supplied through private environment configuration, not committed to GitHub.

**Known tooling note:** During the independent QA snapshot, tests, production build and TypeScript checks passed, while lint reported existing formatting/style violations. The lint command is included for visibility, not as a claim that it currently passes.

---

## 15. Testing, limitations and honest MVP boundaries

The most useful question for a hackathon project is not just "What does the concept promise?" but "What was actually tested?"

### Independent QA snapshot — 18 October 2026

An independent audit of the project source reported:

- **23 existing automated tests passed.**
- The production build completed successfully.
- TypeScript checking completed without diagnostics.
- The BFS solver agreed with an independent reachability/shortest-path check across **1,000 seeded boards**.
- Normal live movement, key/door behavior, rejected edits, repair proposals and multiplayer synchronization worked in an audit room.
- Both AI personas returned structured operations and explanations during live checks.

These are **results from a specific code snapshot**, not proof that every deployment state or network condition will always behave correctly.

### Known limitations

**Concurrent actions.** Controlled tests reproduced possible revision and proposal-status inconsistencies when reset, dismiss and approval overlap in particular ways. Those exact races were not reproduced against the live database. A production-ready editor should use stronger atomic transaction boundaries.

**Proof presentation.** The audit identified cases where a stored proposal's path could become stale after movement, and where an invalid operation could receive a misleading generic BFS-exhaustion explanation. The underlying server-side protection and the clarity of the UI should be evaluated separately.

**Room lifecycle.** The demo supports two seats, but does not yet provide a complete seat-release or recovery experience if a player closes a session and loses its stored identity.

**Scope of the verifier.** BFS proves reachability under the current maze mechanics. It is not a universal formal verification engine, an accessibility assessment, a quality score or an automated substitute for playtesting.

**Production readiness.** A fuller release would need more concurrency hardening, deeper resilience testing, broader accessibility support, richer content and sustained infrastructure/security review.

These boundaries are part of the project story: the goal of the hackathon MVP is to **demonstrate an original, working interaction**, establish what it does correctly, and make the next engineering challenges visible.

---

## 16. Live demo for judges

**[Launch PARADOX](https://paradox-puzzle-lab.lovable.app)**

A second participant is ideal, but you can demonstrate the two-player system on a single laptop.

### Setup

1. Open the website in a normal browser window.
2. Enter an alias and create a room as **Player 1 — WORLDWEAVER**.
3. Copy the room invite link from the header.
4. Open that link in an **incognito/private window** or a separate browser.
5. Join as **Player 2 — CHAOS ENGINE**.
6. Keep both browser sessions open during the demonstration. The current MVP has limited seat recovery after a session is lost.

### Suggested 90-second demonstration

| Moment | What to show | What it proves |
| --- | --- | --- |
| **00–15s: Shared world** | Move the character; point out both windows updating | Two sessions interact with the same game state |
| **15–30s: Agent proposes** | Ask one agent to add a creative obstacle | Natural language becomes a concrete proposed edit |
| **30–45s: Attempt impossibility** | Trigger **Attempt Impossible Edit** | The deterministic preset produces a rejected ghost edit |
| **45–60s: Proof Core** | Show rejection and the still-intact committed world | Validation is a gate before a change is applied |
| **60–75s: Repair** | Request an AI counterproposal or the labeled algorithmic fallback | Failed creative proposals can be reconsidered |
| **75–90s: Approve** | Approve a verified result; show both clients update | Human review, new revision and multiplayer convergence |

### Good things to explain while presenting

- The two named agents use **real model calls** to produce structured edit proposals.
- The "impossible edit" button is a **reliable test preset**, not a fake AI response.
- The Proof Core is independent deterministic code, not an LLM agreeing with itself.
- The game world only changes after review and a successful server-side verification step.
- The maze is the **MVP demonstration**, not the entire product vision.

For a clean demo, avoid resetting the level while another client is approving a proposal, and avoid dismissing and approving the same proposal simultaneously; those are known concurrency edge cases requiring further hardening.

---

## 17. Frequently asked questions

### Is PARADOX just a maze game?

**Today, PARADOX is a playable maze-based MVP.** Its longer-term idea is a collaborative creation experience in which multiple humans and AI agents shape interactive worlds under explicit, checkable constraints. The small maze makes that idea visible and testable.

### Why call it PARADOX?

Because the experience invites you to **break and rewrite the world**, while its central system refuses changes that would break the game's essential ability to be completed. Freedom and constraint are deliberately in tension.

### Do the agents really change the game?

They **propose** actual structured modifications that can be verified and approved. They do not silently bypass the approval process. A successful approved proposal changes the shared maze.

### What happens if an AI invents an invalid edit?

The server validates the structure and the game's editing rules. Invalid operations are rejected. A legal candidate that makes the exit unreachable is also rejected. An AI explanation alone is never enough to establish solvability.

### Is the impossible-edit button real AI?

**No.** It uses a deterministic exit-blocking preset to demonstrate a failing proposal consistently. Normal agent requests and agent repair requests use model responses; the separate repair fallback uses an algorithm. The UI distinguishes these sources.

### Can the AI guarantee that every future game will be fun?

No. The implemented verifier checks reachability, not creativity, balance or fun. More ambitious game types would need their own constraints and human judgment.

### Why is multiplayer essential?

Because independent creators can make different decisions about one shared artifact. PARADOX makes those interactions visible, checks their consequences and gives humans a way to resolve proposed changes rather than merely synchronizing them.

### What would make this a complete product?

A broader content system, more creative tools, richer world logic, stronger verification, more reliable concurrent editing, version control, session recovery, publishing/remixing and substantial playtesting. Those are future directions rather than features represented as finished.

---

## 18. Final thought

We built PARADOX around a simple but powerful question:

> **What if you could rewrite a game while playing it—and the game could still refuse to become impossible?**

The current version answers that question with one small maze, two humans, two AI agents, a deterministic Proof Core and a real approval workflow.

It is deliberately an **MVP**, not a finished platform. But the interaction points toward something much larger: worlds that players and AI can keep inventing together, where experimentation doesn't require giving up confidence in the rules that make an experience work.

### **PARADOX — Break the rules. Not the game.**

**[Play now](https://paradox-puzzle-lab.lovable.app)** · **[GitHub repository](https://github.com/nutssa/paradox)**  
*Built for Hacktoberfest Georgia 2026 · Multiplayer Agentic Experiences*
