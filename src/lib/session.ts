// Per-tab identity: sessionStorage gives every browser tab its own player.
export interface Seat {
  token: string;
  slot: 1 | 2;
}
const k = (code: string) => `paradox:${code.toUpperCase()}`;
export function loadSeat(code: string): Seat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(k(code));
    return raw ? (JSON.parse(raw) as Seat) : null;
  } catch {
    return null;
  }
}
export function saveSeat(code: string, seat: Seat) {
  sessionStorage.setItem(k(code), JSON.stringify(seat));
}
