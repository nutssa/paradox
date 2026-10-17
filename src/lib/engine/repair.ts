import { findExit } from "./level";
import { validateLevel } from "./ops";
import { COLS, MAX_OPS, MAX_REPAIR_OPS, ROWS, type Board, type EditOp, type PlayerState } from "./types";

export interface RepairResult {
  operations: EditOp[];
  explanation: string;
  pathLength: number;
}

/**
 * Deterministic "algorithmic fallback" repair. Strategy, in order:
 * 1. Keep every op of the rejected proposal and add ONE extra single-tile
 *    removal (wall/lava -> floor) elsewhere. Prefer the longest resulting path
 *    (keeps the proposer's intent and the challenge).
 * 2. Drop exactly one op of the rejected proposal (longest path wins).
 * Ties break on row-major order so results are reproducible.
 */
export function findSafeRepair(board: Board, player: PlayerState, rejected: EditOp[]): RepairResult | null {
  let best: RepairResult | null = null;
  const consider = (ops: EditOp[], why: string) => {
    const ev = validateLevel(board, player, ops, MAX_REPAIR_OPS);
    if (!ev.valid || !ev.verdict.solvable) return;
    if (!best || ev.verdict.pathLength > best.pathLength)
      best = { operations: ops, explanation: why, pathLength: ev.verdict.pathLength };
  };
  const used = new Set(rejected.map((o) => `${o.r},${o.c}`));
  if (rejected.length < MAX_REPAIR_OPS) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (used.has(`${r},${c}`)) continue;
        const t = board[r][c];
        if (t !== "WALL" && t !== "LAVA") continue;
        const extra: EditOp = { op: t === "WALL" ? "removeWall" : "removeLava", r, c };
        consider([...rejected, extra], `Kept all ${rejected.length} proposed edit(s) and opened (${r},${c}) so a path survives.`);
      }
  }
  if (!best && rejected.length > 1) {
    rejected.forEach((o, i) => {
      const ops = rejected.filter((_, j) => j !== i);
      consider(ops, `Dropped ${o.op}(${o.r},${o.c}) — the one edit that sealed the route.`);
    });
  }
  return best;
}

/** Demo preset: lava on every passable neighbour of the exit (max 3). Intentionally unsolvable. */
export function blockExitPreset(board: Board, player: PlayerState): EditOp[] {
  const ex = findExit(board);
  if (!ex) return [];
  const ops: EditOp[] = [];
  for (const [dr, dc] of [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
  ]) {
    const r = ex.r + dr;
    const c = ex.c + dc;
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
    if (r === player.r && c === player.c) continue;
    const t = board[r][c];
    if (t === "FLOOR" || t === "KEY" || t === "DOOR") ops.push({ op: "addLava", r, c });
  }
  return ops.slice(0, MAX_OPS);
}
