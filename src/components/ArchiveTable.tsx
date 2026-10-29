import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getSeasonStandings } from "@/lib/seasons.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export function useSeasons() {
  const { data, isLoading } = useQuery({
    queryKey: ["season-standings"],
    queryFn: () => getSeasonStandings(),
  });
  const rows = data ?? [];
  const seasons = [...new Set(rows.map((r) => r.season))];
  return { rows, seasons, isLoading };
}

export function ArchiveTable({ season }: { season: string }) {
  const { rows, isLoading } = useSeasons();
  const crestFor = useClubCrest();
  const list = rows.filter((r) => r.season === season).sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <TableSkeleton rows={10} cols={8} />
      </div>
    );
  }
  if (list.length === 0) {
    return <p className="border-y border-border py-8 text-muted-foreground">Nema podataka za ovu sezonu.</p>;
  }

  return (
    <div className="border-y border-border sm:overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums sm:min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th className="w-8 px-1 py-3 text-center sm:w-10 sm:px-2">#</th>
            <th className="px-1 py-3 text-left sm:px-2">
              <span className="hidden sm:inline">Klub</span>
            </th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">Ut</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">P</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">N</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">I</th>
            <th className="hidden w-16 px-1 py-3 text-center sm:table-cell">Golovi</th>
            <th className="w-10 px-0.5 py-3 text-center sm:w-12 sm:px-1">GR</th>
            <th className="w-10 px-1 py-3 text-center sm:w-12 sm:px-2">Bod</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const crest = crestFor(r.team);
            const gd = r.goals_for - r.goals_against;
            const pen = r.penalty ?? 0;
            return (
              <tr key={r.id} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className="px-1 py-2.5 text-center font-semibold text-primary sm:px-2 sm:py-3">{r.position}</td>
                <td className="px-1 py-2.5 text-left font-semibold sm:px-2 sm:py-3">
                  <Link
                    to="/arhiva/$season/$club"
                    params={{ season, club: r.team }}
                    title={r.team}
                    aria-label={r.team}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {crest ? (
                      <img src={crest} alt="" className="size-7 shrink-0 object-contain sm:size-6" />
                    ) : (
                      <span className="size-7 shrink-0 sm:size-6" />
                    )}
                    <span>
                      <span className="hidden sm:inline">{r.team}</span>
                      {pen > 0 && (
                        <span
                          className="text-xs font-medium text-muted-foreground sm:ml-1.5"
                          title="Oduzeti bodovi"
                        >
                          (−{pen})
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.played}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.wins}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.draws}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.losses}</td>
                <td className="hidden px-1 py-3 text-center sm:table-cell">{r.goals_for}:{r.goals_against}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{gd > 0 ? "+" : ""}{gd}</td>
                <td className="px-1 py-2.5 text-center font-bold text-primary sm:px-2 sm:py-3">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
