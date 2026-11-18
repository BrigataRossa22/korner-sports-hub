import { Fragment, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { displayClub, normClub, sameClub } from "@/lib/club-match";
import { getPlayerGoals, type PlayerGoal } from "@/lib/playergoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/igrac/$name")({
  head: ({ params }) => ({
    meta: [{ title: `${params.name} — golovi — Korner BiH` }],
  }),
  errorComponent: LoadError,
  component: Igrac,
});

// Isti klub pod više naziva ("HŠK Zrinjski", "Zrinjski Mostar") ispiši jednom, potpunijim imenom
function mergeTeams(teams: Iterable<string>): string {
  const groups: string[][] = [];
  for (const t of teams) {
    const g = groups.find((x) => x.some((y) => sameClub(y, t)));
    if (g) g.push(t);
    else groups.push([t]);
  }
  return groups
    .map((g) => {
      const best = [...g].sort(
        (a, b) => normClub(b).length - normClub(a).length || a.length - b.length,
      )[0]!;
      return displayClub(best);
    })
    .join(", ");
}

function Igrac() {
  const { name } = Route.useParams();
  const crestFor = useClubCrest();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const { data, isLoading } = useQuery({
    queryKey: ["player-goals-v2", name],
    queryFn: () => getPlayerGoals({ data: { name } }),
    staleTime: 60 * 60 * 1000,
  });

  const goals = data ?? [];

  // Golovi po sezonama (najnovija sezona prva), a unutar sezone redom kako su postignuti
  const bySeason = new Map<string, { goals: PlayerGoal[]; teams: Set<string> }>();
  for (const g of goals) {
    const e = bySeason.get(g.season) ?? { goals: [], teams: new Set<string>() };
    e.goals.push(g);
    if (g.team) e.teams.add(g.team);
    bySeason.set(g.season, e);
  }
  const seasonRows = [...bySeason.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const toggle = (season: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(season)) next.delete(season);
      else next.add(season);
      return next;
    });

  // Grbovi klubova za koje je postigao gol
  const teams = [...new Set(goals.map((g) => g.team).filter(Boolean))];
  const seen = new Set<string>();
  const crests: { src: string; name: string }[] = [];
  for (const t of teams) {
    const src = crestFor(t);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    crests.push({ src, name: displayClub(t) });
  }

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
          <section className="mb-8 rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="font-display text-3xl font-bold">{goals.length}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Golova</p>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
              Golovi po sezonama
            </h2>
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left">Sezona</th>
                  <th className="px-2 py-2 text-left">Klub</th>
                  <th className="w-24 px-3 py-2 text-right">Golova</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {seasonRows.map(([season, e]) => {
                  const isOpen = open.has(season);
                  return (
                    <Fragment key={season}>
                      <tr
                        onClick={() => toggle(season)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            toggle(season);
                          }
                        }}
                        tabIndex={0}
                        aria-expanded={isOpen}
                        title="Prikaži golove iz ove sezone"
                        className={`cursor-pointer border-b border-border/70 hover:bg-muted/40 ${
                          isOpen ? "bg-muted" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-primary">{season}</td>
                        <td className="px-2 py-2.5 text-muted-foreground">{mergeTeams(e.teams)}</td>
                        <td className="px-3 py-2.5 text-right text-base font-bold">{e.goals.length}</td>
                        <td className="px-2 py-2.5">
                          <ChevronDown
                            className={`size-4 text-muted-foreground transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-b border-border/70 bg-muted">
                          <td colSpan={4} className="px-3 pb-3 pt-1">
                            <ul className="divide-y divide-border/60 text-sm">
                              {e.goals.map((g, i) => {
                                const homeScored = g.team && g.team === g.home;
                                const awayScored = g.team && g.team === g.away;
                                return (
                                  <li
                                    key={i}
                                    className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 py-2"
                                  >
                                    <span className="text-xs text-muted-foreground">
                                      {g.round != null ? `${g.round}. k.` : "—"}
                                    </span>
                                    <span className="min-w-0">
                                      <span className={homeScored ? "font-semibold" : ""}>{g.home}</span>
                                      <span className="text-muted-foreground"> – </span>
                                      <span className={awayScored ? "font-semibold" : ""}>{g.away}</span>
                                    </span>
                                    <span className="whitespace-nowrap text-right">
                                      {g.minute != null ? `${g.minute}${g.extra ? `+${g.extra}` : ""}'` : "—"}
                                      {g.penalty && (
                                        <span className="ml-1 text-xs text-muted-foreground">(pen.)</span>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                  <td className="px-3 py-2 uppercase" colSpan={2}>
                    Ukupno
                  </td>
                  <td className="px-3 py-2 text-right">{goals.length}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Klikni na sezonu da vidiš sve golove iz nje. Podebljan je klub koji je dao gol.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
