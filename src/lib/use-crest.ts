import { useQuery } from "@tanstack/react-query";
import { getClubs } from "@/lib/clubs.functions";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Vraća funkciju: ime kluba -> adresa grba (ili "" ako nema). */
export function useCrest(): (clubName: string) => string {
  const { data } = useQuery({ queryKey: ["clubs"], queryFn: () => getClubs() });
  const clubs = (data ?? [])
    .map((c) => ({ key: norm(c.name), crest: c.crest }))
    .sort((a, b) => b.key.length - a.key.length);

  return (clubName: string) => {
    const n = norm(clubName);
    const hit = clubs.find((c) => n.includes(c.key));
    if (!hit) return "";
    return hit.crest.startsWith("http") ? hit.crest : `${SUPA}${hit.crest}`;
  };
}
