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

// Na mobitelu: # i grb ostaju zaglavljeni lijevo, a ime kluba klizi ispod grba
const stickyHead = "sticky z-20 bg-surface sm:static sm:bg-transparent";
const stickyCell = "sticky z-10 bg-card sm:static sm:bg-transparent";

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
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[500px] border-collapse text-sm tabular-nums sm:min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th className={`${stickyHead} left-0 w-8 min-w-8 px-1 py-3 text-center sm:w-10 sm:px-2`}>#</th>
            <th
              className={`${stickyHead} left-8 w-11 min-w-11 border-r border-border px-1 py-3 sm:w-10 sm:min-w-0 sm:border-r-0 sm:px-0`}
            />
            <th className="w-28 min-w-28 px-1 py-3 text-left sm:w-auto sm:px-2">Klub</th>
            {/* Bod odmah poslije kluba, samo na mobitelu */}
            <th className="w-11 px-1 py-3 text-center sm:hidden">Bod</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">Ut</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">P</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">N</th>
            <th className="w-9 px-0.5 py-3 text-center sm:w-10 sm:px-1">I</th>
            <th className="w-16 px-1 py-3 text-center">Golovi</th>
            <th className="w-10 px-0.5 py-3 text-center sm:w-12 sm:px-1">GR</th>
            <th className="hidden w-12 px-2 py-3 text-center sm:table-cell">Bod</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const crest = crestFor(r.team);
            const gd = r.goals_for - r.goals_against;
            const pen = r.penalty ?? 0;
            return (
              <tr key={r.id} className="border-b border-border/70 last:border-0 sm:even:bg-surface/50">
                <td
                  className={`${stickyCell} left-0 w-8 min-w-8 px-1 py-2.5 text-center font-semibold text-primary sm:px-2 sm:py-3`}
                >
                  {r.position}
                </td>
                <td
                  className={`${stickyCell} left-8 w-11 min-w-11 border-r border-border px-1 py-2.5 sm:w-10 sm:min-w-0 sm:border-r-0 sm:px-0 sm:py-3`}
                >
                  <Link
                    to="/arhiva/$season/$club"
                    params={{ season, club: r.team }}
                    title={r.team}
                    aria-label={r.team}
                    className="flex items-center justify-center sm:justify-start"
                  >
                    {crest ? (
                      <img src={crest} alt="" className="size-7 shrink-0 object-contain sm:size-6" />
                    ) : (
                      <span className="size-7 shrink-0 sm:size-6" />
                    )}
                  </Link>
                </td>
                <td className="w-28 min-w-28 max-w-28 px-1 py-2.5 text-left font-semibold sm:w-auto sm:max-w-none sm:px-2 sm:py-3">
                  <Link
                    to="/arhiva/$season/$club"
                    params={{ season, club: r.team }}
                    title={r.team}
                    className="flex items-center gap-1.5 hover:underline"
                  >
                    <span className="min-w-0 truncate text-[13px] sm:overflow-visible sm:text-sm">
                      {r.team}
                    </span>
                    {pen > 0 && (
                      <span
                        className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground"
                        title="Oduzeti bodovi"
                      >
                        (−{pen})
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-1 py-2.5 text-center font-bold text-primary sm:hidden">{r.points}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.played}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.wins}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.draws}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{r.losses}</td>
                <td className="whitespace-nowrap px-1 py-2.5 text-center sm:py-3">
                  {r.goals_for}:{r.goals_against}
                </td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">
                  {gd > 0 ? "+" : ""}
                  {gd}
                </td>
                <td className="hidden px-2 py-3 text-center font-bold text-primary sm:table-cell">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
