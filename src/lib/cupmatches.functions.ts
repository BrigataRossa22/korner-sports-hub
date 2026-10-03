import { createServerFn } from "@tanstack/react-start";

export type CupMatch = {
  id: string;
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
    const res = await fetch(
      `${url}/rest/v1/cup_matches?select=*&order=match_date.asc&limit=300`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as CupMatch[];
  },
);
