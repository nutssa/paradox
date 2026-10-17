import { describe, expect, it } from "vitest";
import { parseLevel, starter } from "./level";
import { solve } from "./solver";
import { applyOps, validateLevel } from "./ops";
import { blockExitPreset, findSafeRepair } from "./repair";
import { commitProposal, movePlayer } from "./game";

const lvl = (rows: string[]) => {
  const pad = (s: string) => s.padEnd(12, "#");
  const all = [...rows.map(pad)];
  while (all.length < 9) all.push("############");
  return parseLevel(all);
};

describe("solver", () => {
  it("starter level is solvable and needs the key", () => {
    const { board, start } = starter();
    const v = solve(board, start);
    expect(v.solvable).toBe(true);
    expect(v.needsKey).toBe(true);
    expect(v.path[0]).toEqual({ r: 0, c: 0 });
    expect(v.path[v.path.length - 1]).toEqual({ r: 8, c: 11 });
  });

  it("finds the shortest path in a corridor", () => {
    const { board, start } = lvl(["S...E"]);
    expect(solve(board, start).pathLength).toBe(4);
  });

  it("locked door without key is unsolvable with reason", () => {
    const { board, start } = lvl(["S.D.E"]);
    const v = solve(board, start);
    expect(v.solvable).toBe(false);
    expect(v.reason).toMatch(/locked door/);
  });

  it("key before door makes it solvable", () => {
    const { board, start } = lvl(["SkD.E"]);
    expect(solve(board, start).solvable).toBe(true);
  });

  it("lava is impassable", () => {
    const { board, start } = lvl(["S.~.E"]);
    expect(solve(board, start).solvable).toBe(false);
  });

  it("checks from the CURRENT player position, not start", () => {
    const { board } = lvl(["S.#.E"]);
    expect(solve(board, { r: 0, c: 3, hasKey: false }).solvable).toBe(true);
    expect(solve(board, { r: 0, c: 0, hasKey: false }).solvable).toBe(false);
  });

  it("player trapped by surrounding walls", () => {
    const { board } = lvl(["S...E", ".#...", "#.#..", ".#..."]);
    expect(solve(board, { r: 2, c: 1, hasKey: false }).solvable).toBe(false);
  });
});

describe("operations", () => {
  it("rejects editing the player tile", () => {
    const { board, start } = starter();
    expect(applyOps(board, start, [{ op: "addWall", r: 0, c: 0 }]).ok).toBe(false);
  });
  it("rejects overwriting the exit", () => {
    const { board, start } = starter();
    expect(applyOps(board, start, [{ op: "addLava", r: 8, c: 11 }]).ok).toBe(false);
  });
  it("rejects out of bounds and more than 3 ops", () => {
    const { board, start } = starter();
    expect(applyOps(board, start, [{ op: "addWall", r: 9, c: 0 }]).ok).toBe(false);
    const four = [0, 1, 2, 3].map((c) => ({ op: "addWall" as const, r: 4, c }));
    expect(applyOps(board, start, four).ok).toBe(false);
  });
  it("rejects wrong source tile", () => {
    const { board, start } = starter();
    expect(applyOps(board, start, [{ op: "removeWall", r: 0, c: 1 }]).ok).toBe(false);
  });
  it("does not mutate input board", () => {
    const { board, start } = starter();
    applyOps(board, start, [{ op: "addWall", r: 0, c: 1 }]);
    expect(board[0][1]).toBe("FLOOR");
  });
  it("moveExit relocates the exit", () => {
    const { board, start } = lvl(["S...E"]);
    const r = applyOps(board, start, [{ op: "moveExit", r: 0, c: 2 }]);
    expect(r.ok).toBe(true);
    expect(r.board[0][2]).toBe("EXIT");
    expect(r.board[0][4]).toBe("FLOOR");
  });
});

describe("blocking + repair", () => {
  it("block-the-exit preset is unsolvable and repair restores reachability", () => {
    const { board, start } = starter();
    const ops = blockExitPreset(board, start);
    expect(ops.length).toBeGreaterThan(0);
    expect(validateLevel(board, start, ops).verdict.solvable).toBe(false);
    const fix = findSafeRepair(board, start, ops);
    expect(fix).not.toBeNull();
    expect(validateLevel(board, start, fix!.operations, 4).verdict.solvable).toBe(true);
  });
  it("repair is deterministic", () => {
    const { board, start } = starter();
    const ops = blockExitPreset(board, start);
    expect(findSafeRepair(board, start, ops)).toEqual(findSafeRepair(board, start, ops));
  });
});

describe("moves and revisions", () => {
  it("picks up key and opens door", () => {
    const { board, start } = lvl(["SkD.E"]);
    const m1 = movePlayer(board, start, "right");
    expect(m1.player.hasKey).toBe(true);
    expect(m1.board[0][1]).toBe("FLOOR");
    expect(movePlayer(m1.board, m1.player, "right").ok).toBe(true);
  });
  it("cannot walk into lava", () => {
    const { board, start } = lvl(["S~..E"]);
    expect(movePlayer(board, start, "right").ok).toBe(false);
  });
  it("stale proposal is revalidated on latest state and rejected if it now blocks", () => {
    const { board, start } = lvl(["S...E", "#.###"]);
    // P1 proposes wall at (0,2) based on rev 1 — fine because (1,1)... actually row1 blocked
    // Meanwhile rev 2 committed a wall at (0,3): latest board.
    const latest = applyOps(board, start, [{ op: "addWall", r: 0, c: 3 }]).board;
    const res = commitProposal({ latestBoard: latest, latestPlayer: start, latestRevision: 2, baseRevision: 1, operations: [{ op: "addWall", r: 0, c: 1 }] });
    expect(res.revalidated).toBe(true);
    expect(res.committed).toBe(false);
    expect(res.newRevision).toBe(2);
  });
  it("valid commit bumps revision by exactly one", () => {
    const { board, start } = starter();
    const res = commitProposal({ latestBoard: board, latestPlayer: start, latestRevision: 5, baseRevision: 5, operations: [{ op: "addWall", r: 4, c: 0 }] });
    expect(res.committed).toBe(true);
    expect(res.newRevision).toBe(6);
  });
});
