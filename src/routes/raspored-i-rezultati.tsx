import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { LoadError } from "@/components/RouteFallbacks";
import { sameClub } from "@/lib/club-match";
import { getLeagueMatches, type LeagueMatch } from "@/lib/leaguematches.functions";
import { getMatchGoals, type MatchGoal } from "@/lib/matchgoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/raspored-i-rezultati")({
  head: () => ({
    meta: [{ title: "Raspored i rezultati — Korner BiH" }],
  }),
  errorComponent: LoadError,
  component: Raspored,
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function minuteOf(g: MatchGoal): string {
  return `${g.minute}${g.extra > 0 ? `+${g.extra}` : ""}'`;
}

function tagOf(g: MatchGoal): string {
  return g.kind === "penalty" ? " (pen.)" : g.kind === "own" ? " (autogol)" : "";
}

function Raspored() {
  const { data, isLoading } = useQuery({
    queryKey: ["league-matches"],
    queryFn: () => getLeagueMatches(),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["match-goals"],
    queryFn: () => getMatchGoals(),
  });
  const crestFor = useClubCrest();
  const [sel, setSel] = useState("all");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const rows = data ?? [];
  const goals = goalsData ?? [];

  const groups = new Map<number, LeagueMatch[]>();
  for (const m of rows) {
    const r = m.round ?? 0;
    groups.set(r, [...(groups.get(r) ?? []), m]);
  }
  const rounds = [...groups.keys()].sort((a, b) => a - b);
  const shown = sel === "all" ? rounds : rounds.filter((r) => String(r) === sel);

  const goalsOf = (m: LeagueMatch) =>
    m.round === null
      ? []
      : goals.filter(
          (g) => g.round === m.round && sameClub(g.home, m.home) && sameClub(g.away, m.away),
        );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const Crest = ({ club, size = "size-6" }: { club: string; size?: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className={`${size} shrink-0 object-contain`} />
    ) : (
      <span className={`${size} shrink-0`} />
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">WWiN liga</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Raspored i rezultati</h1>
      </div>

      {rounds.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="kolo" className="text-sm font-semibold uppercase text-muted-foreground">
            Kolo
          </label>
          <select
            id="kolo"
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"
          >
            <option value="all">Sva kola</option>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "Bez kola" : `${r}. kolo`}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : rounds.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Još nema utakmica.</p>
      ) : (
        shown.map((r) => (
          <section key={r} className="mb-8 rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
              {r === 0 ? "Bez kola" : `${r}. kolo`}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm tabular-nums">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left">Datum</th>
                    <th className="px-4 py-2 text-center">Utakmica</th>
                    <th className="px-4 py-2 text-right">Gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.get(r)!.map((m) => {
                    const mg = goalsOf(m);
                    const hasResult = m.score_home !== null && m.score_away !== null;
                    const canOpen = hasResult || mg.length > 0;
                    const isOpen = open.has(m.id);
                    const homeGoals = mg.filter((g) => sameClub(g.team, m.home));
                    const awayGoals = mg.filter((g) => !sameClub(g.team, m.home));

                    const rowStyle = isOpen
                      ? "bg-primary text-primary-foreground"
                      : canOpen
                        ? "hover:bg-muted/40"
                        : "";

                    return (
                      <Fragment key={m.id}>
                        <tr
                          className={`border-t border-border ${canOpen ? "cursor-pointer" : ""} ${rowStyle}`}
                          onClick={canOpen ? () => toggle(m.id) : undefined}
                          onKeyDown={
                            canOpen
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle(m.id);
                                  }
                                }
                              : undefined
                          }
                          tabIndex={canOpen ? 0 : undefined}
                          aria-expanded={canOpen ? isOpen : undefined}
                        >
                          <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex flex-1 items-center justify-end gap-2 text-right font-medium">
                                {m.home}
                                <Crest club={m.home} />
                              </span>
                              <span className="min-w-14 text-center font-bold">
                                {hasResult ? `${m.score_home}:${m.score_away}` : "–"}
                              </span>
                              <span className="flex flex-1 items-center gap-2 font-medium">
                                <Crest club={m.away} />
                                {m.away}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center justify-end gap-2">
                              {m.attendance > 0 ? m.attendance.toLocaleString("de-DE") : "—"}
                              {canOpen && (
                                <ChevronDown
                                  className={`size-4 transition-transform ${
                                    isOpen ? "rotate-180 text-primary-foreground" : "text-muted-foreground"
                                  }`}
                                />
                              )}
                            </span>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <div className="bg-card px-4 py-4 text-foreground">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase">
                                      <Crest club={m.home} size="size-7" />
                                      {m.home}
                                    </div>
                                    <ul className="space-y-1 text-sm">
                                      {homeGoals.map((g) => (
                                        <li key={g.id}>
                                          <span className="font-semibold">{minuteOf(g)}</span>{" "}
                                          <span className="font-semibold">{g.player}</span>
                                          {g.assist && g.kind !== "own" && (
                                            <span className="text-muted-foreground"> ({g.assist})</span>
                                          )}
                                          <span className="text-muted-foreground">{tagOf(g)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="text-right">
                                    <div className="mb-2 flex items-center justify-end gap-2 font-display text-sm font-bold uppercase">
                                      {m.away}
                                      <Crest club={m.away} size="size-7" />
                                    </div>
                                    <ul className="space-y-1 text-sm">
                                      {awayGoals.map((g) => (
                                        <li key={g.id}>
                                          <span className="font-semibold">{g.player}</span>
                                          {g.assist && g.kind !== "own" && (
                                            <span className="text-muted-foreground"> ({g.assist})</span>
                                          )}
                                          <span className="text-muted-foreground">{tagOf(g)}</span>{" "}
                                          <span className="font-semibold">{minuteOf(g)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                {mg.length === 0 && (
                                  <p className="mt-2 text-center text-sm text-muted-foreground">
                                    Strijelci još nisu uneseni.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
