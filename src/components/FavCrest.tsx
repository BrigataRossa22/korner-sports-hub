import { useClubCrest } from "@/lib/use-club-crest";

/** Mali grb omiljenog kluba (ništa ne prikazuje ako grba nema). */
export function FavCrest({ club, className = "size-5" }: { club: string; className?: string }) {
  const crestFor = useClubCrest();
  const src = crestFor(club);
  if (!src) return null;
  return <img src={src} alt={club} title={club} className={`${className} shrink-0 object-contain`} />;
}
