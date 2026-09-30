import { useEffect, useState } from "react";

/**
 * Prvo renderovanje u pregledaču mora da se poklopi sa servernim, pa se
 * podaci iz keša prikazuju tek kad stranica "oživi" na klijentu.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
