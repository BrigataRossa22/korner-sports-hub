import { createServerFn } from "@tanstack/react-start";

export type PlayerGoal = {
  season: string;
  round: number | null;
  home: string;
  away: string;
  team: string;
  minute: number | null;
  extra: number | null;
  penalty: boolean;
};

type Row = {
  season?: string | null;
  round?: number | null;
  home?: string | null;
  away?: string | null;
  side?: string | null;
  team?: string | null;
  player?: string | null;
  minute?: number | null;
  extra?: number | null;
  kind?: string | null;
};

// Aktuelna sezona (golovi se čitaju iz tabele match_goals)
const CURRENT_SEASON = "2026-27";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isOwn = (k: string | null | undefined) => {
  const x = (k ?? "").toLowerCase();
  return x === "o" || x === "own" || x.startsWith("auto");
};

const isPen = (k: string | null | undefined) => {
  const x = (k ?? "").toLowerCase();
  return x === "p" || x === "pen" || x.startsWith("penal");
};

// Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo jednu po jednu stranicu
async function loadAll(url: string, key: string, path: string): Promise<Row[]> {
  const out: Row[] = [];
  const size = 1000;
  for (let from = 0; from < 200000; from += size) {
    const res = await fetch(`${url}/rest/v1/${path}&limit=${size}&offset=${from}`, {
      headers: { apikey: key },
    });
    if (!res.ok) break;
    const rows = (await res.json()) as Row[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export const getPlayerGoals = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<PlayerGoal[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const target = norm(data.name);
    if (!target) return [];

    const [archive, current] = await Promise.all([
      loadAll(url, key, "season_goals?select=season,round,home,away,side,player,minute,extra,kind&order=id.asc"),
      loadAll(url, key, "match_goals?select=*&order=round.asc,minute.asc,extra.asc"),
    ]);

    const out: PlayerGoal[] = [];

    for (const r of archive) {
      if (!r.player || norm(r.player) !== target || isOwn(r.kind)) continue;
      const team = r.side === "H" ? (r.home ?? "") : r.side === "A" ? (r.away ?? "") : "";
      out.push({
        season: r.season ?? "",
        round: r.round ?? null,
        home: r.home ?? "",
        away: r.away ?? "",
        team,
        minute: r.minute ?? null,
        extra: r.extra ?? null,
        penalty: isPen(r.kind),
      });
    }

    for (const r of current) {
      if (!r.player || norm(r.player) !== target || isOwn(r.kind)) continue;
      out.push({
        season: CURRENT_SEASON,
        round: r.round ?? null,
        home: r.home ?? "",
        away: r.away ?? "",
        team: r.team ?? "",
        minute: r.minute ?? null,
        extra: r.extra ?? null,
        penalty: isPen(r.kind),
      });
    }

    out.sort(
      (a, b) =>
        a.season.localeCompare(b.season) ||
        (a.round ?? 0) - (b.round ?? 0) ||
        (a.minute ?? 0) - (b.minute ?? 0),
    );
    return out;
  });
