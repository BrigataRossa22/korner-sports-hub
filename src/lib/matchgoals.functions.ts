import { createServerFn } from "@tanstack/react-start";

export type MatchGoal = {
  id: string;
  round: number;
  home: string;
  away: string;
  team: string;
  player: string;
  minute: number;
  extra: number;
  assist: string;
  kind: "goal" | "penalty" | "own";
};

export const getMatchGoals = createServerFn({ method: "GET" }).handler(
  async (): Promise<MatchGoal[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/match_goals?select=*&order=round.asc,minute.asc,extra.asc&limit=5000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as MatchGoal[];
  },
);
