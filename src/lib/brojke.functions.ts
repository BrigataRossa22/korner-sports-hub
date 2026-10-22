import { createServerFn } from "@tanstack/react-start";

export type TopRow = { name: string; count: number; clubs: string[] };
export type BrojkeData = {
  scorers: TopRow[];
  assists: TopRow[];
  seasons: string[];
  goalsTotal: number;
  cupScorers: TopRow[];
  cupSeasons: string[];
  cupGoalsTotal: number;
};

type Row = {
  season?: string;
  player: string | null;
  assist?: string | null;
  kind: string | null;
  side?: string | null;
  home?: string | null;
  away?: string | null;
  team?: string | null;
};

// Klub koji je postigao gol (kod autogola je to korisnik autogola, pa se ne koristi za strijelca)
const teamOf = (r: Row): string => {
  if (r.team && r.team.trim()) return r.team.trim();
  const t = r.side === "H" ? r.home : r.side === "A" ? r.away : "";
  return (t ?? "").trim();
};

// Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama.
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

// Pokusava varijante dok jedna ne uspije (npr. ako kolona assist u arhivi jos ne postoji)
async function load(url: string, key: string, table: string, selects: string[]): Promise<Row[]> {
  const orders = ["id.asc", "player.asc"];
  for (const sel of selects) {
    for (const ord of orders) {
      const r = await fetchPages(url, key, `${table}?select=${sel}`, ord);
      if (r) return r;
    }
  }
  return [];
}

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

type ClubInfo = { name: string; first: string; n: number };
type Counts = Map<string, { n: number; names: Map<string, number>; clubs: Map<string, ClubInfo> }>;

function top(counts: Counts): TopRow[] {
  const rows: TopRow[] = [];
  for (const { n, names, clubs } of counts.values()) {
    let best = "";
    let bestN = -1;
    for (const [name, c] of names) {
      if (c > bestN) {
        best = name;
        bestN = c;
      }
    }
    const clubList = [...clubs.values()]
      .sort((a, b) => a.first.localeCompare(b.first) || b.n - a.n)
      .map((c) => c.name);
    rows.push({ name: best, count: n, clubs: clubList });
  }
  rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "bs"));
  return rows.slice(0, 25);
}

export const getBrojke = createServerFn({ method: "GET" }).handler(async (): Promise<BrojkeData> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const empty: BrojkeData = {
    scorers: [],
    assists: [],
    seasons: [],
    goalsTotal: 0,
    cupScorers: [],
    cupSeasons: [],
    cupGoalsTotal: 0,
  };
  if (!url || !key) return empty;

  const [archive, current, cup] = await Promise.all([
    load(url, key, "season_goals", [
      "season,player,assist,kind,side,home,away",
      "season,player,kind,side,home,away",
      "season,player,assist,kind",
      "season,player,kind",
    ]),
    load(url, key, "match_goals", [
      "player,assist,kind,team",
      "player,kind,team",
      "player,assist,kind",
      "player,kind",
    ]),
    load(url, key, "cup_goals", ["season,player,kind,side,home,away", "season,player,kind"]),
  ]);

  const scorers: Counts = new Map();
  const assists: Counts = new Map();
  const cupScorers: Counts = new Map();
  const seasons = new Set<string>();
  const cupSeasons = new Set<string>();
  let goalsTotal = 0;
  let cupGoalsTotal = 0;

  const bump = (map: Counts, raw: string | null | undefined, team: string, season: string) => {
    const name = (raw ?? "").trim();
    if (!name) return;
    const k = norm(name);
    if (!k) return;
    const e = map.get(k) ?? { n: 0, names: new Map<string, number>(), clubs: new Map<string, ClubInfo>() };
    e.n += 1;
    e.names.set(name, (e.names.get(name) ?? 0) + 1);
    if (team) {
      const ck = norm(team);
      const c = e.clubs.get(ck);
      if (c) c.n += 1;
      else e.clubs.set(ck, { name: team, first: season || "9999", n: 1 });
    }
    map.set(k, e);
  };

  const feed = (rows: Row[], season: string | null) => {
    for (const r of rows) {
      if (!r.player || !r.player.trim()) continue;
      goalsTotal++;
      const s = season ?? r.season ?? "";
      if (s) seasons.add(s);
      const team = teamOf(r);
      if (!isOwn(r.kind)) bump(scorers, r.player, team, s);
      bump(assists, r.assist, isOwn(r.kind) ? "" : team, s);
    }
  };

  feed(archive, null);
  feed(current, "2026-27");

  for (const r of cup) {
    if (!r.player || !r.player.trim()) continue;
    cupGoalsTotal++;
    if (r.season) cupSeasons.add(r.season);
    if (!isOwn(r.kind)) bump(cupScorers, r.player, teamOf(r), r.season ?? "");
  }

  return {
    scorers: top(scorers),
    assists: top(assists),
    seasons: [...seasons].sort(),
    goalsTotal,
    cupScorers: top(cupScorers),
    cupSeasons: [...cupSeasons].sort(),
    cupGoalsTotal,
  };
});
