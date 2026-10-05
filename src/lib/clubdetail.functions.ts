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
      get(`club_matches?club=eq.${club}&order=match_date.asc&limit=200`),
      get(`club_trophies?club=eq.${club}&order=sort_order.asc&limit=100`),
      get(`club_achievements?club=eq.${club}&order=sort_order.asc&limit=100`),
    ]);
    return { matches, trophies, achievements };
  });
