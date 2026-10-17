import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { EditOp } from "./engine/types";

const Auth = z.object({ code: z.string().min(3).max(10), token: z.string().min(10).max(100) });
const OpZ = z.object({
  op: z.enum(["addWall", "removeWall", "addLava", "removeLava", "placeKey", "removeKey", "placeDoor", "removeDoor", "moveExit"]),
  r: z.number().int(),
  c: z.number().int(),
});
const srv = () => import("./room.server");

export const createRoomFn = createServerFn({ method: "POST" })
  .inputValidator((d: { alias: string }) => z.object({ alias: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => (await srv()).createRoom(data.alias));

export const joinRoomFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; alias: string }) => z.object({ code: z.string().min(3).max(10), alias: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => (await srv()).joinRoom(data.code, data.alias));

export const getRoomSnapshot = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string }) => Auth.parse(d))
  .handler(async ({ data }) => (await srv()).getSnapshot(data.code, data.token));

export const movePlayerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; dir: "up" | "down" | "left" | "right" }) =>
    Auth.extend({ dir: z.enum(["up", "down", "left", "right"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await srv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { movePlayer } = await import("./engine/game");
    const { starter } = await import("./engine/level");
    const { me } = await s.authorize(data.code, data.token);
    for (let attempt = 0; attempt < 3; attempt++) {
      const room = await s.getRoomByCode(data.code);
      const m = movePlayer(room.board, room.player, data.dir);
      if (!m.ok) return { ok: false, reason: m.reason };
      let board = m.board;
      let player = m.player;
      let revision = m.pickedKey ? room.revision + 1 : room.revision;
      let wins = room.wins;
      if (m.won) {
        const st = starter();
        board = st.board;
        player = st.start;
        revision = room.revision + 1;
        wins++;
      }
      const { data: upd } = await supabaseAdmin
        .from("rooms")
        .update({ board: board as never, player: player as never, revision, wins, move_seq: room.move_seq + 1, updated_at: new Date().toISOString() })
        .eq("id", room.id)
        .eq("move_seq", room.move_seq)
        .eq("revision", room.revision)
        .select("id");
      if (!upd?.length) continue; // lost race, retry on fresh state
      if (m.pickedKey) await s.logEvent(room.id, me.slot, "key", `${me.alias} picked up the KEY at (${m.player.r},${m.player.c}) → r${revision}`, null, revision);
      if (m.won) {
        await supabaseAdmin.from("proposals").update({ status: "superseded" }).eq("room_id", room.id).eq("status", "verified");
        await s.logEvent(room.id, me.slot, "win", `🏁 ${me.alias} reached the EXIT! Win #${wins}. Board reset → r${revision}`, null, revision);
      }
      return { ok: true, won: m.won, pickedKey: m.pickedKey };
    }
    return { ok: false, reason: "busy — try again" };
  });

export const proposeEdits = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; prompt: string }) => Auth.extend({ prompt: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { room, me } = await s.authorize(data.code, data.token);
    await s.logEvent(room.id, me.slot, "chat_user", data.prompt, null, room.revision);
    await s.logEvent(room.id, me.slot, "tool", `${s.AGENT_NAME[me.slot]} → llm.generate(context: map r${room.revision}, log, active proposal)`, null, room.revision);
    const res = await s.callAgent(room, me.slot, data.prompt);
    if (!res.ok) {
      await s.logEvent(room.id, me.slot, "ai_error", `AI unavailable: ${res.error}`, null, room.revision);
      return { ok: false as const, error: res.error };
    }
    const fresh = await s.getRoomByCode(data.code);
    await s.logEvent(room.id, me.slot, "chat_agent", res.payload.explanation, { intent: res.payload.intent, operations: res.payload.operations }, fresh.revision);
    const p = await s.storeProposal(fresh, me.slot, "ai", res.payload);
    return { ok: true as const, proposal: p };
  });

