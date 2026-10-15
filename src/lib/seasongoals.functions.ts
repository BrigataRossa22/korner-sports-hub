import { createServerFn } from "@tanstack/react-start";

export type SeasonGoal = {
  id: string;
  season: string;
  round: number;
  home: string;
  away: string;
  side: "H" | "A";
  player: string;
  minute: number;
  extra: number;
  kind: "g" | "p" | "o";
};

export const getSeasonGoals = createServerFn({ method: "GET" })
  .inputValidator((input: { season: string }) => input)
  .handler(async ({ data }): Promise<SeasonGoal[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const season = encodeURIComponent(data.season);
    const res = await fetch(
      `${url}/rest/v1/season_goals?season=eq.${season}&order=round.asc,minute.asc,extra.asc&limit=5000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as SeasonGoal[];
  });
