import { createServerFn } from "@tanstack/react-start";

export type EuroMatch = {
  id: string;
  competition: "LP" | "LE" | "KL" | "KPK";
  season: string;
  club: string;
  club_crest: string;
  round: string;
  opponent: string;
  opponent_flag: string;
  home: string;
  away: string;
  agg: string;
  sort_order: number;
};

export const getEuroMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<EuroMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/euro_matches?select=*&order=season.asc,sort_order.asc&limit=2000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as EuroMatch[];
  },
);
