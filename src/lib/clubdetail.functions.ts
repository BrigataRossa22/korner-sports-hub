import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";

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
    const get = async (path: string) => {
      const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key } });
      return res.ok ? await res.json() : [];
    };
    const [allMatches, allTrophies, allAch] = await Promise.all([
      get("club_matches?select=*&order=match_date.asc&limit=1000"),
      get("club_trophies?select=*&order=sort_order.asc&limit=1000"),
      get("club_achievements?select=*&order=sort_order.asc&limit=1000"),
    ]);

    const seen = new Set<string>();
    const matches = (allMatches as ClubMatch[])
      .filter((m) => sameClub(m.home, data.name) || sameClub(m.away, data.name))
      .filter((m) => {
        const k = `${m.match_date}|${m.home}|${m.away}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    const trophies = (allTrophies as (ClubTrophy & { club: string })[]).filter((t) =>
      sameClub(t.club, data.name),
    );
    const achievements = (allAch as (ClubAchievement & { club: string })[]).filter((a) =>
      sameClub(a.club, data.name),
    );

    return { matches, trophies, achievements };
  });
