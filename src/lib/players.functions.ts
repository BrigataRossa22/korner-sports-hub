import { createServerFn } from "@tanstack/react-start";

export type PlayerStat = {
  id: string;
  kind: "scorer" | "assist";
  name: string;
  team: string;
  value: number;
};

export const getPlayerStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlayerStat[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/player_stats?select=*&order=value.desc&limit=100`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as PlayerStat[];
  },
);
