import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { createRoomFn, joinRoomFn } from "@/lib/room.functions";
import { saveSeat } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniBoard } from "@/components/game/MiniBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PARADOX — Break the rules. Not the game." },
      { name: "description", content: "Two humans, two AI agents, one shared tile world. A deterministic solver refuses impossible edits." },
      { property: "og:title", content: "PARADOX — The Game That Refuses to Be Impossible" },
      { property: "og:description", content: "Real-time co-op puzzle editing with two AI agents and a proof engine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const nav = useNavigate();
  const create = useServerFn(createRoomFn);
  const join = useServerFn(joinRoomFn);
  const [alias, setAlias] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      const r = await create({ data: { alias: alias || "Host" } });
      saveSeat(r.code, { token: r.token, slot: 1 });
      nav({ to: "/room/$code", params: { code: r.code } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create room");
      setBusy(false);
    }
  };
  const onJoin = async () => {
    if (!code.trim()) return toast.error("Enter a room code");
    setBusy(true);
    try {
      const r = await join({ data: { code: code.trim().toUpperCase(), alias: alias || "Guest" } });
      saveSeat(r.code, { token: r.token, slot: 2 });
      nav({ to: "/room/$code", params: { code: r.code } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center">
      <section className="flex-1 space-y-6 anim-rise">
        <p className="font-pixel text-xs text-violet">HACKTOBERFEST GEORGIA 2026 · TRACK 02 · MULTIPLAYER AGENTIC</p>
        <h1 className="font-pixel text-7xl font-bold text-lime text-glow anim-flicker md:text-8xl">PARADOX</h1>
        <p className="font-pixel text-xl text-peach">Break the rules. Not the game.</p>
        <p className="max-w-md text-muted-foreground">
          Two players. Two AI agents — <span className="text-lime">WORLDWEAVER</span> and{" "}
          <span className="text-violet">CHAOS ENGINE</span> — rewrite one shared maze in real time. A deterministic proof engine
          blocks any edit that makes the exit unreachable.
        </p>
        <div className="arcade-card max-w-md space-y-4 p-5">
          <label className="block space-y-1">
            <span className="font-pixel text-xs text-muted-foreground">YOUR ALIAS</span>
            <Input value={alias} maxLength={20} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. Nutsa" />
          </label>
          <Button variant="arcade" size="lg" className="w-full" disabled={busy} onClick={onCreate}>
            ▶ CREATE ROOM (PLAYER 1)
          </Button>
          <div className="flex gap-2">
            <Input value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" className="font-pixel tracking-widest" onKeyDown={(e) => e.key === "Enter" && onJoin()} />
            <Button variant="violet" disabled={busy} onClick={onJoin}>
              JOIN
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Tip: open the invite link in a second browser or another tab — each tab is its own player.</p>
        </div>
      </section>
      <section className="flex-1 anim-rise">
        <MiniBoard />
      </section>
    </main>
  );
}
