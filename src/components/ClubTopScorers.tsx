import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubTopScorers, type ScorerComp } from "@/lib/clubscorers.functions";

const COMPS: { id: ScorerComp; label: string; note: string; empty: string }[] = [
  {
    id: "liga",
    label: "Liga",
    note: "Samo ligaški golovi za ovaj klub, bez autogolova.",
    empty: "Još nema podataka o strijelcima u ligi.",
  },
  {
    id: "kup",
    label: "Kup",
    note: "Samo golovi u Kupu BiH za ovaj klub, bez autogolova.",
    empty: "Još nema podataka o strijelcima u Kupu.",
  },
  {
    id: "evropa",
    label: "Evropa",
    note: "Samo golovi u evropskim takmičenjima za ovaj klub, bez autogolova.",
    empty: "Još nema podataka o strijelcima u Evropi.",
  },
];

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

const seasonsLabel = (first: string, last: string) =>
  !first ? "" : first === last ? first : `${first} – ${last}`;

export function ClubTopScorers({ name }: { name: string }) {
  const [comp, setComp] = useState<ScorerComp>("liga");
  const cfg = COMPS.find((c) => c.id === comp) ?? COMPS[0];

  const { data, isLoading } = useQuery({
    queryKey: ["club-top-scorers", name, comp],
    queryFn: () => getClubTopScorers({ data: { name, comp } }),
    staleTime: 60 * 60 * 1000,
  });

  const ranked = withRank(data?.scorers ?? []);
  const max = ranked.reduce((m, r) => Math.max(m, r.goals), 0) || 1;
  const range =
    data && data.firstSeason && data.lastSeason
      ? seasonsLabel(data.firstSeason, data.lastSeason)
      : "";

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <h2 className="font-display text-lg font-bold uppercase">Top 10 strijelaca</h2>
          {range && <p className="mt-0.5 text-xs text-muted-foreground">Sezone {range}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setComp(c.id)}
              className={`rounded-full border px-4 py-1 font-display text-xs font-semibold uppercase tracking-wide transition-colors ${
                comp === c.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : ranked.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">{cfg.empty}</p>
      ) : (
        <ol className="divide-y divide-border">
          {ranked.map((r, i) => (
            <li key={`${r.name}-${i}`} className="px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="w-6 shrink-0 text-center text-base font-bold tabular-nums">
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{r.name}</p>
                  {r.firstSeason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {seasonsLabel(r.firstSeason, r.lastSeason)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-2xl font-bold tabular-nums">{r.goals}</span>
                  <span className="ml-1 text-xs uppercase text-muted-foreground">gol.</span>
                </div>
              </div>
              <div className="ml-10 mt-2 h-0.5 bg-border">
                <div className="h-full bg-foreground" style={{ width: `${(r.goals / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{cfg.note}</p>
    </section>
  );
}
