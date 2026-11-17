import { createServerFn } from "@tanstack/react-start";

export type OpponentCrestResult = {
  url: string;
  status: "ok" | "rate" | "error";
};

type ApiTeam = {
  strTeam?: string | null;
  strSport?: string | null;
  strBadge?: string | null;
  strTeamBadge?: string | null;
};

function keyOf(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Traži grb kluba u besplatnoj bazi TheSportsDB (upit ide sa servera, ne iz preglednika)
export const getOpponentCrest = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }): Promise<OpponentCrestResult> => {
    const query = (data.query ?? "").trim();
    if (!query) return { url: "", status: "ok" };
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (res.status === 429) return { url: "", status: "rate" };
      if (!res.ok) return { url: "", status: "error" };
      const json = (await res.json()) as { teams?: ApiTeam[] | null };
      const soccer = (json.teams ?? []).filter((t) => t.strSport === "Soccer");
      const want = keyOf(query);
      const pick = soccer.find((t) => keyOf(t.strTeam ?? "") === want) ?? soccer[0];
      const badge = pick?.strBadge || pick?.strTeamBadge || "";
      return { url: badge ? `${badge}/tiny` : "", status: "ok" };
    } catch {
      return { url: "", status: "error" };
    }
  });
