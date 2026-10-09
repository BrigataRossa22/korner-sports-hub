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
    <section className="mt-10 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        Ukupno: BiH klubovi u Evropi
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm tabular-nums">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2 text-left">Ekipa</th>
              <th className="px-3 py-2 text-right">Ut</th>
              <th className="px-3 py-2 text-right">P</th>
              <th className="px-3 py-2 text-right">N</th>
              <th className="px-3 py-2 text-right">I</th>
              <th className="px-3 py-2 text-right">Golovi</th>
              <th className="px-3 py-2 text-right">Primljeni</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const crest = crestFor(s.club);
              return (
                <tr key={s.club} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 font-semibold">
                      {crest ? (
                        <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
                      ) : (
                        <span className="size-6 shrink-0" />
                      )}
                      {s.club}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{s.played}</td>
                  <td className="px-3 py-2 text-right">{s.w}</td>
                  <td className="px-3 py-2 text-right">{s.d}</td>
                  <td className="px-3 py-2 text-right">{s.l}</td>
                  <td className="px-3 py-2 text-right">{s.gf}</td>
                  <td className="px-3 py-2 text-right">{s.ga}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
