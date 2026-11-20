import type { ReactNode } from "react";
import { useMembership } from "@/lib/use-membership";

/** Od ove godine (sezona 2012-13) posjete i strijelci su otvoreni za sve. */
export const FREE_FROM_YEAR = 2012;

/** Tekuća sezona. */
export const CURRENT_SEASON = "2026-27";

/**
 * Je li sezona (ili datum) otvorena za sve? Prima npr. "2012-13", "2012/13" ili "2013-05-20".
 * Starije sezone i nepoznata sezona su zaključane.
 */
export function isFreeSeason(season: string | null | undefined): boolean {
  const y = Number.parseInt(String(season ?? "").slice(0, 4), 10);
  return Number.isFinite(y) && y >= FREE_FROM_YEAR;
}

/**
 * Sadržaj samo za Korner članove i admine.
 * Ostali vide mutan izmišljeni tekst ("fake"); pravi sadržaj se uopće ne šalje u prikaz.
 */
export function Gate({
  children,
  fake,
  free = false,
}: {
  children: ReactNode;
  fake: string;
  /** true = sadržaj je otvoren za sve (npr. sezona 2012-13 i novije) */
  free?: boolean;
}) {
  const m = useMembership();
  if (free || m.hasAccess) return <>{children}</>;
  return (
    <span
      aria-hidden="true"
      title="Otključajte uz Korner članstvo"
      className="inline-block cursor-help select-none blur-[5px]"
    >
      {fake}
    </span>
  );
}

/**
 * Broj gledalaca: članovima (i za sezone od 2012-13) pravi broj, ostalima mutan broj.
 * Vidi se da posjete postoje, ali ne i koliko ih je.
 */
export function Att({
  n,
  season,
}: {
  n: number | null | undefined;
  /** sezona ili datum utakmice; bez nje je broj zaključan */
  season?: string | null;
}) {
  if (n == null || n === 0) return <>—</>;
  if (n < 0) return <>x</>;
  return (
    <Gate free={isFreeSeason(season)} fake="12.345">
      {n.toLocaleString("de-DE")}
    </Gate>
  );
}
