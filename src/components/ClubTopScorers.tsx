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

const MEDAL = ["bg-yellow-500", "bg-zinc-400", "bg-amber-700"];

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
  const range = data && data.firstSeason && data.lastSeason ? seasonsLabel(data.firstSeason, data.lastSeason) : "";

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
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
        <div className="flex flex-col items-center gap-2 px-4 pb-10 pt-6 text-center">
          <span className="text-3xl" aria-hidden>
            ⚽
          </span>
          <p className="text-sm text-muted-foreground">{cfg.empty}</p>
        </div>
      ) : (
        <ul className="space-y-1.5 px-3 pb-3 sm:px-4 sm:pb-4">
          {ranked.map((r, i) => {
            const top = r.rank <= 3;
            return (
              <li
                key={`${r.name}-${i}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 sm:gap-4 sm:px-4 ${
                  top ? "bg-primary/10" : "bg-surface/60"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                    top ? `${MEDAL[r.rank - 1]} text-white` : "bg-muted text-muted-foreground"
                  }`}
                >
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
                  <span className={`text-2xl font-bold tabular-nums ${top ? "text-primary" : ""}`}>{r.goals}</span>
                  <span className="ml-1 text-xs uppercase text-muted-foreground">gol.</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-4 pb-3 text-xs text-muted-foreground">{cfg.note}</p>
    </section>
  );
}
