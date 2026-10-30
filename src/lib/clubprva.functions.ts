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
  // prosjek gledalaca na utakmicama kod kuće (samo utakmice s upisanim brojem gledalaca)
  avg: number | null;
};

// Sezone Prve lige BiH (1994/95 do 2001/02) za jedan klub
export const getClubPrva = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<PrvaRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    const [resStand, resMatches] = await Promise.all([
      fetch(`${url}/rest/v1/season_standings?select=*&order=season.desc,position.asc&limit=5000`, {
        headers: { apikey: key },
      }),
      fetch(
        `${url}/rest/v1/season_matches?select=season,grp,home,attendance&attendance=gt.0&season=lt.2002&limit=5000`,
        { headers: { apikey: key } },
      ),
    ]);
    if (!resStand.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await resStand.json()) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches = resMatches.ok ? ((await resMatches.json()) as any[]) : [];

    return rows
      .filter((r) => isPrvaLiga(r.season) && sameClub(r.team, data.name))
      .map((r) => {
        const grp: string = r.grp ?? "";
        const games = matches.filter(
          (m) => m.season === r.season && (m.grp ?? "") === grp && sameClub(m.home, r.team),
        );
        const sum = games.reduce((s, m) => s + m.attendance, 0);
        return {
          season: r.season,
          grp,
          position: r.position,
          team: r.team,
          played: r.played,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          gf: r.goals_for,
          ga: r.goals_against,
          points: r.points,
          avg: games.length ? Math.round(sum / games.length) : null,
        };
      });
  });
