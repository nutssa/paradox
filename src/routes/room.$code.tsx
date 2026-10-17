import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Board } from "@/components/game/Board";
import { AgentCard, type ChatEvent } from "@/components/game/AgentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRoom } from "@/hooks/use-room";
import { loadSeat, saveSeat, type Seat } from "@/lib/session";
import { validateLevel } from "@/lib/engine/ops";
import type { EditOp, OpType } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import {
  approveProposal,
  blockExitDemo,
  dismissProposal,
  findSafeRepairFn,
  joinRoomFn,
  movePlayerFn,
  proposeEdits,
  proposeManual,
  requestCounterproposal,
  resetLevelFn,
} from "@/lib/room.functions";

export const Route = createFileRoute("/room/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `PARADOX · Room ${params.code}` },
      { name: "description", content: `Join PARADOX room ${params.code}: co-edit a live puzzle with two AI agents.` },
      { property: "og:title", content: `PARADOX · Room ${params.code}` },
      { property: "og:description", content: "Two humans, two agents, one proof engine. Join the room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const [seat, setSeat] = useState<Seat | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSeat(loadSeat(code));
    setReady(true);
  }, [code]);
  if (!ready) return null;
  if (!seat) return <JoinGate code={code} onJoined={setSeat} />;
  return <Game code={code.toUpperCase()} seat={seat} />;
}

function JoinGate({ code, onJoined }: { code: string; onJoined: (s: Seat) => void }) {
  const join = useServerFn(joinRoomFn);
  const [alias, setAlias] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="arcade-card w-full max-w-sm space-y-4 p-6 anim-rise">
        <h1 className="font-pixel text-3xl text-lime text-glow">PARADOX</h1>
        <p className="text-sm text-muted-foreground">
          You're invited to room <span className="font-pixel text-peach">{code.toUpperCase()}</span> as Player 2 with the <span className="text-violet">CHAOS ENGINE</span> agent.
        </p>
        <Input value={alias} maxLength={20} onChange={(e) => setAlias(e.target.value)} placeholder="Your alias" />
        <Button
          variant="violet"
          className="w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await join({ data: { code: code.toUpperCase(), alias: alias || "Guest" } });
              const s = { token: r.token, slot: 2 as const };
              saveSeat(r.code, s);
              onJoined(s);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not join");
              setBusy(false);
            }
          }}
        >
          ▶ JOIN ROOM
        </Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-lime">
          ← back
        </Link>
      </div>
    </main>
  );
}

const TOOLS: { op: OpType; label: string }[] = [
  { op: "addWall", label: "+WALL" },
  { op: "removeWall", label: "−WALL" },
  { op: "addLava", label: "+LAVA" },
  { op: "removeLava", label: "−LAVA" },
  { op: "placeKey", label: "+KEY" },
  { op: "placeDoor", label: "+DOOR" },
  { op: "removeDoor", label: "−DOOR" },
  { op: "moveExit", label: "EXIT→" },
];

const STATUS_STYLE: Record<string, string> = {
  verified: "border-lime text-lime",
  rejected: "border-danger text-danger",
  approved: "border-violet text-violet",
  superseded: "border-border text-muted-foreground",
  dismissed: "border-border text-muted-foreground",
};

