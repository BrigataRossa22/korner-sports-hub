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
  attendance: number;
  home_date: string | null;
  away_date: string | null;
  away_attendance: number | null;
};

export const getEuroMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<EuroMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama.
    const out: EuroMatch[] = [];
    const size = 1000;
    for (let from = 0; from < 20000; from += size) {
      const res = await fetch(
        `${url}/rest/v1/euro_matches?select=*&order=season.asc,sort_order.asc,id.asc&limit=${size}&offset=${from}`,
        { headers: { apikey: key } },
      );
      if (!res.ok) break;
      const rows = (await res.json()) as EuroMatch[];
      out.push(...rows);
      if (rows.length < size) break;
    }
    return out;
  },
);
