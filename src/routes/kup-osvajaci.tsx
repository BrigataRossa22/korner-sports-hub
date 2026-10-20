import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { sameClub } from "@/lib/club-match";
import { getCupGoals, type CupGoal } from "@/lib/cupgoals.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/kup-osvajaci")({
  head: () => ({
    meta: [{ title: "Osvajači Kupa BiH — Korner BiH" }],
  }),
  component: Osvajaci,
});

const FINAL_ROUNDS = ["Finale", "Superfinale"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}.`;
}

function minuteOf(g: CupGoal): string {
  return `${g.minute}${g.extra > 0 ? `+${g.extra}` : ""}'`;
}

function tagOf(g: CupGoal): string {
  return g.kind === "p" ? " (pen.)" : g.kind === "o" ? " (autogol)" : "";
}

/** Pobjednik dvomeča ili jednomeča: ukupan rezultat, pa penali, pa gostujući golovi. */
function decide(legs: CupMatch[]): string | null {
  const names: string[] = [];
  for (const m of legs) {
    for (const n of [m.home, m.away]) {
      if (!names.some((x) => sameClub(x, n))) names.push(n);
    }
  }
  if (names.length !== 2) return null;
  const [a, b] = names as [string, string];
  let ga = 0,
    gb = 0,
    pa = 0,
    pb = 0,
    awayA = 0,
    awayB = 0;
  for (const m of legs) {
    if (m.score_home === null || m.score_away === null) return null;
    const aHome = sameClub(m.home, a);
    const sa = aHome ? m.score_home : m.score_away;
    const sb = aHome ? m.score_away : m.score_home;
    ga += sa;
    gb += sb;
    if (aHome) awayB += sb;
    else awayA += sa;
    if (m.pen_home != null && m.pen_away != null) {
      pa += aHome ? m.pen_home : m.pen_away;
      pb += aHome ? m.pen_away : m.pen_home;
    }
  }
  if (ga !== gb) return ga > gb ? a : b;
  if (pa !== pb) return pa > pb ? a : b;
  if (legs.length === 2 && awayA !== awayB) return awayA > awayB ? a : b;
  return null;
}

type Stage = { round: string; title: string; legs: CupMatch[] };
type SeasonFinal = { season: string; stages: Stage[]; winner: string | null };