function Game({ code, seat }: { code: string; seat: Seat }) {
  const { snap, mode, lastSync, error, ping } = useRoom(code, seat.token);
  const auth = { code, token: seat.token };
  const fMove = useServerFn(movePlayerFn);
  const fPropose = useServerFn(proposeEdits);
  const fManual = useServerFn(proposeManual);
  const fBlock = useServerFn(blockExitDemo);
  const fCounter = useServerFn(requestCounterproposal);
  const fRepair = useServerFn(findSafeRepairFn);
  const fApprove = useServerFn(approveProposal);
  const fDismiss = useServerFn(dismissProposal);
  const fReset = useServerFn(resetLevelFn);

  const [busy, setBusy] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(true);
  const [tool, setTool] = useState<OpType | null>(null);
  const [draft, setDraft] = useState<EditOp[]>([]);
  const [savedMoment, setSavedMoment] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  const [shake, setShake] = useState(false);
  const seenRejected = useRef<string | null>(null);
  const seenWins = useRef<number | null>(null);

  const active = useMemo(() => {
    const p = snap?.proposals[0];
    return p && (p.status === "verified" || p.status === "rejected") ? p : null;
  }, [snap]);

  // "The solver saved the game" moment — on both clients
  useEffect(() => {
    const p = snap?.proposals[0];
    if (!p) return;
    if (seenRejected.current === null) {
      seenRejected.current = p.id;
      return;
    }
    if (p.status === "rejected" && seenRejected.current !== p.id) {
      seenRejected.current = p.id;
      setSavedMoment(p.verdict?.reason ?? "No path to the exit.");
      setShake(true);
      setTimeout(() => setShake(false), 700);
      setTimeout(() => setSavedMoment(null), 3800);
    } else if (p.status !== "rejected") seenRejected.current = p.id;
  }, [snap]);
  useEffect(() => {
    if (!snap) return;
    if (seenWins.current !== null && snap.room.wins > seenWins.current) {
      setWin(true);
      setTimeout(() => setWin(false), 3500);
    }
    seenWins.current = snap.room.wins;
  }, [snap]);

  const run = useCallback(
    async (label: string, fn: () => Promise<{ ok: boolean; error?: string } | unknown>) => {
      setBusy(label);
      try {
        const r = (await fn()) as { ok?: boolean; error?: string };
        if (r && r.ok === false && r.error) toast.error(r.error);
        await ping();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusy(null);
      }
    },
    [ping],
  );

  const moving = useRef(false);
  const move = useCallback(
    async (dir: "up" | "down" | "left" | "right") => {
      if (moving.current) return;
      moving.current = true;
      try {
        const r = await fMove({ data: { ...auth, dir } });
        if (!r.ok) toast(r.reason ?? "blocked", { duration: 1200 });
        await ping();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "move failed");
      } finally {
        moving.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fMove, ping, code, seat.token],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const map: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        void move(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  if (!snap) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="font-pixel text-lime anim-ghost">{error ? `⚠ ${error}` : "SYNCING ROOM…"}</p>
        {error && (
          <Link to="/" className="font-pixel text-xs text-muted-foreground">
            ← home
          </Link>
        )}
      </main>
    );
  }

  const { room, me, players, events, proposals } = snap;
  const p1 = players.find((p) => p.slot === 1);
  const p2 = players.find((p) => p.slot === 2);
  const chatFor = (slot: number) => events.filter((e) => e.slot === slot && (e.kind === "chat_user" || e.kind === "chat_agent" || e.kind === "ai_error")) as ChatEvent[];
  const logEvents = events.filter((e) => !e.kind.startsWith("chat"));

  // draft preview (local only until proposed)
  const draftEval = draft.length ? validateLevel(room.board, room.player, draft) : null;
  const preview = draftEval
    ? { ops: draft, kind: "draft" as const, verdict: draftEval.verdict, label: "DRAFT (local)" }
    : active
      ? { ops: active.operations, kind: active.status === "rejected" ? ("bad" as const) : ("ok" as const), verdict: active.verdict, label: active.status.toUpperCase() }
      : null;
  const proofVerdict = preview?.verdict && preview.verdict.solvable ? preview.verdict : snap.verdict;
  const proofSubject = preview?.verdict ? (preview.kind === "draft" ? "draft preview" : `proposal by P${active?.proposerSlot}`) : `current board r${room.revision}`;
  const shownVerdict = preview?.verdict ?? snap.verdict;
  const other = me.slot === 1 ? 2 : 1;
  const link = typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : "";

  const onCell = (r: number, c: number) => {
    if (!tool) return;
    setDraft((d) => {
      const without = d.filter((o) => !(o.r === r && o.c === c));
      if (without.length !== d.length) return without;
      if (d.length >= 3) {
        toast("Max 3 operations per proposal");
        return d;
      }
      return [...d, { op: tool, r, c }];
    });
  };

  return (
    <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-4">
      {/* top bar */}
      <header className="arcade-card flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="font-pixel text-2xl text-lime text-glow">
          PARADOX
        </Link>
        <span className="hidden font-pixel text-xs text-peach md:inline">Break the rules. Not the game.</span>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-muted-foreground">ROOM</span>
          <button
            className="rounded border-2 border-peach px-2 font-pixel tracking-widest text-peach hover:bg-peach hover:text-accent-foreground"
            onClick={() => {
              void navigator.clipboard.writeText(link);
              toast.success("Invite link copied");
            }}
            title="Copy invite link"
          >
            {room.code} ⧉
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[p1, p2].map((p, i) => (
            <span key={i} className={cn("flex items-center gap-1", i === 0 ? "text-lime" : "text-violet")}>
              <span className={cn("h-2 w-2 rounded-full", p?.online ? "bg-current" : "bg-muted-foreground")} />
              P{i + 1} {p?.alias ?? "—"}
              {p?.slot === me.slot && " (you)"}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4 font-mono text-xs">
          <span className="text-muted-foreground">
            REV <b className="text-foreground">r{room.revision}</b>
          </span>
          <span className="text-muted-foreground">
            WINS <b className="text-foreground">{room.wins}</b>
          </span>
          <span className={cn(snap.verdict.solvable ? "text-lime" : "text-danger")}>{snap.verdict.solvable ? `✔ SOLVABLE · ${snap.verdict.pathLength}` : "✖ UNSOLVABLE"}</span>
          <span className={cn("rounded border px-1.5 py-0.5", mode === "realtime" ? "border-lime text-lime" : "border-peach text-peach")} title={`last sync ${new Date(lastSync).toLocaleTimeString()}`}>
            {mode === "realtime" ? "● LIVE" : mode === "polling" ? "◐ POLLING 2s" : "○ CONNECTING"}
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px]">
        <AgentCard slot={1} alias={p1?.alias} online={p1?.online} mine={me.slot === 1} events={chatFor(1)} busy={busy === "ai1"} onSend={(prompt) => run("ai1", () => fPropose({ data: { ...auth, prompt } }))} />

        {/* center */}
        <section className="space-y-3">
          <div className="relative">
            <Board
              board={room.board}
              player={room.player}
              ghostOps={preview?.ops}
              ghostKind={preview?.kind}
              path={proofVerdict.path}
              showPath={showProof}
              pathKey={`${room.revision}-${room.moveSeq}-${active?.id ?? ""}-${draft.length}`}
              onCellClick={tool ? onCell : undefined}
              shake={shake}
            />
            {savedMoment && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="arcade-card anim-rise glow-danger max-w-md border-danger p-5 text-center">
                  <p className="font-pixel text-2xl text-danger text-glow">⛨ THE SOLVER SAVED THE GAME</p>
                  <p className="mt-2 text-sm text-muted-foreground">{savedMoment}</p>
                </div>
              </div>
            )}
            {win && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="arcade-card anim-rise glow-lime border-lime p-6 text-center">
                  <p className="font-pixel text-4xl text-lime text-glow">YOU WIN!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Exit reached. Map reset.</p>
                </div>
              </div>
            )}
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-1">
              <span />
              <Button size="icon" variant="pixel" onClick={() => move("up")} aria-label="up">▲</Button>
              <span />
              <Button size="icon" variant="pixel" onClick={() => move("left")} aria-label="left">◀</Button>
              <Button size="icon" variant="pixel" onClick={() => move("down")} aria-label="down">▼</Button>
              <Button size="icon" variant="pixel" onClick={() => move("right")} aria-label="right">▶</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              WASD / arrows move the shared player.
              <br />
              Key: {room.player.hasKey ? <span className="text-[var(--tile-key)]">⚿ held</span> : "not yet"}
            </p>
            <label className="ml-auto flex items-center gap-2 font-pixel text-xs">
              <Switch checked={showProof} onCheckedChange={setShowProof} /> SHOW PROOF
            </label>
          </div>

          {/* active proposal */}
          <ProposalBar
            active={active}
            meSlot={me.slot}
            busy={busy}
            onApprove={(id) => run("approve", () => fApprove({ data: { ...auth, proposalId: id } }))}
            onDismiss={(id) => run("dismiss", () => fDismiss({ data: { ...auth, proposalId: id } }))}
            onCounter={(id) => run(`ai${me.slot}`, () => fCounter({ data: { ...auth, proposalId: id } }))}
            onRepair={(id) => run("repair", () => fRepair({ data: { ...auth, proposalId: id } }))}
            revision={room.revision}
            other={other}
          />

          {/* manual editor */}
          <div className="arcade-card space-y-2 p-3">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-2 font-pixel text-xs text-muted-foreground">MANUAL EDIT</span>
              {TOOLS.map((t) => (
                <button
                  key={t.op}
                  onClick={() => setTool(tool === t.op ? null : t.op)}
                  className={cn("rounded border-2 px-2 py-0.5 font-pixel text-[11px] transition-colors", tool === t.op ? "border-peach bg-peach text-accent-foreground" : "border-border text-muted-foreground hover:border-peach")}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tool && <p className="text-xs text-peach">Click cells to stage up to 3 ops (click again to remove). The solver previews instantly.</p>}
            <div className="flex flex-wrap items-center gap-2">
              {draft.length > 0 && (
                <>
                  <code className="font-mono text-xs">{draft.map((o) => `${o.op}(${o.r},${o.c})`).join(" · ")}</code>
                  <span className={cn("font-pixel text-xs", draftEval?.verdict.solvable ? "text-lime" : "text-danger")}>{draftEval?.verdict.solvable ? "✔ would verify" : `✖ ${draftEval?.verdict.reason}`}</span>
                  <Button
                    size="sm"
                    variant="peach"
                    disabled={!!busy}
                    onClick={() =>
                      run("manual", async () => {
                        const r = await fManual({ data: { ...auth, operations: draft, intent: "Hand edit", source: "manual" } });
                        setDraft([]);
                        setTool(null);
                        return r;
                      })
                    }
                  >
                    PROPOSE
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft([])}>
                    clear
                  </Button>
                </>
              )}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="danger" disabled={!!busy} onClick={() => run("block", () => fBlock({ data: auth }))}>
                  ☠ BLOCK THE EXIT (DEMO)
                </Button>
                <Button size="sm" variant="pixel" disabled={!!busy} onClick={() => confirm("Reset the level for both players?") && run("reset", () => fReset({ data: auth }))}>
                  RESET
                </Button>
              </div>
            </div>
          </div>
        </section>

        <AgentCard slot={2} alias={p2?.alias} online={p2?.online} mine={me.slot === 2} events={chatFor(2)} busy={busy === "ai2"} onSend={(prompt) => run("ai2", () => fPropose({ data: { ...auth, prompt } }))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* proof mode */}
        <section className="arcade-card p-4">
          <h2 className="font-pixel text-sm text-lime">PROOF MODE · deterministic BFS</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Subject: {proofSubject}. Searches states (row, col, hasKey) from the player's <b>current</b> position. No LLM involved.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
            <Stat label="VERDICT" value={shownVerdict.solvable ? "SOLVABLE" : "BLOCKED"} tone={shownVerdict.solvable ? "lime" : "danger"} />
            <Stat label="PATH" value={shownVerdict.solvable ? `${shownVerdict.pathLength} steps` : "—"} />
            <Stat label="STATES" value={String(shownVerdict.visitedStates)} />
          </div>
          <ul className="mt-3 space-y-1 text-xs">
            {shownVerdict.constraints.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className={c.ok ? "text-lime" : "text-danger"}>{c.ok ? "✔" : "✖"}</span>
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted-foreground">{c.detail}</span>
              </li>
            ))}
          </ul>
          {!shownVerdict.solvable && <p className="mt-2 rounded border border-danger/50 p-2 text-xs text-danger">Proof of impossibility: BFS exhausted all {shownVerdict.visitedStates} reachable states without touching the exit. {shownVerdict.reason}</p>}
        </section>

        {/* timeline */}
        <section className="arcade-card flex flex-col p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-sm text-violet">TIMELINE · shared revision history</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{proposals.length} proposals</span>
          </div>
          <ol className="mt-2 max-h-64 space-y-1 overflow-y-auto font-mono text-[12px]">
            {[...logEvents].reverse().map((e) => (
              <li key={e.id} className="flex gap-2 anim-rise">
                <span className="shrink-0 text-muted-foreground">{new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                <span className="w-9 shrink-0 text-muted-foreground">r{e.revision ?? "·"}</span>
                <span className={cn("shrink-0", e.slot === 1 ? "text-lime" : e.slot === 2 ? "text-violet" : "text-peach")}>{e.slot ? `P${e.slot}` : "SYS"}</span>
                <span className={cn(e.kind === "solver_block" && "text-danger", e.kind === "solver_ok" && "text-lime", e.kind === "approve" && "text-violet", e.kind === "tool" && "text-muted-foreground", e.kind === "ai_error" && "text-danger", e.kind === "win" && "text-lime")}>
                  {e.kind === "tool" ? "⚙ " : ""}
                  {e.message}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {error && <p className="text-center font-mono text-xs text-danger">sync error: {error} — retrying</p>}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "lime" | "danger" }) {
  return (
    <div className="rounded border-2 border-border p-2">
      <p className="font-pixel text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", tone === "lime" && "text-lime", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
}

type ActiveP = NonNullable<Awaited<ReturnType<typeof import("@/lib/room.functions").getRoomSnapshot>>["proposals"][number]>;

function ProposalBar({
  active,
  meSlot,
  busy,
  onApprove,
  onDismiss,
  onCounter,
  onRepair,
  revision,
  other,
}: {
  active: ActiveP | null;
  meSlot: 1 | 2;
  busy: string | null;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onCounter: (id: string) => void;
  onRepair: (id: string) => void;
  revision: number;
  other: 1 | 2;
}) {
  if (!active)
    return (
      <div className="arcade-card p-3 text-xs text-muted-foreground">
        <span className="font-pixel">NO ACTIVE PROPOSAL</span> — ask an agent, stage a manual edit, or try “Block the exit (demo)”.
      </div>
    );
  const sourceLabel: Record<string, string> = { ai: "AI agent", "ai-repair": "AI repair", manual: "human hand-edit", preset: "demo preset (not AI)", algorithmic: "algorithmic fallback (not AI)" };
  const rejected = active.status === "rejected";
  const agent = active.proposerSlot === 1 ? "WORLDWEAVER" : "CHAOS ENGINE";
  return (
    <div className={cn("arcade-card anim-rise space-y-2 p-3", rejected ? "border-danger" : "border-lime")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border-2 border-peach px-1.5 font-pixel text-[10px] text-peach">PROPOSED</span>
        <span className="text-muted-foreground">→</span>
        <span className={cn("rounded border-2 px-1.5 font-pixel text-[10px]", STATUS_STYLE[active.status])}>{rejected ? "REJECTED BY SOLVER" : "VERIFIED"}</span>
        <span className="font-pixel text-xs">
          P{active.proposerSlot} {agent}
        </span>
        <span className="text-xs text-muted-foreground">· {sourceLabel[active.source] ?? active.source}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          base r{active.baseRevision}
          {active.baseRevision !== revision && <span className="text-peach"> · now r{revision}, will revalidate</span>}
        </span>
      </div>
      <p className="text-sm">
        <b>{active.intent}</b> <span className="text-muted-foreground">— {active.explanation}</span>
      </p>
      <code className="block font-mono text-xs">{active.operations.map((o) => `${o.op}(${o.r},${o.c})`).join(" · ")}</code>
      <p className={cn("text-xs", rejected ? "text-danger" : "text-lime")}>Solver: {active.verdict?.reason}</p>
      <div className="flex flex-wrap gap-2">
        {!rejected && (
          <Button size="sm" variant="arcade" disabled={!!busy} onClick={() => onApprove(active.id)}>
            ✔ APPROVE &amp; COMMIT
          </Button>
        )}
        {rejected && (
          <>
            <Button size="sm" variant={meSlot === 1 ? "arcade" : "violet"} disabled={!!busy} onClick={() => onCounter(active.id)}>
              🔧 ASK {meSlot === 1 ? "WORLDWEAVER" : "CHAOS ENGINE"} TO REPAIR
            </Button>
            <Button size="sm" variant="peach" disabled={!!busy} onClick={() => onRepair(active.id)}>
              ⚙ FIND SAFE REPAIR (algorithmic)
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => onDismiss(active.id)}>
          dismiss
        </Button>
        {rejected && active.proposerSlot === meSlot && <span className="self-center text-xs text-muted-foreground">Tip: P{other}'s agent can counter-propose from their screen.</span>}
      </div>
    </div>
  );
}
