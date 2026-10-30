import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SeasonRounds } from "@/components/SeasonRounds";
import { TableSkeleton } from "@/components/TableSkeleton";
import { compareGroups, groupRank } from "@/lib/season-groups";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { getSeasonStandings, type SeasonRow } from "@/lib/seasons.functions";
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

function StandingsBlock({ list, season }: { list: SeasonRow[]; season: string }) {
  const crestFor = useClubCrest();
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

export function ArchiveTable({ season }: { season: string }) {
  const { rows, isLoading } = useSeasons();
  const { data: matchData } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
  });
  const [pickedGroup, setPickedGroup] = useState<string | null>(null);

  useEffect(() => {
    setPickedGroup(null);
  }, [season]);

  const all = rows.filter((r) => r.season === season);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <TableSkeleton rows={10} cols={8} />
      </div>
    );
  }
  if (all.length === 0) {
    return <p className="border-y border-border py-8 text-muted-foreground">Nema podataka za ovu sezonu.</p>;
  }

  const sorted = (n: string) =>
    all.filter((r) => (r.grp ?? "") === n).sort((a, b) => a.position - b.position);

  // Obična sezona: jedna tabela
  const tableNames = [...new Set(all.map((r) => r.grp ?? ""))];
  if (tableNames.length === 1) {
    return <StandingsBlock list={sorted(tableNames[0] ?? "")} season={season} />;
  }

  // Sezona s grupama (npr. 1994/95): izbor grupe, pretkolo play-offa, na dnu finalna grupa
  const allNames = [
    ...new Set([...tableNames, ...(matchData ?? []).map((m) => m.grp ?? "").filter((n) => n !== "")]),
  ].sort(compareGroups);
  const groupNames = allNames.filter((n) => groupRank(n) === 1);
  const playoffNames = allNames.filter((n) => groupRank(n) === 2);
  const finalNames = allNames.filter((n) => groupRank(n) === 3);
  const sel = pickedGroup !== null && groupNames.includes(pickedGroup) ? pickedGroup : (groupNames[0] ?? "");

  const heading = "mb-3 font-display text-xl font-bold uppercase";

  return (
    <div className="space-y-12">
      {groupNames.length > 0 && (
        <section>
          <h2 className={heading}>Grupe</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {groupNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPickedGroup(n)}
                aria-pressed={n === sel}
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                  n === sel
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <StandingsBlock list={sorted(sel)} season={season} />
          <SeasonRounds key={sel} season={season} grp={sel} />
        </section>
      )}

      {playoffNames.map((n) => (
        <section key={n}>
          <h2 className={heading}>{n}</h2>
          <SeasonRounds season={season} grp={n} />
        </section>
      ))}

      {finalNames.map((n) => (
        <section key={n}>
          <h2 className={heading}>{n}</h2>
          {sorted(n).length > 0 && <StandingsBlock list={sorted(n)} season={season} />}
          <SeasonRounds season={season} grp={n} />
        </section>
      ))}
    </div>
  );
}
