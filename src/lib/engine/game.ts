import { validateLevel, type Evaluation } from "./ops";
import { inBounds, passable } from "./solver";
import { MAX_REPAIR_OPS, type Board, type EditOp, type PlayerState } from "./types";

export type Dir = "up" | "down" | "left" | "right";
const D: Record<Dir, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

export interface MoveResult {
  ok: boolean;
  board: Board;
  player: PlayerState;
  pickedKey: boolean;
  won: boolean;
  reason?: string;
}

/** Pure, deterministic player move. KEY tiles are consumed into hasKey; doors stay open once you hold a key. */
export function movePlayer(board: Board, player: PlayerState, dir: Dir): MoveResult {
  const [dr, dc] = D[dir];
  const r = player.r + dr;
  const c = player.c + dc;
  if (!inBounds(r, c)) return { ok: false, board, player, pickedKey: false, won: false, reason: "edge of the world" };
  const t = board[r][c];
  if (!passable(t, player.hasKey))
    return { ok: false, board, player, pickedKey: false, won: false, reason: t === "DOOR" ? "door is locked — find the key" : `blocked by ${t.toLowerCase()}` };
  let b = board;
  let pickedKey = false;
  if (t === "KEY") {
    b = board.map((row) => row.slice());
    b[r][c] = "FLOOR";
    pickedKey = true;
  }
  return { ok: true, board: b, player: { r, c, hasKey: player.hasKey || pickedKey }, pickedKey, won: t === "EXIT" };
}

export interface CommitInput {
  latestBoard: Board;
  latestPlayer: PlayerState;
  latestRevision: number;
  baseRevision: number;
  operations: EditOp[];
}
export interface CommitResult extends Evaluation {
  committed: boolean;
  revalidated: boolean;
  newRevision: number;
}

/**
 * approveProposal core: ALWAYS re-validates on the latest authoritative state.
 * A stale proposal (base < latest) is never applied blindly.
 */
export function commitProposal(i: CommitInput): CommitResult {
  const ev = validateLevel(i.latestBoard, i.latestPlayer, i.operations, MAX_REPAIR_OPS);
  const committed = ev.valid && ev.verdict.solvable;
  return {
    ...ev,
    committed,
    revalidated: i.baseRevision !== i.latestRevision,
    newRevision: committed ? i.latestRevision + 1 : i.latestRevision,
  };
}
