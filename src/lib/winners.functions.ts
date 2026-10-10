import { createServerFn } from "@tanstack/react-start";

export type SeasonWinner = {
  id: string;
  season: string;
  champion: string;
  second: string;
  third: string;
  top_scorer: string;
  goals: number;
};

export const getSeasonWinners = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeasonWinner[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/season_winners?select=*&order=season.desc&limit=200`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as SeasonWinner[];
  },
);