function Osvajaci() {
  const crestFor = useClubCrest();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["cup-goals"],
    queryFn: () => getCupGoals(),
  });
  const goals = goalsData ?? [];

  const finals: SeasonFinal[] = useMemo(() => {
    const bySeason = new Map<string, CupMatch[]>();
    for (const m of matches ?? []) {
      if (!FINAL_ROUNDS.includes(m.round)) continue;
      bySeason.set(m.season, [...(bySeason.get(m.season) ?? []), m]);
    }
    const out: SeasonFinal[] = [];
    for (const [season, ms] of bySeason) {
      const stages: Stage[] = [];
      for (const round of FINAL_ROUNDS) {
        const legs = ms
          .filter((m) => m.round === round)
          .sort((x, y) => x.match_date.localeCompare(y.match_date));
        if (legs.length)
          stages.push({ round, title: round === "Superfinale" ? "Superfinale" : "Finale", legs });
      }
      const last = stages[stages.length - 1];
      out.push({ season, stages, winner: last ? decide(last.legs) : null });
    }
    return out.sort((a, b) => b.season.localeCompare(a.season));
  }, [matches]);

  const titles = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of finals) {
      if (!f.winner) continue;
      const key = [...map.keys()].find((k) => sameClub(k, f.winner!)) ?? f.winner;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "bs"));
  }, [finals]);

  const goalsOf = (m: CupMatch) =>
    goals
      .filter(
        (g) =>
          g.season === m.season &&
          g.round === m.round &&
          sameClub(g.home, m.home) &&
          sameClub(g.away, m.away),
      )
      .sort((x, y) => x.minute - y.minute || x.extra - y.extra);

  const crestOf = (name: string, fallback?: string) => crestFor(name) || fallback || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Kup BiH</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Osvajači</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sva finala Kupa BiH, od najnovijeg prema najstarijem.</p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={6} cols={3} />
        </div>
      ) : finals.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Još nema unesenih finala.</p>
      ) : (
        <>
          {titles.length > 0 && (
            <section className="mb-8 rounded-lg border border-border bg-card">
              <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
                Broj osvojenih kupova
              </h2>
              <div className="flex flex-wrap gap-3 p-4">
                {titles.map(([club, n]) => (
                  <div key={club} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                    {crestOf(club) ? (
                      <img src={crestOf(club)} alt="" className="size-6 object-contain" />
                    ) : (
                      <span className="size-6" />
                    )}
                    <span className="text-sm font-semibold">{club}</span>
                    <span className="font-display text-lg font-bold text-primary">{n}×</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-6">
            {finals.map((f) => (
              <section key={f.season} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
                  <h2 className="font-display text-lg font-bold uppercase">Kup BiH {f.season}</h2>
                  {f.winner && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Osvajač</span>
                      {crestOf(f.winner) && (
                        <img src={crestOf(f.winner)} alt="" className="size-7 object-contain" />
                      )}
                      <span className="font-display text-base font-bold uppercase text-primary">{f.winner}</span>
                    </div>
                  )}
                </div>

                {f.stages.map((st) => (
                  <div key={st.round}>
                    {f.stages.length > 1 && (
                      <p className="border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                        {st.title}
                      </p>
                    )}
                    {st.legs.map((m, i) => {
                      const mg = goalsOf(m);
                      const hasPen = m.pen_home != null && m.pen_away != null;
                      const second = st.legs.length === 2 && i === 1;
                      let agg: string | null = null;
                      if (second) {
                        const first = st.legs[0]!;
                        if (
                          first.score_home !== null &&
                          first.score_away !== null &&
                          m.score_home !== null &&
                          m.score_away !== null
                        ) {
                          const h = m.score_home + (sameClub(first.home, m.home) ? first.score_home : first.score_away);
                          const a = m.score_away + (sameClub(first.home, m.home) ? first.score_away : first.score_home);
                          agg = `${h}:${a}`;
                        }
                      }
                      const homeGoals = mg.filter((g) => g.side === "H");
                      const awayGoals = mg.filter((g) => g.side === "A");
                      return (
                        <div key={m.id} className="border-b border-border/70 px-4 py-4 last:border-0">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold">
                              {fmtDate(m.match_date)}
                              {st.legs.length === 2 ? ` · ${i + 1}. meč` : ""}
                            </span>
                            <span>
                              Gledalaca:{" "}
                              <span className="font-semibold text-foreground">
                                {m.attendance > 0
                                  ? m.attendance.toLocaleString("de-DE")
                                  : m.attendance < 0
                                    ? "x"
                                    : "—"}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="flex flex-1 items-center justify-end gap-2 text-right font-semibold">
                              {m.home}
                              {crestOf(m.home, m.home_crest) ? (
                                <img src={crestOf(m.home, m.home_crest)} alt="" className="size-7 shrink-0 object-contain" />
                              ) : (
                                <span className="size-7 shrink-0" />
                              )}
                            </span>
                            <span className="flex min-w-16 flex-col items-center">
                              <span className="font-display text-2xl font-bold tabular-nums">
                                {m.score_home !== null && m.score_away !== null
                                  ? `${m.score_home}:${m.score_away}`
                                  : "–"}
                              </span>
                              {hasPen && (
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                  pen. {m.pen_home}:{m.pen_away}
                                </span>
                              )}
                              {agg && (
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                  ukupno {agg}
                                </span>
                              )}
                            </span>
                            <span className="flex flex-1 items-center gap-2 font-semibold">
                              {crestOf(m.away, m.away_crest) ? (
                                <img src={crestOf(m.away, m.away_crest)} alt="" className="size-7 shrink-0 object-contain" />
                              ) : (
                                <span className="size-7 shrink-0" />
                              )}
                              {m.away}
                            </span>
                          </div>

                          {mg.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-6 text-xs">
                              <ul className="space-y-1 text-right">
                                {homeGoals.map((g) => (
                                  <li key={g.id}>
                                    <span className="font-semibold">{g.player}</span>
                                    <span className="text-muted-foreground">
                                      {tagOf(g)} {minuteOf(g)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <ul className="space-y-1 text-left">
                                {awayGoals.map((g) => (
                                  <li key={g.id}>
                                    <span className="font-semibold">{g.player}</span>
                                    <span className="text-muted-foreground">
                                      {tagOf(g)} {minuteOf(g)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
