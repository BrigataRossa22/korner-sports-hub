import { useQuery } from "@tanstack/react-query";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
import { getCupMatches } from "@/lib/cupmatches.functions";
import { getOpponentCrestsDb } from "@/lib/opponentcrestsdb.functions";
import { useCrest } from "@/lib/use-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";
const PREFIXES = new Set(["fk", "nk", "hsk", "hnk", "sk", "gnk", "fc", "nogometni", "klub"]);

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PREFIXES.has(w))
    .join(" ");
}

// Ključ za grbove evropskih protivnika (tabela opponent_crests); isti postupak kao u use-opponent-crest.ts
function oppKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const full = (crest: string): string => (crest.startsWith("http") ? crest : `${SUPA}${crest}`);

// Grb koji vrijedi samo u određenim sezonama (ključ: početna godina sezone -> ime kluba -> fajl grba).
// Novi slučaj dodaješ kao jedan red.
const SEASON_CRESTS: Record<string, Record<string, string>> = {
  "2000": { ljubuski: "hnkljubuski.webp" },
  "2003": { ljubuski: "hnkljubuski.webp" },
  "2004": { ljubuski: "hnkljubuski.webp" },
};

/**
 * Ime kluba -> adresa grba. Ako je zadana sezona, prvo se gleda grb koji vrijedi samo za tu sezonu.
 * Redoslijed: Vječna lista (tačno ime), grb upisan u utakmicama Kupa BiH (tačno ime),
 * grb evropskog protivnika (tabela opponent_crests), Vječna lista (slično ime), pa tabela clubs.
 */
export function useClubCrest(season?: string): (club: string) => string {
  const { data } = useQuery({ queryKey: ["all-time-teams"], queryFn: () => getAllTimeTeams() });
  const { data: cup } = useQuery({ queryKey: ["cup-matches"], queryFn: () => getCupMatches() });
  const { data: oppRows } = useQuery({
    queryKey: ["opponent-crests-db"],
    queryFn: () => getOpponentCrestsDb(),
    staleTime: Infinity,
  });
  const fallback = useCrest();

  // Grbovi evropskih protivnika (Evropa)
  const oppMap = new Map<string, string>();
  for (const r of oppRows ?? []) if (r.url) oppMap.set(r.key, r.url);

  const list = (data ?? [])
    .filter((t) => t.crest)
    .map((t) => ({ key: norm(t.team), crest: t.crest }));

  // Grbovi upisani u kupu: novija utakmica prepiše stariju
  const cupMap = new Map<string, string>();
  for (const m of cup ?? []) {
    const pairs: [string, string][] = [
      [m.home, m.home_crest],
      [m.away, m.away_crest],
    ];
    for (const [name, crest] of pairs) {
      const c = (crest ?? "").trim();
      const k = norm(name ?? "");
      if (c && k) cupMap.set(k, c);
    }
  }

  const startYear = season?.match(/\d{4}/)?.[0] ?? "";

  return (club: string) => {
    const n = norm(club);
    if (n) {
      const bySeason = SEASON_CRESTS[startYear]?.[n];
      if (bySeason) return full(bySeason);

      const exact = list.find((t) => t.key === n);
      if (exact) return full(exact.crest);

      const fromCup = cupMap.get(n);
      if (fromCup) return full(fromCup);

      const opp = oppMap.get(oppKey(club));
      if (opp) return opp;

      const hit = list
        .filter((t) => t.key.length >= 4 && (n.includes(t.key) || t.key.includes(n)))
        .sort((a, b) => b.key.length - a.key.length)[0];
      if (hit) return full(hit.crest);
    }
    return fallback(club) || oppMap.get(oppKey(club)) || "";
  };
}
