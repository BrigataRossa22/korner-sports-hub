import { createServerFn } from "@tanstack/react-start";

export type LeagueMatch = {
  id: string;
  round: number | null;
  match_date: string;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
  attendance: number;
};

export const getLeagueMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeagueMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/club_matches?competition=eq.PLBiH&order=match_date.asc&limit=1000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as LeagueMatch[];
    const seen = new Set<string>();
    return rows.filter((m) => {
      const k = `${m.match_date}|${m.home}|${m.away}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  },
);
