import { useQuery } from "@tanstack/react-query";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
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

/** Ime kluba -> adresa grba. Prvo Vječna lista, pa tabela clubs. */
export function useClubCrest(): (club: string) => string {
  const { data } = useQuery({ queryKey: ["all-time-teams"], queryFn: () => getAllTimeTeams() });
  const fallback = useCrest();
  const list = (data ?? [])
    .filter((t) => t.crest)
    .map((t) => ({ key: norm(t.team), crest: t.crest }));

  return (club: string) => {
    const n = norm(club);
    if (n) {
      let hit = list.find((t) => t.key === n);
      if (!hit) {
        hit = list
          .filter((t) => t.key.length >= 4 && (n.includes(t.key) || t.key.includes(n)))
          .sort((a, b) => b.key.length - a.key.length)[0];
      }
      if (hit) return hit.crest.startsWith("http") ? hit.crest : `${SUPA}${hit.crest}`;
    }
    return fallback(club);
  };
}
