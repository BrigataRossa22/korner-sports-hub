import { useQuery } from "@tanstack/react-query";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
import { getCupMatches } from "@/lib/cupmatches.functions";
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

const full = (crest: string): string => (crest.startsWith("http") ? crest : `${SUPA}${crest}`);

/**
 * Ime kluba -> adresa grba.
 * Redoslijed: Vječna lista (tačno ime), grb upisan u utakmicama Kupa BiH (tačno ime),
 * Vječna lista (slično ime), pa tabela clubs.
 */
export function useClubCrest(): (club: string) => string {
  const { data } = useQuery({ queryKey: ["all-time-teams"], queryFn: () => getAllTimeTeams() });
  const { data: cup } = useQuery({ queryKey: ["cup-matches"], queryFn: () => getCupMatches() });
  const fallback = useCrest();

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

  return (club: string) => {
    const n = norm(club);
    if (n) {
      const exact = list.find((t) => t.key === n);
      if (exact) return full(exact.crest);

      const fromCup = cupMap.get(n);
      if (fromCup) return full(fromCup);

      const hit = list
        .filter((t) => t.key.length >= 4 && (n.includes(t.key) || t.key.includes(n)))
        .sort((a, b) => b.key.length - a.key.length)[0];
      if (hit) return full(hit.crest);
    }
    return fallback(club);
  };
}
