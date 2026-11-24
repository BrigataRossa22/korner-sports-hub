import { createServerFn } from "@tanstack/react-start";

export type StadiumRow = { club: string; stadium: string };

/** Stadioni klubova (iz club_info), za statistiku groundhoppinga. */
export const getStadiums = createServerFn({ method: "GET" }).handler(
  async (): Promise<StadiumRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/club_info?select=club,stadium&limit=500`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as StadiumRow[];
    return rows.filter((r) => r.club && r.stadium);
  },
);
