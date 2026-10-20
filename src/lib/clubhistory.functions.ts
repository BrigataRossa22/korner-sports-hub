import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";

export type ClubSeasonRow = {
  season: string;
  team: string;
  position: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
  avg: number | null;
  // zbir gledalaca i broj utakmica kod kuće (za ukupan prosjek svih takmičenja)
  attSum: number;
  attCount: number;
  current: boolean;
};

// Oznaka aktuelne sezone (mijenjaš je kad počne nova sezona)
const CURRENT_SEASON = "2026-27";

export const getClubHistory = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<ClubSeasonRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getAll = async (path: string): Promise<any[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out: any[] = [];
      for (let page = 0; page < 30; page++) {
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

    const [archive, homeGames, standings, attendance, currentGames] = await Promise.all([
      getAll(
        "season_standings?select=season,team,position,played,wins,draws,losses,goals_for,goals_against,points&order=season.desc,position.asc",
      ),
      getAll("season_matches?select=season,home,attendance&attendance=gt.0&order=season.asc,id.asc"),
      getAll("standings?select=*&order=sort_order.asc"),
      getAll("attendance?select=team,average&order=team.asc"),
      getAll("club_matches?select=match_date,home,away,competition,attendance&attendance=gt.0&order=match_date.asc"),
    ]);

    const rows: ClubSeasonRow[] = [];

    const curIndex = standings.findIndex((s) => sameClub(s.team, data.name));
    const cur = curIndex >= 0 ? standings[curIndex] : null;
    if (cur) {
      const att = attendance.find((a) => sameClub(a.team, data.name));
      const avg = att && att.average > 0 ? att.average : null;

      // Zbir i broj ligaških utakmica kod kuće u tekućoj sezoni
      const seen = new Set<string>();
      let curSum = 0;
      let curCount = 0;
      for (const m of currentGames) {
        if (!sameClub(m.home, data.name)) continue;
        if (!String(m.competition ?? "").toLowerCase().startsWith("plbih")) continue;
        const k = `${m.match_date}|${m.home}|${m.away}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (m.attendance > 0) {
          curSum += m.attendance;
          curCount++;
        }
      }
      // Rezerva: ako nema utakmica, koristi gotov prosjek sa težinom jedne utakmice
      if (curCount === 0 && avg !== null) {
        curSum = avg;
        curCount = 1;
      }

      rows.push({
        season: CURRENT_SEASON,
        team: cur.team,
        position: curIndex + 1,
        played: cur.played,
        wins: cur.wins,
        draws: cur.draws,
        losses: cur.losses,
        gf: cur.goals_for,
        ga: cur.goals_against,
        points: cur.points,
        avg,
        attSum: curSum,
        attCount: curCount,
        current: true,
      });
    }

    for (const r of archive) {
      if (!sameClub(r.team, data.name)) continue;
      if (r.season === CURRENT_SEASON && cur) continue;
      const games = homeGames.filter((g) => g.season === r.season && sameClub(g.home, r.team));
      const attSum = games.reduce((s, g) => s + g.attendance, 0);
      const avg = games.length ? Math.round(attSum / games.length) : null;
      rows.push({
        season: r.season,
        team: r.team,
        position: r.position,
        played: r.played,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        gf: r.goals_for,
        ga: r.goals_against,
        points: r.points,
        avg,
        attSum,
        attCount: games.length,
        current: false,
      });
    }

    return rows;
  });
