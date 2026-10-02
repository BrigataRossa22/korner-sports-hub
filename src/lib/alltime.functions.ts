import { createServerFn } from "@tanstack/react-start";

export type AllTimeRow = {
  id: string;
  category: string;
  name: string;
  team: string;
  value: number;
};

export const getAllTime = createServerFn({ method: "GET" }).handler(
  async (): Promise<AllTimeRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/all_time?select=*&order=value.desc&limit=500`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as AllTimeRow[];
  },
);
