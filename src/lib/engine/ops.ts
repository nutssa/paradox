import { z } from "zod";
import { cloneBoard, findExit } from "./level";
import { inBounds, solve } from "./solver";
import { MAX_OPS, MAX_REPAIR_OPS, OP_TYPES, type Board, type EditOp, type PlayerState, type Tile, type Verdict } from "./types";

export const EditOpSchema = z.object({
  op: z.enum(OP_TYPES as [string, ...string[]]),
  r: z.number().int(),
  c: z.number().int(),
}) as unknown as z.ZodType<EditOp>;

export const ProposalSchema = z.object({
  operations: z.array(EditOpSchema).min(1).max(MAX_REPAIR_OPS),
  explanation: z.string().max(600),
  intent: z.string().max(160),
});
export type ProposalPayload = z.infer<typeof ProposalSchema>;

// Which tiles each op may target, and what it turns them into.
const RULES: Record<Exclude<EditOp["op"], "moveExit">, { from: Tile[]; to: Tile }> = {
  addWall: { from: ["FLOOR", "KEY", "DOOR"], to: "WALL" },
  removeWall: { from: ["WALL"], to: "FLOOR" },
  addLava: { from: ["FLOOR", "KEY", "DOOR"], to: "LAVA" },
  removeLava: { from: ["LAVA"], to: "FLOOR" },
  placeKey: { from: ["FLOOR"], to: "KEY" },
  removeKey: { from: ["KEY"], to: "FLOOR" },
  placeDoor: { from: ["FLOOR"], to: "DOOR" },
  removeDoor: { from: ["DOOR"], to: "FLOOR" },
};

export interface ApplyResult {
  ok: boolean;
  board: Board;
  errors: string[];
}

/** Apply ops sequentially with boundary/occupancy validation. Never mutates input. */
export function applyOps(board: Board, player: PlayerState, ops: EditOp[], maxOps = MAX_OPS): ApplyResult {
  const errors: string[] = [];
  const b = cloneBoard(board);
  if (ops.length === 0) errors.push("proposal has no operations");
  if (ops.length > maxOps) errors.push(`too many operations (${ops.length} > ${maxOps})`);
  const touched = new Set<string>();
  ops.forEach((o, i) => {
    const tag = `op ${i + 1} ${o.op}(${o.r},${o.c})`;
    if (!OP_TYPES.includes(o.op)) return errors.push(`${tag}: unknown operation`);
    if (!inBounds(o.r, o.c)) return errors.push(`${tag}: out of bounds`);
    const k = `${o.r},${o.c}`;
    if (touched.has(k)) return errors.push(`${tag}: cell edited twice`);
    touched.add(k);
    if (o.r === player.r && o.c === player.c) return errors.push(`${tag}: cannot edit the player's tile`);
    const cur = b[o.r][o.c];
    if (o.op === "moveExit") {
      if (cur !== "FLOOR") return errors.push(`${tag}: exit can only move onto FLOOR`);
      const ex = findExit(b);
      if (ex) b[ex.r][ex.c] = "FLOOR";
      b[o.r][o.c] = "EXIT";
      return;
    }
    if (cur === "EXIT") return errors.push(`${tag}: cannot overwrite the exit`);
    const rule = RULES[o.op];
    if (!rule.from.includes(cur)) return errors.push(`${tag}: target is ${cur}, expected ${rule.from.join("/")}`);
    b[o.r][o.c] = rule.to;
  });
  return { ok: errors.length === 0, board: errors.length ? board : b, errors };
}

export interface Evaluation {
  valid: boolean; // ops legal
  errors: string[];
  board: Board; // resulting board (or original if invalid)
  verdict: Verdict;
}

/** validateLevel: apply ops + run deterministic solver from the CURRENT player. */
export function validateLevel(board: Board, player: PlayerState, ops: EditOp[], maxOps = MAX_OPS): Evaluation {
  const res = applyOps(board, player, ops, maxOps);
  if (!res.ok) {
    const v = solve(board, player);
    return {
      valid: false,
      errors: res.errors,
      board,
      verdict: {
        ...v,
        solvable: false,
        reason: `Invalid edit: ${res.errors[0]}`,
        constraints: [{ name: "operations legal", ok: false, detail: res.errors.join("; ") }, ...v.constraints],
      },
    };
  }
  const verdict = solve(res.board, player);
  verdict.constraints.unshift({ name: "operations legal", ok: true, detail: `${ops.length} op(s) in bounds, no protected tiles` });
  return { valid: true, errors: [], board: res.board, verdict };
}
