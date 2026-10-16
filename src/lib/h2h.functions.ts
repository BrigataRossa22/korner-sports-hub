import { createServerFn } from "@tanstack/react-start";

export type H2HMatch = {
  date: string | null;
  season: string;
  round: string;
  comp: "liga" | "kup";
  home: string;
  away: string;
  sh: number;
  sa: number;
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
  round: string | number | null;
  match_date: string | null;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
};

export const getH2HData = createServerFn({ method: "GET" }).handler(async (): Promise<H2HData> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { clubs: [], matches: [] };

  const [clubRows, seasonRows, currentRows, cupRows] = await Promise.all([
    fetchAll<{ name: string }>(url, key, "all_time_teams?select=name", "name.asc"),
    fetchAll<Raw>(
      url,
      key,
      "season_matches?select=season,round,match_date,home,away,score_home,score_away",
      "id.asc",
    ),
    fetchAll<Raw>(
      url,
      key,
      "club_matches?select=round,match_date,home,away,score_home,score_away&competition=eq.PLBiH",
      "match_date.asc",
    ),
    fetchAll<Raw>(
      url,
      key,
      "cup_matches?select=season,round,match_date,home,away,score_home,score_away",
      "match_date.asc",
    ),
  ]);

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
      round: r.round == null ? "" : String(r.round),
      comp,
      home: r.home,
      away: r.away,
      sh: r.score_home,
      sa: r.score_away,
    });
  };

  for (const r of seasonRows) add(r, r.season ?? "", "liga");
  for (const r of currentRows) add(r, CURRENT_SEASON, "liga");
  for (const r of cupRows) add(r, r.season ?? "", "kup");

  return { clubs: clubRows.map((c) => c.name), matches };
});
