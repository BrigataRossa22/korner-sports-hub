import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getPlayerGoals } from "@/lib/playergoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/igrac/$name")({
  head: ({ params }) => ({
    meta: [{ title: `${params.name} — golovi — Korner BiH` }],
  }),
  errorComponent: LoadError,
  component: Igrac,
});

function Igrac() {
  const { name } = Route.useParams();
  const crestFor = useClubCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["player-goals-v2", name],
    queryFn: () => getPlayerGoals({ data: { name } }),
    staleTime: 60 * 60 * 1000,
  });

  const goals = data ?? [];
  const seasons = [...new Set(goals.map((g) => g.season))].filter(Boolean);

  // Golovi po sezonama (najnovija sezona prva)
  const bySeason = new Map<string, { goals: number; teams: Set<string> }>();
  for (const g of goals) {
    const e = bySeason.get(g.season) ?? { goals: 0, teams: new Set<string>() };
    e.goals += 1;
    if (g.team) e.teams.add(g.team);
    bySeason.set(g.season, e);
  }
  const seasonRows = [...bySeason.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  // Grbovi klubova za koje je postigao gol
  const teams = [...new Set(goals.map((g) => g.team).filter(Boolean))];
  const seen = new Set<string>();
  const crests: { src: string; name: string }[] = [];
  for (const t of teams) {
    const src = crestFor(t);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    crests.push({ src, name: t });
  }

  const newestFirst = [...goals].reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Link to="/brojke" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na Brojke
      </Link>

      <div className="rule-top mb-5 mt-3 pt-3">
        <p className="kicker">Igrač · ligaški golovi</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl uppercase sm:text-4xl">{name}</h1>
          {crests.map((c) => (
            <img key={c.src} src={c.src} alt={c.name} title={c.name} className="size-8 shrink-0 object-contain" />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={4} />
        </div>
      ) : goals.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Nema podataka o golovima.</p>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-2 gap-3">
            {[
              { label: "Golova", value: goals.length },
              { label: "Sezona", value: seasons.length },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                <p className="font-display text-3xl font-bold">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </section>

          <section className="mb-8 overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
              Golovi po sezonama
            </h2>
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left">Sezona</th>
                  <th className="px-2 py-2 text-left">Klub</th>
                  <th className="w-24 px-3 py-2 text-right">Golova</th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map(([season, e]) => (
                  <tr key={season} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">{season}</td>
                    <td className="px-2 py-2 text-muted-foreground">{[...e.teams].join(", ")}</td>
                    <td className="px-3 py-2 text-right text-base font-bold">{e.goals}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                  <td className="px-3 py-2 uppercase" colSpan={2}>
                    Ukupno
                  </td>
                  <td className="px-3 py-2 text-right">{goals.length}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
              Svi golovi
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 text-left">Sezona</th>
                    <th className="px-2 py-2 text-center">Kolo</th>
                    <th className="px-2 py-2 text-left">Utakmica</th>
                    <th className="px-3 py-2 text-right">Minut</th>
                  </tr>
                </thead>
                <tbody>
                  {newestFirst.map((g, i) => {
                    const homeScored = g.team && g.team === g.home;
                    const awayScored = g.team && g.team === g.away;
                    return (
                      <tr key={i} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                        <td className="whitespace-nowrap px-3 py-2">{g.season}</td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{g.round ?? "—"}</td>
                        <td className="px-2 py-2">
                          <span className={homeScored ? "font-semibold" : ""}>{g.home}</span>
                          <span className="text-muted-foreground"> – </span>
                          <span className={awayScored ? "font-semibold" : ""}>{g.away}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          {g.minute != null ? `${g.minute}${g.extra ? `+${g.extra}` : ""}'` : "—"}
                          {g.penalty && <span className="ml-1 text-xs text-muted-foreground">(p)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Najnoviji golovi su prvi. Podebljan je klub koji je dao gol, a (p) označava gol iz penala.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
