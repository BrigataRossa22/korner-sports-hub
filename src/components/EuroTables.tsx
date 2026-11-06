import { useQuery } from "@tanstack/react-query";
import { getEuroMatches } from "@/lib/euromatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

type Stat = { club: string; played: number; w: number; d: number; l: number; gf: number; ga: number };

function parse(score: string): [number, number] | null {
  const m = /^\s*(\d+)\s*[:\-–]\s*(\d+)/.exec(score ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export function EuroTotals() {
  const { data } = useQuery({ queryKey: ["euro-matches"], queryFn: () => getEuroMatches() });
  const crestFor = useClubCrest();
  const rows = data ?? [];

  const map = new Map<string, Stat>();
  for (const r of rows) {
    const name = r.club.trim();
    const s = map.get(name) ?? { club: name, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    for (const leg of [r.home, r.away]) {
      const p = parse(leg);
      if (!p) continue;
      s.played++;
      s.gf += p[0];
      s.ga += p[1];
      if (p[0] > p[1]) s.w++;
      else if (p[0] === p[1]) s.d++;
      else s.l++;
    }
    map.set(name, s);
  }
  const list = [...map.values()]
    .filter((s) => s.played > 0)
    .sort((a, b) => b.played - a.played || b.w - a.w || a.club.localeCompare(b.club));

  if (list.length === 0) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        Ukupno: BiH klubovi u Evropi
      </h2>
      <table className="w-full table-fixed text-[13px] tabular-nums sm:table-auto sm:text-sm">
        <thead>
          <tr className="text-xs uppercase text-muted-foreground">
            <th className="px-2 py-2 text-left sm:px-3">Ekipa</th>
            <th className="w-9 px-1 py-2 text-right sm:w-auto sm:px-3">Ut</th>
            <th className="w-8 px-1 py-2 text-right sm:w-auto sm:px-3">P</th>
            <th className="w-8 px-1 py-2 text-right sm:w-auto sm:px-3">N</th>
            <th className="w-8 px-1 py-2 text-right sm:w-auto sm:px-3">I</th>
            {/* Telefon: golovi skraćeno kao postignuti:primljeni */}
            <th className="w-14 px-2 py-2 text-right sm:hidden">Gol</th>
            <th className="hidden px-3 py-2 text-right sm:table-cell">Golovi</th>
            <th className="hidden px-3 py-2 text-right sm:table-cell">Primljeni</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => {
            const crest = crestFor(s.club);
            return (
              <tr key={s.club} className="border-t border-border">
                <td className="min-w-0 px-2 py-2.5 sm:px-3 sm:py-2">
                  <span className="flex min-w-0 items-center gap-1.5 font-semibold sm:gap-2">
                    {crest ? (
                      <img src={crest} alt="" className="size-5 shrink-0 object-contain sm:size-6" />
                    ) : (
                      <span className="size-5 shrink-0 sm:size-6" />
                    )}
                    <span className="truncate">{s.club}</span>
                  </span>
                </td>
                <td className="px-1 py-2.5 text-right font-bold sm:px-3 sm:py-2">{s.played}</td>
                <td className="px-1 py-2.5 text-right sm:px-3 sm:py-2">{s.w}</td>
                <td className="px-1 py-2.5 text-right sm:px-3 sm:py-2">{s.d}</td>
                <td className="px-1 py-2.5 text-right sm:px-3 sm:py-2">{s.l}</td>
                <td className="px-2 py-2.5 text-right sm:hidden">
                  {s.gf}:{s.ga}
                </td>
                <td className="hidden px-3 py-2 text-right sm:table-cell">{s.gf}</td>
                <td className="hidden px-3 py-2 text-right sm:table-cell">{s.ga}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
