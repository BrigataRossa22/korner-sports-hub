import { createServerFn } from "@tanstack/react-start";

export type CupGoal = {
  id: string;
  season: string;
  round: string;
  home: string;
  away: string;
  side: "H" | "A";
  player: string;
  minute: number;
  extra: number;
  kind: "g" | "p" | "o";
};

export const getCupGoals = createServerFn({ method: "GET" }).handler(
  async (): Promise<CupGoal[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama.
    const out: CupGoal[] = [];
    const size = 1000;
    for (let from = 0; from < 100000; from += size) {
      const res = await fetch(
        `${url}/rest/v1/cup_goals?select=*&order=season.asc,round.asc,minute.asc,extra.asc,id.asc&limit=${size}&offset=${from}`,
        { headers: { apikey: key } },
      );
      if (!res.ok) break;
      const rows = (await res.json()) as CupGoal[];
      out.push(...rows);
      if (rows.length < size) break;
    }
    return out.sort((a, b) => a.minute - b.minute || a.extra - b.extra);
  },
);
