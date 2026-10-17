import { useMemo } from "react";
import { COLS, ROWS, type Board as BoardT, type EditOp, type PlayerState, type Pos } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

export interface BoardProps {
  board: BoardT;
  player: PlayerState;
  ghostOps?: EditOp[];
  ghostKind?: "ok" | "bad" | "draft";
  path?: Pos[];
  showPath?: boolean;
  pathKey?: string;
  onCellClick?: (r: number, c: number) => void;
  shake?: boolean;
}

const OP_ICON: Record<string, string> = {
  addWall: "▦",
  removeWall: "✕",
  addLava: "♨",
  removeLava: "✕",
  placeKey: "⚿",
  removeKey: "✕",
  placeDoor: "▥",
  removeDoor: "✕",
  moveExit: "⇲",
};

export function Board({ board, player, ghostOps = [], ghostKind = "ok", path = [], showPath, pathKey, onCellClick, shake }: BoardProps) {
  const ghost = useMemo(() => new Map(ghostOps.map((o) => [`${o.r},${o.c}`, o])), [ghostOps]);
  const pathIdx = useMemo(() => new Map(path.map((p, i) => [`${p.r},${p.c}`, i])), [path]);

  return (
    <div
      className={cn("chamber relative mx-auto w-full overflow-hidden rounded-xl p-2", shake && "anim-shake", ghostKind === "bad" && ghostOps.length && "glow-danger")}
      style={{ aspectRatio: `${COLS} / ${ROWS}` }}
    >
      <div className="grid h-full w-full gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {board.map((row, r) =>
          row.map((t, c) => {
            const g = ghost.get(`${r},${c}`);
            const pi = showPath ? pathIdx.get(`${r},${c}`) : undefined;
            return (
              <button
                key={`${r}-${c}-${pathKey ?? ""}`}
                type="button"
                aria-label={`cell ${r},${c} ${t}`}
                onClick={() => onCellClick?.(r, c)}
                className={cn("tile", `tile-${t}`, (r + c) % 2 && "alt", onCellClick ? "cursor-crosshair hover:brightness-150" : "cursor-default")}
              >
                {t === "KEY" && (
                  <svg viewBox="0 0 24 24" className="key-glow anim-bob absolute inset-[18%] text-lime" fill="currentColor" aria-hidden>
                    <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M11.5 11.5 20 20M16 16l2.5-2.5M18.5 18.5 21 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
                {t === "DOOR" && (
                  <span className={cn("rune-gate absolute inset-[8%] grid place-items-center rounded-sm font-pixel text-[clamp(8px,1.4vw,16px)]", player.hasKey ? "open text-lime" : "text-violet")}>
                    {player.hasKey ? "ᛟ" : "ᚱ"}
                  </span>
                )}
                {t === "EXIT" && (
                  <span className="exit-portal absolute inset-[10%] rounded-full p-[3px]" style={{ boxShadow: "0 0 18px var(--lime)" }}>
                    <span className="grid h-full w-full place-items-center rounded-full bg-background font-pixel text-[clamp(5px,0.8vw,9px)] text-lime">EXIT</span>
                  </span>
                )}
                {pi !== undefined && pi > 0 && t !== "EXIT" && (
                  <span className="path-dot absolute inset-[34%] rounded-full bg-lime glow-lime opacity-80" style={{ animationDelay: `${pi * 45}ms` }} />
                )}
                {g && (
                  <span className={cn("absolute inset-0 grid place-items-center font-pixel text-[clamp(10px,2vw,22px)] anim-ghost", ghostKind === "bad" ? "ghost-bad text-danger" : ghostKind === "draft" ? "ghost-draft text-peach" : "ghost-ok text-lime")}>
                    {OP_ICON[g.op]}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
      {/* player sprite, smoothly animated */}
      <div
        className="pointer-events-none absolute p-1 transition-all duration-150 ease-out"
        style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%`, left: `calc(${(player.c * 100) / COLS}%)`, top: `calc(${(player.r * 100) / ROWS}%)` }}
      >
        <div className="relative h-full w-full anim-bob">
          <div className="absolute inset-x-[14%] top-[8%] bottom-[16%] rounded-[40%_40%_30%_30%] border-2 border-background bg-chalk" style={{ boxShadow: "0 0 14px color-mix(in oklab, var(--chalk) 50%, transparent)" }}>
            <span className="anim-blink absolute left-[24%] top-[36%] h-[22%] w-[14%] rounded-full bg-background" />
            <span className="anim-blink absolute right-[24%] top-[36%] h-[22%] w-[14%] rounded-full bg-background" />
            <span className="absolute left-[38%] top-[66%] h-[8%] w-[24%] rounded-full bg-coral" />
          </div>
          <span className="absolute bottom-[6%] left-[26%] h-[12%] w-[16%] rounded-sm bg-violet" />
          <span className="absolute bottom-[6%] right-[26%] h-[12%] w-[16%] rounded-sm bg-violet" />
          {player.hasKey && (
            <svg viewBox="0 0 24 24" className="key-glow absolute -right-[10%] -top-[10%] h-[40%] w-[40%] text-lime" aria-hidden>
              <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M11.5 11.5 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
