import { createServerFn } from "@tanstack/react-start";
import { sameClub } from "@/lib/club-match";

export type ClubInfo = {
  club: string;
  founded: string;
  stadium: string;
};

export const getClubInfo = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<ClubInfo | null> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;
    const res = await fetch(`${url}/rest/v1/club_info?select=*&limit=500`, {
      headers: { apikey: key },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as ClubInfo[];
    return rows.find((r) => sameClub(r.club, data.name)) ?? null;
  });
