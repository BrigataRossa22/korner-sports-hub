import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubTopScorers } from "@/lib/clubscorers.functions";

// Mjesto u tabeli: isti broj golova = isto mjesto
function withRank<T extends { goals: number }>(rows: T[]) {
  let rank = 0;
  let prev = -1;
  return rows.map((r, i) => {
    if (r.goals !== prev) {
      rank = i + 1;
      prev = r.goals;
    }
    return { ...r, rank };
  });
}

export function ClubTopScorers({ name }: { name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["club-top-scorers", name],
    queryFn: () => getClubTopScorers({ data: { name } }),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="mt-10 rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
          Top 10 strijelaca
        </h2>
        <TableSkeleton rows={6} cols={3} />
      </section>
    );
  }

  if (!data || data.scorers.length === 0) return null;

  const ranked = withRank(data.scorers);
  const range = data.firstSeason && data.lastSeason ? `${data.firstSeason} do ${data.lastSeason}` : "";

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">Top 10 strijelaca · Liga</h2>
        {range && <span className="text-xs text-muted-foreground">Sezone {range}</span>}
      </div>
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th className="w-12 px-3 py-2 text-center">#</th>
            <th className="px-2 py-2 text-left">Igrač</th>
            <th className="w-24 px-3 py-2 text-right">Golova</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => (
            <tr key={`${r.name}-${i}`} className="border-b border-border/70 last:border-0 even:bg-surface/50">
              <td className={`px-3 py-2.5 text-center font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>
                {r.rank}
              </td>
              <td className={`px-2 py-2.5 font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>{r.name}</td>
              <td className="px-3 py-2.5 text-right text-base font-bold">{r.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Samo ligaški golovi za ovaj klub, bez autogolova.
      </p>
    </section>
  );
}
