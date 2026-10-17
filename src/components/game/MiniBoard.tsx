import { useMemo } from "react";
import { starter } from "@/lib/engine/level";
import { solve } from "@/lib/engine/solver";
import { Board } from "./Board";

/** Landing preview: the real starter level + its real solver proof. */
export function MiniBoard() {
  const { board, start, v } = useMemo(() => {
    const s = starter();
    return { ...s, v: solve(s.board, s.start) };
  }, []);
  return (
    <div className="arcade-card space-y-3 p-4">
      <div className="flex items-center justify-between font-pixel text-xs">
        <span className="text-muted-foreground">STARTER LEVEL · r1</span>
        <span className="text-lime">✔ VERIFIED · {v.pathLength} STEPS</span>
      </div>
      <Board board={board} player={start} path={v.path} showPath />
      <p className="font-mono text-xs text-muted-foreground">
        BFS over (row, col, hasKey) · {v.visitedStates} states · key required: {v.needsKey ? "yes" : "no"}
      </p>
    </div>
  );
}
