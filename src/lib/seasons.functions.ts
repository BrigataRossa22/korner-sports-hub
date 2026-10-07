import { createServerFn } from "@tanstack/react-start";

export type SeasonRow = {
  id: string;
  season: string;
  position: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

export const getSeasonStandings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeasonRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/season_standings?select=*&order=season.desc,position.asc&limit=5000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as SeasonRow[];
  },
);
