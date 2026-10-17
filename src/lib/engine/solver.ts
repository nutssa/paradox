import { findExit } from "./level";
import { COLS, ROWS, type Board, type Constraint, type PlayerState, type Pos, type Verdict } from "./types";

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function inBounds(r: number, c: number) {
  return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

/** Can a walker with `hasKey` stand on tile? */
export function passable(t: string, hasKey: boolean) {
  if (t === "WALL" || t === "LAVA") return false;
  if (t === "DOOR") return hasKey;
  return true;
}

/**
 * Deterministic BFS over (row, col, hasKey). Finds the shortest path from the
 * CURRENT player state to the exit. Picking up any KEY sets hasKey.
 */
export function solve(board: Board, player: PlayerState): Verdict {
  const constraints: Constraint[] = [];
  const exit = findExit(board);
  constraints.push({ name: "exit exists", ok: !!exit, detail: exit ? `exit at (${exit.r},${exit.c})` : "no EXIT tile" });
  const pOk = inBounds(player.r, player.c) && passable(board[player.r][player.c], player.hasKey);
  constraints.push({
    name: "player tile safe",
    ok: pOk,
    detail: pOk ? `player at (${player.r},${player.c})` : "player stands on wall/lava/locked door",
  });
  const fail = (reason: string, visited = 0, needsKey = false): Verdict => ({
    solvable: false,
    path: [],
    pathLength: 0,
    visitedStates: visited,
    needsKey,
    reason,
    constraints: [...constraints, { name: "exit reachable", ok: false, detail: reason }],
  });
  if (!exit) return fail("There is no exit on the board.");
  if (!pOk) return fail("The player is standing on an impassable tile.");

  const key = (r: number, c: number, k: boolean) => (r * COLS + c) * 2 + (k ? 1 : 0);
  const prev = new Map<number, number>();
  const start = key(player.r, player.c, player.hasKey);
  prev.set(start, -1);
  const queue: [number, number, boolean][] = [[player.r, player.c, player.hasKey]];
  let head = 0;
  let found: number | null = null;
  let keyReachable = player.hasKey;
  let doorSeen = false;

  while (head < queue.length) {
    const [r, c, k] = queue[head++];
    if (r === exit.r && c === exit.c) {
      found = key(r, c, k);
      break;
    }
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const t = board[nr][nc];
      if (t === "DOOR" && !k) doorSeen = true;
      if (!passable(t, k)) continue;
      const nk = k || t === "KEY";
      if (t === "KEY") keyReachable = true;
      const id = key(nr, nc, nk);
      if (prev.has(id)) continue;
      prev.set(id, key(r, c, k));
      queue.push([nr, nc, nk]);
    }
  }

  if (found === null) {
    let reason = "Every route from the player to the exit is blocked by walls or lava.";
    if (doorSeen && !keyReachable) reason = "A locked door blocks the way and no reachable key exists.";
    return fail(reason, queue.length, doorSeen);
  }

  const path: Pos[] = [];
  let cur: number = found;
  let usedKey = false;
  while (cur !== -1) {
    const cell = Math.floor(cur / 2);
    path.push({ r: Math.floor(cell / COLS), c: cell % COLS });
    const p = prev.get(cur)!;
    if (p !== -1 && p % 2 === 0 && cur % 2 === 1) usedKey = true;
    cur = p;
  }
  path.reverse();
  const needsKey = path.some((p) => board[p.r][p.c] === "DOOR");
  constraints.push({ name: "exit reachable", ok: true, detail: `shortest path ${path.length - 1} steps` });
  constraints.push({
    name: "door/key order",
    ok: true,
    detail: needsKey ? (usedKey || player.hasKey ? "key collected before door" : "key held") : "no door on path",
  });
  return {
    solvable: true,
    path,
    pathLength: path.length - 1,
    visitedStates: queue.length,
    needsKey,
    reason: "Exit reachable from the current player position.",
    constraints,
  };
}
