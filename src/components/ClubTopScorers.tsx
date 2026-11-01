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

const MEDAL = ["bg-yellow-500/90", "bg-zinc-400", "bg-amber-700"];

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
  const max = ranked[0]?.goals ?? 1;
  const range = data && data.firstSeason && data.lastSeason ? seasonsLabel(data.firstSeason, data.lastSeason) : "";

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
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
              className={`rounded-md border px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide ${
                comp === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
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
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="text-3xl" aria-hidden>
            ⚽
          </span>
          <p className="text-sm text-muted-foreground">{cfg.empty}</p>
        </div>
      ) : (
        <ul>
          {ranked.map((r, i) => {
            const top = r.rank <= 3;
            return (
              <li
                key={`${r.name}-${i}`}
                className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-0 even:bg-surface/50"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                    top ? `${MEDAL[r.rank - 1]} text-white` : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate font-semibold ${top ? "text-primary" : ""}`}>{r.name}</p>
                    <p className="shrink-0 text-lg font-bold tabular-nums">
                      {r.goals}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">gol.</span>
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(6, Math.round((r.goals / max) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {seasonsLabel(r.firstSeason, r.lastSeason)}
                    {r.penalties > 0 && (
                      <>
                        {r.firstSeason ? " · " : ""}
                        {r.penalties} {r.penalties === 1 ? "penal" : "penala"}
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{cfg.note}</p>
    </section>
  );
}
