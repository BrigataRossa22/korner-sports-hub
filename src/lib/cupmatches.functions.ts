import { createServerFn } from "@tanstack/react-start";

export type CupMatch = {
  id: string;
  season: string;
  round: string;
  match_date: string;
  home: string;
  away: string;
  home_crest: string;
  away_crest: string;
  score_home: number | null;
  score_away: number | null;
  attendance: number;
};

export const getCupMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<CupMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama.
    const out: CupMatch[] = [];
    const size = 1000;
    for (let from = 0; from < 100000; from += size) {
      const res = await fetch(
        `${url}/rest/v1/cup_matches?select=*&order=match_date.asc,id.asc&limit=${size}&offset=${from}`,
        { headers: { apikey: key } },
      );
      if (!res.ok) break;
      const rows = (await res.json()) as CupMatch[];
      out.push(...rows);
      if (rows.length < size) break;
    }
    return out;
  },
);
