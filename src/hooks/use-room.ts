import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getRoomSnapshot } from "@/lib/room.functions";

export type Snapshot = Awaited<ReturnType<typeof getRoomSnapshot>>;
export type SyncMode = "connecting" | "realtime" | "polling" | "error";

/**
 * Room sync: realtime broadcast "changed" pings trigger an authoritative
 * snapshot refetch from the server. Polling runs as a fallback (faster when
 * realtime is down) so state never silently drifts.
 */
export function useRoom(code: string, token: string | null) {
  const fetchSnap = useServerFn(getRoomSnapshot);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [mode, setMode] = useState<SyncMode>("connecting");
  const [lastSync, setLastSync] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inflight = useRef(false);
  const again = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    if (inflight.current) {
      again.current = true;
      return;
    }
    inflight.current = true;
    try {
      const s = await fetchSnap({ data: { code, token } });
      setSnap(s);
      setLastSync(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "sync failed");
    } finally {
      inflight.current = false;
      if (again.current) {
        again.current = false;
        void refresh();
      }
    }
  }, [code, token, fetchSnap]);

  useEffect(() => {
    if (!token) return;
    void refresh();
    const ch = supabase.channel(`paradox-room-${code}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "changed" }, () => void refresh()).subscribe((status) => {
      if (status === "SUBSCRIBED") setMode("realtime");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setMode("polling");
    });
    chanRef.current = ch;
    return () => {
      void supabase.removeChannel(ch);
      chanRef.current = null;
    };
  }, [code, token, refresh]);

  useEffect(() => {
    if (!token) return;
    const ms = mode === "realtime" ? 5000 : 2000;
    const id = setInterval(() => void refresh(), ms);
    return () => clearInterval(id);
  }, [mode, token, refresh]);

  /** Call after any successful mutation: refetch + notify the other player. */
  const ping = useCallback(async () => {
    await refresh();
    void chanRef.current?.send({ type: "broadcast", event: "changed", payload: { t: Date.now() } });
  }, [refresh]);

  return { snap, mode, lastSync, error, refresh, ping, setSnap };
}
