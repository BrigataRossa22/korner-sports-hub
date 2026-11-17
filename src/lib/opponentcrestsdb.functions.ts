import { createServerFn } from "@tanstack/react-start";

export type OpponentCrestRow = { key: string; url: string };

export const getOpponentCrestsDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpponentCrestRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/opponent_crests?select=key,url&limit=5000`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as OpponentCrestRow[];
  },
);
