import { createServerFn } from "@tanstack/react-start";

export type NationalGoal = {
  id: number;
  match_date: string;
  team: "B" | "O"; // B = BiH, O = protivnik
  player: string;
  minute: string;
  kind: "g" | "p" | "o"; // gol, penal, autogol
};

export const getNationalGoals = createServerFn({ method: "GET" }).handler(
  async (): Promise<NationalGoal[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const all: NationalGoal[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const res = await fetch(
        `${url}/rest/v1/national_goals?select=*&order=match_date.asc,id.asc&limit=1000&offset=${from}`,
        { headers: { apikey: key } },
      );
      if (!res.ok) break;
      const page = (await res.json()) as NationalGoal[];
      all.push(...page);
      if (page.length < 1000) break;
    }
    return all;
  },
);
