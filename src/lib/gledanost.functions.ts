import { createServerFn } from "@tanstack/react-start";

export type AttRow = { season: string; club: string; att: number };
export type GledanostData = { rows: AttRow[]; seasons: string[] };

// Mora biti ista oznaka kao u clubhistory.functions.ts
const CURRENT_SEASON = "2026-27";

// Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo po stranicama.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAll(url: string, key: string, path: string): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any[] = [];
  const size = 1000;
  for (let from = 0; from < 100000; from += size) {
    const res = await fetch(`${url}/rest/v1/${path}&limit=${size}&offset=${from}`, {
      headers: { apikey: key },
    });
    if (!res.ok) break;
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export const getGledanost = createServerFn({ method: "GET" }).handler(
  async (): Promise<GledanostData> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { rows: [], seasons: [] };

    const [archive, current] = await Promise.all([
      getAll(url, key, "season_matches?select=season,home,attendance&attendance=gt.0&order=id.asc"),
      getAll(
        url,
        key,
        "club_matches?select=match_date,home,away,competition,attendance&attendance=gt.0&order=match_date.asc",
      ),
    ]);

    const rows: AttRow[] = [];
    const seasons = new Set<string>();

    for (const r of archive) {
      if (!r.home || !r.season || !(r.attendance > 0)) continue;
      rows.push({ season: String(r.season), club: String(r.home), att: Number(r.attendance) });
      seasons.add(String(r.season));
    }

    // Tekuća sezona: samo ligaške utakmice (PLBiH), svaka jednom
    const seen = new Set<string>();
    for (const m of current) {
      if (!String(m.competition ?? "").toLowerCase().startsWith("plbih")) continue;
      const k = `${m.match_date}|${m.home}|${m.away}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (!m.home || !(m.attendance > 0)) continue;
      rows.push({ season: CURRENT_SEASON, club: String(m.home), att: Number(m.attendance) });
      seasons.add(CURRENT_SEASON);
    }

    return { rows, seasons: [...seasons].sort((a, b) => b.localeCompare(a)) };
  },
);
