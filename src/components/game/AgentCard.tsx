import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChaosSigil, OracleSigil } from "./Sigils";

export interface ChatEvent {
  id: number;
  kind: string;
  message: string;
  created_at: string;
  data: { intent?: string; operations?: { op: string; r: number; c: number }[] } | null;
}

const EXAMPLES: Record<1 | 2, string[]> = {
  1: ["Add a wall to make a nicer detour", "Make this harder but still winnable", "Move the key somewhere more interesting"],
  2: ["Trap the exit with lava", "Add a lava chokepoint near the player", "Make this harder but still winnable"],
};

export function AgentCard({
  slot,
  alias,
  online,
  mine,
  events,
  busy,
  onSend,
}: {
  slot: 1 | 2;
  alias?: string;
  online?: boolean;
  mine: boolean;
  events: ChatEvent[];
  busy: boolean;
  onSend: (prompt: string) => void;
}) {
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [events.length, busy]);
  const name = slot === 1 ? "WORLDWEAVER" : "CHAOS ENGINE";
  const accent = slot === 1 ? "text-violet" : "text-coral";
  const lastAi = [...events].reverse().find((e) => e.kind === "chat_agent" || e.kind === "ai_error");
  const aiState = busy ? "THINKING" : !lastAi ? "MODEL READY" : lastAi.kind === "ai_error" ? "AI UNAVAILABLE" : "MODEL CONNECTED";
  const send = (p: string) => {
    if (!p.trim() || busy) return;
    onSend(p.trim());
    setText("");
  };

  return (
    <aside className={cn("arcade-card flex min-h-[420px] flex-col", mine && (slot === 1 ? "border-violet glow-violet" : "border-coral"))}>
      <header className="border-b-2 border-border p-3">
        <div className="flex items-center gap-3">
          {slot === 1 ? <OracleSigil className="h-11 w-11 shrink-0" active={busy} /> : <ChaosSigil className="h-11 w-11 shrink-0" active={busy} />}
          <div className="min-w-0 flex-1">
            <span className={cn("font-pixel text-sm", accent)}>{name}</span>
            <p className="font-pixel text-[9px] text-muted-foreground">P{slot} AGENT · {slot === 1 ? "THE ORACLE" : "THE TRICKSTER"}</p>
          </div>
          <span className={cn("h-2 w-2 rounded-full", online ? "bg-lime glow-lime" : "bg-muted-foreground")} title={online ? "player online" : "player offline"} />
        </div>
        <span className={cn("mt-2 inline-block rounded border px-1.5 font-pixel text-[9px]", aiState === "AI UNAVAILABLE" ? "border-danger text-danger" : "border-border text-muted-foreground")}>{aiState} · openai/gpt-6-astra</span>
        <p className="mt-1 text-xs text-muted-foreground">
          {alias ? `${alias}${mine ? " (you)" : ""}` : "waiting for player…"} · {slot === 1 ? "creative but completable" : "clever traps, fair play"}
        </p>
      </header>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" style={{ maxHeight: 360 }}>
        {events.length === 0 && <p className="text-xs text-muted-foreground">No conversation yet.{mine ? " Ask your agent for a change." : ""}</p>}
        {events.map((e) => (
          <div key={e.id} className="anim-rise">
            {e.kind === "chat_user" && (
              <div className="ml-6 rounded border border-border bg-muted px-2 py-1.5">
                <span className="font-pixel text-[10px] text-peach">HUMAN</span>
                <p>{e.message}</p>
              </div>
            )}
            {e.kind === "chat_agent" && (
              <div className={cn("mr-4 rounded border-2 px-2 py-1.5", slot === 1 ? "border-violet/50" : "border-coral/50")}>
                <span className={cn("font-pixel text-[10px]", accent)}>{name} · LIVE MODEL</span>
                {typeof e.data?.intent === "string" && <p className="font-semibold">{e.data.intent}</p>}
                <p className="text-muted-foreground">{e.message}</p>
                {Array.isArray(e.data?.operations) && (
                  <code className="mt-1 block font-mono text-[11px] text-foreground/80">
                    {(e.data.operations as { op: string; r: number; c: number }[]).map((o) => `${o.op}(${o.r},${o.c})`).join(" · ")}
                  </code>
                )}
              </div>
            )}
            {e.kind === "ai_error" && (
              <div className="rounded border-2 border-danger/60 px-2 py-1.5 text-xs text-danger">
                <span className="font-pixel">⚠ AI UNAVAILABLE</span>
                <p>{e.message.replace(/^AI unavailable:\s*/, "")}</p>
              </div>
            )}
          </div>
        ))}
        {busy && <p className={cn("font-pixel text-xs anim-ghost", accent)}>{name} is thinking…</p>}
      </div>
      {mine ? (
        <div className="space-y-2 border-t-2 border-border p-3">
          <div className="flex flex-wrap gap-1">
            {EXAMPLES[slot].map((ex) => (
              <button key={ex} disabled={busy} onClick={() => send(ex)} className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-lime hover:text-lime disabled:opacity-40">
                {ex}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <textarea
              value={text}
              maxLength={500}
              rows={2}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              placeholder={`Tell ${name} what to change…`}
              className="flex-1 resize-none rounded border-2 border-input bg-background px-2 py-1 text-sm outline-none focus:border-ring"
            />
            <Button type="submit" variant={slot === 1 ? "violet" : "danger"} disabled={busy || !text.trim()}>
              ASK
            </Button>
          </form>
        </div>
      ) : (
        <p className="border-t-2 border-border p-3 text-xs text-muted-foreground">Read-only: this agent belongs to the other player. Its context includes your actions too.</p>
      )}
    </aside>
  );
}
