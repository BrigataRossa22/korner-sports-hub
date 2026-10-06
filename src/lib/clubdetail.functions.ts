import { createServerFn } from "@tanstack/react-start";

export type ClubMatch = {
  id: string;
  match_date: string;
  competition: string;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
  attendance: number;
};
export type ClubTrophy = {
  id: string;
  title: string;
  times: number;
  years: string;
  image: string;
};
export type ClubAchievement = { id: string; text: string };
export type ClubDetail = {
  matches: ClubMatch[];
  trophies: ClubTrophy[];
  achievements: ClubAchievement[];
};

export const getClubDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<ClubDetail> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const empty: ClubDetail = { matches: [], trophies: [], achievements: [] };
    if (!url || !key) return empty;
    const club = encodeURIComponent(data.name);
    const get = async (path: string) => {
      const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key } });
      return res.ok ? await res.json() : [];
    };
    const [matches, trophies, achievements] = await Promise.all([
      get(
        `club_matches?or=(home.eq.${club},away.eq.${club},club.eq.${club})&order=match_date.asc&limit=500`,
      ),
      get(`club_trophies?club=eq.${club}&order=sort_order.asc&limit=100`),
      get(`club_achievements?club=eq.${club}&order=sort_order.asc&limit=100`),
    ]);

    // ukloni duplikate (ista utakmica upisana dva puta)
    const seen = new Set<string>();
    const unique = (matches as ClubMatch[]).filter((m) => {
      const k = `${m.match_date}|${m.home}|${m.away}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return { matches: unique, trophies, achievements };
  });
