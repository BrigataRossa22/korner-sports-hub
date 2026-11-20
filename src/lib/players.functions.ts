import { createServerFn } from "@tanstack/react-start";

export type PlayerStat = {
  id: string;
  kind: "scorer" | "assist";
  name: string;
  team: string;
  value: number;
};

type GoalRow = {
  player: string | null;
  assist: string | null;
  team: string | null;
  kind: string | null;
};

const TOP = 25;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isOwn = (k: string | null | undefined) => {
  const x = (k ?? "").toLowerCase();
  return x === "o" || x === "own" || x.startsWith("auto");
};

// Supabase vraća najviše 1000 redova po zahtjevu, pa čitamo jednu po jednu stranicu
async function loadAll<T>(url: string, key: string, path: string): Promise<T[] | null> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; from < 100000; from += size) {
    const res = await fetch(`${url}/rest/v1/${path}&limit=${size}&offset=${from}`, {
      headers: { apikey: key },
    });
    if (!res.ok) return from === 0 ? null : out;
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

type Acc = { n: number; names: Map<string, number>; teams: Map<string, number> };

function bump(map: Map<string, Acc>, raw: string | null, team: string) {
  const name = (raw ?? "").trim();
  if (!name) return;
  const k = norm(name);
  if (!k) return;
  const e = map.get(k) ?? { n: 0, names: new Map<string, number>(), teams: new Map<string, number>() };
  e.n += 1;
  e.names.set(name, (e.names.get(name) ?? 0) + 1);
  if (team) e.teams.set(team, (e.teams.get(team) ?? 0) + 1);
  map.set(k, e);
}

const mostCommon = (m: Map<string, number>): string => {
  let best = "";
  let bestN = -1;
  for (const [k, v] of m) {
    if (v > bestN) {
      best = k;
      bestN = v;
    }
  }
  return best;
};

function toStats(map: Map<string, Acc>, kind: "scorer" | "assist"): PlayerStat[] {
  return [...map.entries()]
    .map(([k, e]) => ({
      id: `${kind}-${k}`,
      kind,
      name: mostCommon(e.names),
      team: mostCommon(e.teams),
      value: e.n,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "bs"))
    .slice(0, TOP);
}

// Strijelci i asistenti tekuće sezone računaju se iz golova po utakmicama (match_goals),
// pa se uvijek poklapaju sa stranicom igrača. Ako ta tabela nije dostupna, koristi se player_stats.
export const getPlayerStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlayerStat[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];

    // Ako kolona assist ne postoji, probamo bez nje
    const goals =
      (await loadAll<GoalRow>(url, key, "match_goals?select=player,assist,team,kind&order=id.asc")) ??
      (await loadAll<GoalRow>(url, key, "match_goals?select=player,team,kind&order=id.asc"));

    if (goals && goals.length > 0) {
      const scorers = new Map<string, Acc>();
      const assists = new Map<string, Acc>();
      for (const g of goals) {
        const team = (g.team ?? "").trim();
        if (!isOwn(g.kind)) bump(scorers, g.player, team);
        if (!isOwn(g.kind)) bump(assists, g.assist, "");
      }
      // Klub asistenta: klub koji je dao gol
      for (const g of goals) {
        const name = (g.assist ?? "").trim();
        const team = (g.team ?? "").trim();
        if (!name || !team || isOwn(g.kind)) continue;
        const e = assists.get(norm(name));
        if (e) e.teams.set(team, (e.teams.get(team) ?? 0) + 1);
      }
      return [...toStats(scorers, "scorer"), ...toStats(assists, "assist")];
    }

    const res = await fetch(`${url}/rest/v1/player_stats?select=*&order=value.desc&limit=100`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as PlayerStat[];
  },
);
