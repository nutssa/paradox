<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Puzzle rules live in pure `src/lib/engine/*` (no UI/network) with vitest tests; UI and server reuse it so the solver is the single source of truth.
- Game tables are service-role only; all reads/writes go through `src/lib/room.functions.ts` with per-player room tokens (hashed) — never add anon policies.
- Realtime is a broadcast "changed" ping plus polling fallback; clients always refetch the authoritative snapshot, never trust payloads.
- Commits use optimistic concurrency (`revision` + `move_seq` guards) and always revalidate proposals on the latest state.
