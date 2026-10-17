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
      className={cn("scanlines relative mx-auto w-full overflow-hidden rounded border-4 border-border bg-muted p-1", shake && "anim-shake", ghostKind === "bad" && ghostOps.length && "glow-danger")}
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
                {t === "KEY" && <span className="absolute inset-0 grid place-items-center text-[clamp(10px,2.4vw,26px)] text-[var(--tile-key)] anim-bob">⚿</span>}
                {t === "DOOR" && (
                  <span className="absolute inset-[12%] grid place-items-center rounded-sm border-2 border-[var(--tile-key)] bg-[var(--tile-door)] text-[clamp(8px,1.4vw,16px)] text-[var(--tile-key)]">
                    {player.hasKey ? "◌" : "🔒"}
                  </span>
                )}
                {t === "EXIT" && (
                  <span className="absolute inset-[10%] grid place-items-center rounded-sm border-2 border-lime font-pixel text-[clamp(6px,1vw,11px)] text-lime" style={{ animation: "pulse-ring 1.6s infinite" }}>
                    EXIT
                  </span>
                )}
                {pi !== undefined && pi > 0 && t !== "EXIT" && (
                  <span className="path-dot absolute inset-[34%] rounded-full bg-lime glow-lime" style={{ animationDelay: `${pi * 45}ms` }} />
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
        <div className="relative h-full w-full rounded-sm border-2 border-background bg-peach glow-lime anim-bob">
          <span className="absolute left-[22%] top-[30%] h-[18%] w-[16%] bg-background" />
          <span className="absolute right-[22%] top-[30%] h-[18%] w-[16%] bg-background" />
          {player.hasKey && <span className="absolute -right-1 -top-2 text-[clamp(8px,1.2vw,14px)] text-[var(--tile-key)]">⚿</span>}
        </div>
      </div>
    </div>
  );
}
