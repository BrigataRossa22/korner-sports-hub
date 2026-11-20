import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubTopScorers, type ScorerComp } from "@/lib/clubscorers.functions";
import { Gate } from "@/components/MemberBlur";

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

export function ClubTopScorers({ name }: { name: string }) {
  const [comp, setComp] = useState<ScorerComp>("liga");
  const cfg = COMPS.find((c) => c.id === comp) ?? COMPS[0];

  const { data, isLoading } = useQuery({
    queryKey: ["club-top-scorers", name, comp],
    queryFn: () => getClubTopScorers({ data: { name, comp } }),
    staleTime: 60 * 60 * 1000,
  });

  const ranked = withRank(data?.scorers ?? []);

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <h2 className="font-display text-lg font-bold uppercase">Top 10 strijelaca</h2>
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
            <li key={`${r.name}-${i}`} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 shrink-0 text-center font-bold tabular-nums">{r.rank}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">
                <Gate fake="Ime Prezime">{r.name}</Gate>
              </span>
              <span className="shrink-0 text-xl font-bold tabular-nums">
                <Gate fake="99">{r.goals}</Gate>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{cfg.note}</p>
    </section>
  );
}
