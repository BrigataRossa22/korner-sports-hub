import { createServerFn } from "@tanstack/react-start";

export type Club = { name: string; crest: string };

export const getClubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<Club[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/clubs?select=*&limit=500`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as Club[];
  },
);
