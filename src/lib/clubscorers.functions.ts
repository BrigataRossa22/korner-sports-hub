import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";

export type ClubScorer = {
  name: string;
  goals: number;
  penalties: number;
  firstSeason: string;
  lastSeason: string;
};

export type ClubScorersData = {
  scorers: ClubScorer[];
  firstSeason: string;
  lastSeason: string;
};

type Row = {
  season?: string;
  player: string | null;
  kind: string | null;
  side?: string | null;
  home?: string | null;
  away?: string | null;
  team?: string | null;
};

// Aktuelna sezona (golovi se čitaju iz tabele match_goals). Mora biti ista oznaka kao u clubhistory.functions.ts
const CURRENT_SEASON = "2026-27";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isOwn = (k: string | null) => {
  const x = (k ?? "").toLowerCase();
  return x === "o" || x === "own" || x.startsWith("auto");
};

const isPen = (k: string | null) => {
  const x = (k ?? "").toLowerCase();
  return x === "p" || x === "pen" || x.startsWith("penal");
};

// Klub koji je postigao gol
const teamOf = (r: Row): string => {
  if (r.team && r.team.trim()) return r.team.trim();
  const t = r.side === "H" ? r.home : r.side === "A" ? r.away : "";
  return (t ?? "").trim();
};

// Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama
async function fetchPages(url: string, key: string, path: string, order: string): Promise<Row[] | null> {
  const out: Row[] = [];
  const size = 1000;
  for (let from = 0; from < 200000; from += size) {
    const res = await fetch(`${url}/rest/v1/${path}&order=${order}&limit=${size}&offset=${from}`, {
      headers: { apikey: key },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Row[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

async function load(url: string, key: string, table: string, selects: string[]): Promise<Row[]> {
  for (const sel of selects) {
    for (const ord of ["id.asc", "player.asc"]) {
      const r = await fetchPages(url, key, `${table}?select=${sel}`, ord);
      if (r) return r;
    }
  }
  return [];
}

export const getClubTopScorers = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<ClubScorersData> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const empty: ClubScorersData = { scorers: [], firstSeason: "", lastSeason: "" };
    if (!url || !key) return empty;

    const [archive, current] = await Promise.all([
      load(url, key, "season_goals", ["season,player,kind,side,home,away", "season,player,kind"]),
      load(url, key, "match_goals", ["player,kind,team", "player,kind"]),
    ]);

    type Agg = {
      goals: number;
      pens: number;
      names: Map<string, number>;
      first: string;
      last: string;
    };
    const map = new Map<string, Agg>();
    const seasons = new Set<string>();

    const feed = (rows: Row[], forcedSeason: string | null) => {
      for (const r of rows) {
        const raw = (r.player ?? "").trim();
        if (!raw || isOwn(r.kind)) continue;
        const team = teamOf(r);
        if (!team || !sameClub(team, data.name)) continue;
        const k = norm(raw);
        if (!k) continue;
        const season = forcedSeason ?? r.season ?? "";
        if (season) seasons.add(season);
        const e = map.get(k) ?? { goals: 0, pens: 0, names: new Map<string, number>(), first: "", last: "" };
        e.goals += 1;
        if (isPen(r.kind)) e.pens += 1;
        e.names.set(raw, (e.names.get(raw) ?? 0) + 1);
        if (season) {
          if (!e.first || season < e.first) e.first = season;
          if (!e.last || season > e.last) e.last = season;
        }
        map.set(k, e);
      }
    };

    feed(archive, null);
    feed(current, CURRENT_SEASON);

    const scorers: ClubScorer[] = [...map.values()].map((e) => {
      let best = "";
      let bestN = -1;
      for (const [n, c] of e.names) {
        if (c > bestN || (c === bestN && n.length > best.length)) {
          best = n;
          bestN = c;
        }
      }
      return { name: best, goals: e.goals, penalties: e.pens, firstSeason: e.first, lastSeason: e.last };
    });
    scorers.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "bs"));

    const sorted = [...seasons].sort();
    return {
      scorers: scorers.slice(0, 10),
      firstSeason: sorted[0] ?? "",
      lastSeason: sorted[sorted.length - 1] ?? "",
    };
  });
