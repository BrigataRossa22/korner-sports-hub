import { useQuery } from "@tanstack/react-query";
import { getSeasonGoals } from "@/lib/seasongoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";

type Scorer = { player: string; team: string; goals: number };

export function TopScorers({ season }: { season: string }) {
  const { data } = useQuery({
    queryKey: ["season-goals", season],
    queryFn: () => getSeasonGoals({ data: { season } }),
  });
  const crestFor = useClubCrest();

  const map = new Map<string, Scorer>();
  for (const g of data ?? []) {
    if (g.kind === "o") continue; // autogol se ne računa strijelcu
    const team = g.side === "H" ? g.home : g.away;
    const key = `${g.player}|${team}`;
    const s = map.get(key) ?? { player: g.player, team, goals: 0 };
    s.goals += 1;
    map.set(key, s);
  }

  const top = [...map.values()]
    .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, "bs"))
    .slice(0, 10);

  if (top.length === 0) return null;

  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        Najbolji strijelci sezone
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground">
              <th className="w-12 px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Igrač</th>
              <th className="px-4 py-2 text-right">Golovi</th>
            </tr>
          </thead>
          <tbody>
            {top.map((s, i) => {
              const crest = crestFor(s.team);
              return (
                <tr key={`${s.player}|${s.team}`} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-primary">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      {crest ? (
                        <img src={crest} alt="" className="size-7 shrink-0 object-contain" />
                      ) : (
                        <span className="size-7 shrink-0" />
                      )}
                      <span>
                        <span className="block font-semibold">{s.player}</span>
                        <span className="block text-xs text-muted-foreground">{s.team}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold">{s.goals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
