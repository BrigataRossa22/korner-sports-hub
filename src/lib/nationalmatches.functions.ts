import { createServerFn } from "@tanstack/react-start";

export type NationalMatch = {
  id: string;
  match_date: string;
  home: string;
  away: string;
  home_flag: string;
  away_flag: string;
  score_home: number | null;
  score_away: number | null;
  attendance: number;
};

export const getNationalMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<NationalMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/national_matches?select=*&order=match_date.asc&limit=100`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as NationalMatch[];
  },
);
