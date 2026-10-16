import { createServerFn } from "@tanstack/react-start";
import { getEternalTable } from "@/lib/eternal.functions";
import { normClub } from "@/lib/club-match";

export type H2HMatch = {
  date: string | null;
  season: string;
  comp: "liga" | "kup";
  home: string;
  away: string;
  sh: number;
  sa: number;
  att: number | null;
};

export type H2HData = { clubs: string[]; matches: H2HMatch[] };

// Oznaka aktuelne sezone (ista kao u clubhistory.functions.ts)
const CURRENT_SEASON = "2026-27";

async function fetchAll<T>(url: string, key: string, path: string, order: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; from < 30000; from += size) {
    const res = await fetch(`${url}/rest/v1/${path}&order=${order}&limit=${size}&offset=${from}`, {
      headers: { apikey: key },
    });
    if (!res.ok) break;
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

type Raw = {
  season?: string;
  match_date: string | null;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
  attendance?: number | null;
};

function namesFrom(res: unknown): string[] {
  const rows: unknown[] = Array.isArray(res)
    ? res
    : res && typeof res === "object" && Array.isArray((res as { rows?: unknown[] }).rows)
      ? (res as { rows: unknown[] }).rows
      : [];
  const names: string[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const n = o["team"] ?? o["name"] ?? o["club"];
    if (typeof n === "string" && n.trim()) names.push(n.trim());
  }
  return names;
}

export const getH2HData = createServerFn({ method: "GET" }).handler(async (): Promise<H2HData> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { clubs: [], matches: [] };

  const [seasonRows, currentRows, cupRows, standingRows] = await Promise.all([
    fetchAll<Raw>(
      url,
      key,
      "season_matches?select=season,match_date,home,away,score_home,score_away,attendance",
      "id.asc",
    ),
    fetchAll<Raw>(
      url,
      key,
      "club_matches?select=match_date,home,away,score_home,score_away,attendance&competition=eq.PLBiH",
      "match_date.asc",
    ),
    fetchAll<Raw>(
      url,
      key,
      "cup_matches?select=season,match_date,home,away,score_home,score_away,attendance",
      "match_date.asc",
    ),
    fetchAll<{ season: string; team: string }>(url, key, "season_standings?select=season,team", "season.desc"),
  ]);

  // 1) Spisak klubova iz Vječne liste (isti izvor kao stranica Vječna tabela)
  let clubs: string[] = [];
  try {
    clubs = namesFrom(await getEternalTable());
  } catch {
    clubs = [];
  }

  // 2) Rezerva: svi klubovi iz arhive sezona, spojeni po normaliziranom imenu
  if (clubs.length === 0) {
    const byNorm = new Map<string, string>();
    for (const r of standingRows) {
      const k = normClub(r.team);
      if (!byNorm.has(k)) byNorm.set(k, r.team);
    }
    clubs = [...byNorm.values()];
  }

  clubs = [...new Set(clubs)].sort((x, y) => x.localeCompare(y, "bs"));

  const seen = new Set<string>();
  const matches: H2HMatch[] = [];

  const add = (r: Raw, season: string, comp: "liga" | "kup") => {
    if (r.score_home == null || r.score_away == null) return;
    const k = `${comp}|${r.match_date}|${r.home}|${r.away}|${r.score_home}-${r.score_away}`;
    if (seen.has(k)) return;
    seen.add(k);
    matches.push({
      date: r.match_date,
      season,
      comp,
      home: r.home,
      away: r.away,
      sh: r.score_home,
      sa: r.score_away,
      att: r.attendance ?? null,
    });
  };

  for (const r of seasonRows) add(r, r.season ?? "", "liga");
  for (const r of currentRows) add(r, CURRENT_SEASON, "liga");
  for (const r of cupRows) add(r, r.season ?? "", "kup");

  return { clubs, matches };
});