export const proposeManual = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; operations: EditOp[]; intent: string; source: "manual" | "preset" }) =>
    Auth.extend({ operations: z.array(OpZ).min(1).max(3), intent: z.string().max(160), source: z.enum(["manual", "preset"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await srv();
    const { room, me } = await s.authorize(data.code, data.token);
    const p = await s.storeProposal(room, me.slot, data.source, {
      operations: data.operations,
      intent: data.intent,
      explanation: data.source === "preset" ? "Demo preset: deliberately seals every open side of the exit." : "Hand-placed edit by a human player.",
    });
    return { ok: true as const, proposal: p };
  });

export const blockExitDemo = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string }) => Auth.parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { blockExitPreset } = await import("./engine/repair");
    const { room, me } = await s.authorize(data.code, data.token);
    const ops = blockExitPreset(room.board, room.player);
    if (!ops.length) return { ok: false as const, error: "Exit has no open sides to block." };
    const p = await s.storeProposal(room, me.slot, "preset", {
      operations: ops,
      intent: "Seal the exit with lava (demo preset)",
      explanation: "Demo preset: deliberately pours lava on every open side of the exit. This is not an AI message.",
    });
    return { ok: true as const, proposal: p };
  });

async function loadProposal(roomId: string, id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { mapProposal } = await srv();
  const { data } = await supabaseAdmin.from("proposals").select("*").eq("room_id", roomId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Proposal not found in this room");
  return mapProposal(data);
}

export const requestCounterproposal = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; proposalId: string }) => Auth.extend({ proposalId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { room, me } = await s.authorize(data.code, data.token);
    const rej = await loadProposal(room.id, data.proposalId);
    const task = `Player ${rej.proposerSlot}'s agent (${s.AGENT_NAME[rej.proposerSlot]}) proposed ${JSON.stringify(rej.operations)} ("${rej.intent}") but the deterministic solver REJECTED it: ${rej.verdict?.reason}. Propose a REPAIR: a full replacement proposal (applied to the current map) that keeps as much of their intent as possible but leaves the exit reachable from the player's current position. You may include some of their ops plus removals elsewhere. Max ${4} ops.`;
    await s.logEvent(room.id, me.slot, "chat_user", `🔧 Repair request for rejected proposal from P${rej.proposerSlot}`, null, room.revision);
    await s.logEvent(room.id, me.slot, "tool", `${s.AGENT_NAME[me.slot]} → requestCounterproposal(rejected=${rej.id.slice(0, 8)}, ops=${rej.operations.length})`, null, room.revision);
    const res = await s.callAgent(room, me.slot, task);
    if (!res.ok) {
      await s.logEvent(room.id, me.slot, "ai_error", `AI unavailable: ${res.error} — use "Find safe repair" (algorithmic fallback).`, null, room.revision);
      return { ok: false as const, error: res.error };
    }
    const fresh = await s.getRoomByCode(data.code);
    await s.logEvent(room.id, me.slot, "chat_agent", res.payload.explanation, { intent: res.payload.intent, operations: res.payload.operations }, fresh.revision);
    const p = await s.storeProposal(fresh, me.slot, "ai-repair", res.payload, rej.id);
    if (p.status === "rejected") await s.logEvent(room.id, null, "info", `AI repair also failed the proof — try the algorithmic fallback.`, null, fresh.revision);
    return { ok: true as const, proposal: p };
  });

export const findSafeRepairFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; proposalId: string }) => Auth.extend({ proposalId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { findSafeRepair } = await import("./engine/repair");
    const { room, me } = await s.authorize(data.code, data.token);
    const rej = await loadProposal(room.id, data.proposalId);
    await s.logEvent(room.id, me.slot, "tool", `ALGORITHM → findSafeRepair(single-tile search over ${9 * 12} cells)`, null, room.revision);
    const fix = findSafeRepair(room.board, room.player, rej.operations);
    if (!fix) {
      await s.logEvent(room.id, null, "info", "Algorithmic fallback found no single-tile repair.", null, room.revision);
      return { ok: false as const, error: "No single-tile repair found." };
    }
    const p = await s.storeProposal(room, me.slot, "algorithmic", { operations: fix.operations, intent: "Algorithmic fallback repair", explanation: fix.explanation }, rej.id);
    return { ok: true as const, proposal: p };
  });

