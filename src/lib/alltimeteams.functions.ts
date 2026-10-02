import { createServerFn } from "@tanstack/react-start";

export type AllTimeTeam = {
  id: string;
  team: string;
  crest: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

export const getAllTimeTeams = createServerFn({ method: "GET" }).handler(
  async (): Promise<AllTimeTeam[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/all_time_teams?select=*&order=points.desc&limit=200`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as AllTimeTeam[];
  },
);
