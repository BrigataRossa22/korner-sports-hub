import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";

export type EternalRow = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
};

// Mora biti ista oznaka kao u clubhistory.functions.ts
const CURRENT_SEASON = "2026-27";

export const getEternalTable = createServerFn({ method: "GET" }).handler(
  async (): Promise<EternalRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getAll = async (path: string): Promise<any[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out: any[] = [];
      for (let page = 0; page < 10; page++) {
        const res = await fetch(`${url}/rest/v1/${path}&limit=1000&offset=${page * 1000}`, {
          headers: { apikey: key },
        });
        if (!res.ok) break;
        const rows = await res.json();
        out.push(...rows);
        if (rows.length < 1000) break;
      }
      return out;
    };

    const [archive, standings] = await Promise.all([
      getAll(
        "season_standings?select=season,team,played,wins,draws,losses,goals_for,goals_against,points&order=season.desc,position.asc",
      ),
      getAll("standings?select=*&order=sort_order.asc"),
    ]);

    const items: EternalRow[] = [];
    for (const s of standings) {
      items.push({
        team: s.team,
        played: s.played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        gf: s.goals_for,
        ga: s.goals_against,
        points: s.points,
      });
    }
    for (const r of archive) {
      if (standings.length > 0 && r.season === CURRENT_SEASON) continue;
      items.push({
        team: r.team,
        played: r.played,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        gf: r.goals_for,
        ga: r.goals_against,
        points: r.points,
      });
    }

    // Isti klub pod različitim imenima (npr. "Željezničar" i "FK Željezničar") se spaja
    const groups: EternalRow[] = [];
    for (const it of items) {
      const g = groups.find((x) => sameClub(x.team, it.team));
      if (!g) {
        groups.push({ ...it });
      } else {
        g.played += it.played;
        g.wins += it.wins;
        g.draws += it.draws;
        g.losses += it.losses;
        g.gf += it.gf;
        g.ga += it.ga;
        g.points += it.points;
      }
    }

    return groups.sort(
      (a, b) =>
        b.points - a.points ||
        b.gf - b.ga - (a.gf - a.ga) ||
        b.gf - a.gf ||
        a.team.localeCompare(b.team, "bs"),
    );
  },
);
