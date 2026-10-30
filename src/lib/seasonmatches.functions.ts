import { createServerFn } from "@tanstack/react-start";

export type SeasonMatch = {
  id: string;
  season: string;
  round: number | null;
  match_date: string | null;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
  attendance: number;
  // naziv grupe ili faze; prazno kod sezona s jednom tabelom
  grp?: string | null;
};

export const getSeasonMatches = createServerFn({ method: "GET" })
  .inputValidator((input: { season: string }) => input)
  .handler(async ({ data }): Promise<SeasonMatch[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const season = encodeURIComponent(data.season);
    const res = await fetch(
      `${url}/rest/v1/season_matches?season=eq.${season}&order=round.asc,match_date.asc&limit=1000`,
      { headers: { apikey: key } },
    );
    if (!res.ok) return [];
    return (await res.json()) as SeasonMatch[];
  });