export const approveProposal = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; proposalId: string }) => Auth.extend({ proposalId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { commitProposal } = await import("./engine/game");
    const { me } = await s.authorize(data.code, data.token);
    for (let attempt = 0; attempt < 3; attempt++) {
      const room = await s.getRoomByCode(data.code);
      const p = await loadProposal(room.id, data.proposalId);
      if (p.status === "approved") return { ok: true as const, idempotent: true, revision: p.committedRevision };
      if (p.status !== "verified") return { ok: false as const, error: `Proposal is ${p.status}; only verified proposals can be committed.` };
      const res = commitProposal({ latestBoard: room.board, latestPlayer: room.player, latestRevision: room.revision, baseRevision: p.baseRevision, operations: p.operations });
      if (!res.committed) {
        await supabaseAdmin.from("proposals").update({ status: "rejected", verdict: { ...res.verdict, errors: res.errors } as never, updated_at: new Date().toISOString() }).eq("id", p.id);
        await s.logEvent(room.id, null, "solver_block", `Stale proposal re-checked on r${room.revision} and REJECTED: ${res.verdict.reason}`, { proposalId: p.id }, room.revision);
        return { ok: false as const, error: `Re-validated on r${room.revision}: ${res.verdict.reason}` };
      }
      const { data: upd } = await supabaseAdmin
        .from("rooms")
        .update({ board: res.board as never, revision: res.newRevision, updated_at: new Date().toISOString() })
        .eq("id", room.id)
        .eq("revision", room.revision)
        .eq("move_seq", room.move_seq)
        .select("id");
      if (!upd?.length) continue; // concurrent write: retry against the new latest state
      const { data: claimed } = await supabaseAdmin
        .from("proposals")
        .update({ status: "approved", resolved_by: me.slot, committed_revision: res.newRevision, verdict: { ...res.verdict, errors: [] } as never, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .eq("status", "verified")
        .select("id");
      if (!claimed?.length) {
        // someone else approved simultaneously — roll back our board write is unnecessary because revision guard above serialises; log only
      }
      await s.logEvent(
        room.id,
        me.slot,
        "approve",
        `${me.alias} APPROVED ${s.AGENT_NAME[p.proposerSlot]}'s proposal → committed r${res.newRevision}${res.revalidated ? ` (revalidated from r${p.baseRevision})` : ""}`,
        { proposalId: p.id },
        res.newRevision,
      );
      return { ok: true as const, revision: res.newRevision, revalidated: res.revalidated };
    }
    return { ok: false as const, error: "Room busy, please retry." };
  });

export const dismissProposal = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string; proposalId: string }) => Auth.extend({ proposalId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { room, me } = await s.authorize(data.code, data.token);
    await supabaseAdmin.from("proposals").update({ status: "dismissed", resolved_by: me.slot }).eq("room_id", room.id).eq("id", data.proposalId).in("status", ["verified", "rejected"]);
    await s.logEvent(room.id, me.slot, "dismiss", `${me.alias} dismissed a proposal`, { proposalId: data.proposalId }, room.revision);
    return { ok: true as const };
  });

export const resetLevelFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; token: string }) => Auth.parse(d))
  .handler(async ({ data }) => {
    const s = await srv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { starter } = await import("./engine/level");
    const { room, me } = await s.authorize(data.code, data.token);
    const st = starter();
    await supabaseAdmin.from("rooms").update({ board: st.board as never, player: st.start as never, revision: room.revision + 1, move_seq: room.move_seq + 1 }).eq("id", room.id);
    await supabaseAdmin.from("proposals").update({ status: "superseded" }).eq("room_id", room.id).in("status", ["verified", "rejected"]);
    await s.logEvent(room.id, me.slot, "reset", `${me.alias} reset the level → r${room.revision + 1}`, null, room.revision + 1);
    return { ok: true as const };
  });
