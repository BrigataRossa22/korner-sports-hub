import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";
import { isPrvaLiga } from "@/lib/prva-liga";

export type PrvaRow = {
  season: string;
  grp: string;
  position: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
};

// Sezone Prve lige BiH (1994/95 do 2001/02) za jedan klub
export const getClubPrva = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<PrvaRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/season_standings?select=*&order=season.desc,position.asc&limit=5000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await res.json()) as any[];
    return rows
      .filter((r) => isPrvaLiga(r.season) && sameClub(r.team, data.name))
      .map((r) => ({
        season: r.season,
        grp: r.grp ?? "",
        position: r.position,
        team: r.team,
        played: r.played,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        gf: r.goals_for,
        ga: r.goals_against,
        points: r.points,
      }));
  });
