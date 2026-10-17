import { cn } from "@/lib/utils";

/** Worldweaver — violet geometric oracle (eye inside nested diamonds). */
export function OracleSigil({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("text-violet", className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" className={active ? "anim-ghost" : undefined}>
        <path d="M24 3 45 24 24 45 3 24Z" opacity=".5" />
        <path d="M24 10 38 24 24 38 10 24Z" />
        <path d="M14 24c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7Z" />
      </g>
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
    </svg>
  );
}

/** Chaos Engine — coral mischievous cog with a grin. */
export function ChaosSigil({ className, active }: { className?: string; active?: boolean }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 48 48" className={cn("text-coral", className)} aria-hidden>
      <g className={active ? "origin-center animate-spin" : undefined} style={{ transformBox: "fill-box", animationDuration: "3s" }}>
        {teeth.map((a) => (
          <rect key={a} x="21" y="2" width="6" height="8" rx="1.5" fill="currentColor" transform={`rotate(${a} 24 24)`} />
        ))}
        <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
      </g>
      <path d="M17 21l4 2M31 21l-4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M17 28c3 4 11 4 14 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Proof Core — impartial lime crystal core. */
export function CoreSigil({ className, ok }: { className?: string; ok: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(ok ? "text-lime" : "text-coral", className)} aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" className="origin-center animate-spin" style={{ transformBox: "fill-box", animationDuration: "12s" }} />
      <path d="M24 8 36 18 32 36H16L12 18Z" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="2" />
      <path d="M24 8v28M12 18h24" stroke="currentColor" strokeWidth="1.5" opacity=".7" />
    </svg>
  );
}
