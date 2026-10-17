CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  board jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  player jsonb NOT NULL,
  move_seq integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot IN (1,2)),
  alias text NOT NULL,
  token_hash text NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, slot)
);
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  proposer_slot smallint NOT NULL,
  source text NOT NULL,
  operations jsonb NOT NULL,
  explanation text NOT NULL DEFAULT '',
  intent text NOT NULL DEFAULT '',
  base_revision integer NOT NULL,
  status text NOT NULL,
  verdict jsonb,
  repair_of uuid,
  resolved_by smallint,
  committed_revision integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proposals_room_idx ON public.proposals(room_id, created_at DESC);
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_events (
  id bigserial PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  slot smallint,
  kind text NOT NULL,
  message text NOT NULL,
  data jsonb,
  revision integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_events_room_idx ON public.room_events(room_id, id DESC);
GRANT ALL ON public.room_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.room_events_id_seq TO service_role;
ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;