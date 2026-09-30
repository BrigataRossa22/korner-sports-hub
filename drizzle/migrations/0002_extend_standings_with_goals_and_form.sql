ALTER TABLE public.standings ADD COLUMN goals_for integer NOT NULL DEFAULT 0;
ALTER TABLE public.standings ADD COLUMN goals_against integer NOT NULL DEFAULT 0;
ALTER TABLE public.standings ADD COLUMN recent_form text NOT NULL DEFAULT '';
COMMENT ON COLUMN public.standings.recent_form IS 'Recent results in chronological order, using W, D, L (up to five matches).';