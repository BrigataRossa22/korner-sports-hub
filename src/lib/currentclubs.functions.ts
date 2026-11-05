import { createServerFn } from "@tanstack/react-start";

// Klubovi koji su trenutno u tabeli lige (tabela "standings"), po redoslijedu u tabeli
export const getCurrentClubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/standings?select=team,sort_order&order=sort_order.asc&limit=100`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { team: string }[];
    return rows.map((r) => (r.team ?? "").trim()).filter(Boolean);
  },
);
