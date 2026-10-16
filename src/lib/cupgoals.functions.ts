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
    const res = await fetch(
      `${url}/rest/v1/cup_goals?select=*&order=minute.asc,extra.asc&limit=5000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as CupGoal[];
  },
);
