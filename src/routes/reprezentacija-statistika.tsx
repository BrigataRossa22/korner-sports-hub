import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalGoals, type NationalGoal } from "@/lib/nationalgoals.functions";

export const Route = createFileRoute("/reprezentacija-statistika")({
  head: () => ({
    meta: [
      { title: "Statistika reprezentacije — najbolji strijelci — Korner BiH" },
      {
        name: "description",
        content: "Najbolji strijelci A reprezentacije Bosne i Hercegovine od 1995. godine do danas.",
      },
    ],
  }),
  component: StatistikaReprezentacije,
});

const ALL = "sve";

type Scorer = {
  player: string;
  goals: number;
  pens: number;
  matches: number;
  first: string;
  last: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function buildScorers(goals: NationalGoal[]): Scorer[] {
  const map = new Map<string, { goals: number; pens: number; dates: Set<string>; years: string[] }>();
  for (const g of goals) {
    if (g.team !== "B" || g.kind === "o") continue;
    const cur = map.get(g.player) ?? { goals: 0, pens: 0, dates: new Set<string>(), years: [] };
    cur.goals++;
    if (g.kind === "p") cur.pens++;
    cur.dates.add(g.match_date.slice(0, 10));
    cur.years.push(g.match_date.slice(0, 4));
    map.set(g.player, cur);
  }
  return [...map.entries()]
    .map(([player, v]) => {
      const years = v.years.slice().sort();
      return {
        player,
        goals: v.goals,
        pens: v.pens,
        matches: v.dates.size,
        first: years[0],
        last: years[years.length - 1],
      };
    })
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        a.matches - b.matches ||
        a.player.localeCompare(b.player, "hr"),
    );
}

const PODIUM = [
  { ring: "border-amber-400/70", badge: "bg-amber-400 text-black", label: "1" },
  { ring: "border-slate-300/70", badge: "bg-slate-300 text-black", label: "2" },
  { ring: "border-orange-400/60", badge: "bg-orange-400 text-black", label: "3" },
];

function StatistikaReprezentacije() {
  const { data: goalData, isLoading } = useQuery({
    queryKey: ["national-goals"],
    queryFn: () => getNationalGoals(),
  });

  const goals = goalData ?? [];

  const [pick, setPick] = useState(ALL);
  const [showAll, setShowAll] = useState(false);

  const years = useMemo(
    () =>
      [...new Set(goals.map((g) => g.match_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [goals],
  );
  const year = pick === ALL || years.includes(pick) ? pick : ALL;

  const filtered = useMemo(
    () => (year === ALL ? goals : goals.filter((g) => g.match_date.startsWith(year))),
    [goals, year],
  );
  const scorers = useMemo(() => buildScorers(filtered), [filtered]);

  const totalGoals = filtered.filter((g) => g.team === "B").length;
  const ownGoals = filtered.filter((g) => g.team === "B" && g.kind === "o").length;
  const penGoals = filtered.filter((g) => g.team === "B" && g.kind === "p").length;

  const multi = useMemo(() => {
    const map = new Map<string, { player: string; date: string; n: number }>();
    for (const g of filtered) {
      if (g.team !== "B" || g.kind === "o") continue;
      const k = `${g.match_date.slice(0, 10)}|${g.player}`;
      const cur = map.get(k) ?? { player: g.player, date: g.match_date.slice(0, 10), n: 0 };
      cur.n++;
      map.set(k, cur);
    }
    return [...map.values()]
      .filter((x) => x.n >= 3)
      .sort((a, b) => b.n - a.n || b.date.localeCompare(a.date));
  }, [filtered]);

  const perYear = useMemo(() => {
    const byYear = new Map<string, NationalGoal[]>();
    for (const g of goals) {
      const y = g.match_date.slice(0, 4);
      const arr = byYear.get(y) ?? [];
      arr.push(g);
      byYear.set(y, arr);
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([y, arr]) => {
        const top = buildScorers(arr)[0];
        return {
          year: y,
          goals: arr.filter((g) => g.team === "B").length,
          top: top ? `${top.player} (${top.goals})` : "—",
        };
      });
  }, [goals]);

  const max = scorers[0]?.goals ?? 1;
  const podium = scorers.slice(0, 3);
  const rest = showAll ? scorers : scorers.slice(0, 25);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reprezentacija</p>
      <h1 className="font-display text-3xl font-bold uppercase">Najbolji strijelci</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Strijelci A reprezentacije Bosne i Hercegovine od 1995. godine. Autogolovi protivnika ulaze u
        zbir golova tima, ali ne i igračima.
      </p>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={4} />
        </div>
      ) : goals.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-muted-foreground">
          Još nema podataka.
        </p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-end gap-2">
            <label htmlFor="godina-stat" className="text-xs font-semibold uppercase text-muted-foreground">
              Razdoblje
            </label>
            <select
              id="godina-stat"
              value={year}
              onChange={(e) => {
                setPick(e.target.value);
                setShowAll(false);
              }}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
            >
              <option value={ALL}>Svih vremena</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Golova tima", totalGoals],
              ["Strijelaca", scorers.length],
              ["Penala", penGoals],
              ["Autogolova", ownGoals],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="rounded-xl border border-border bg-card px-4 py-4 text-center"
              >
                <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {podium.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {podium.map((s, i) => (
                <div
                  key={s.player}
                  className={`relative overflow-hidden rounded-xl border-2 bg-card px-5 py-5 ${PODIUM[i].ring}`}
                >
                  <span
                    className={`absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-sm font-bold ${PODIUM[i].badge}`}
                  >
                    {PODIUM[i].label}
                  </span>
                  <p className="pr-8 font-display text-lg font-bold uppercase leading-tight">
                    {s.player}
                  </p>
                  <p className="mt-3 text-4xl font-bold tabular-nums text-primary">{s.goals}</p>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {s.goals === 1 ? "gol" : "golova"}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {s.matches} utakmica s golom
                    {s.pens > 0 ? ` · ${s.pens} pen.` : ""}
                    <br />
                    {s.first === s.last ? s.first : `${s.first}–${s.last}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
              {year === ALL ? "Svi strijelci" : `Strijelci ${year}.`}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="w-10 px-4 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Igrač</th>
                    <th className="px-3 py-2 text-left">Golovi</th>
                    <th className="px-3 py-2 text-right">Pen.</th>
                    <th className="px-3 py-2 text-right">Utak.</th>
                    <th className="px-4 py-2 text-right">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((s, i) => (
                    <tr key={s.player} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{s.player}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-40">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(4, (s.goals / max) * 100)}%` }}
                            />
                          </div>
                          <span className="font-bold">{s.goals}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{s.pens || "—"}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{s.matches}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {s.first === s.last ? s.first : `${s.first}–${s.last}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {scorers.length > 25 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full border-t border-border px-4 py-3 text-xs font-semibold uppercase text-primary hover:bg-muted/40"
              >
                {showAll ? "Prikaži prvih 25" : `Prikaži sve (${scorers.length})`}
              </button>
            )}
          </section>

          {multi.length > 0 && (
            <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
                Tri i više golova u utakmici
              </h2>
              <ul>
                {multi.map((x) => (
                  <li
                    key={`${x.date}${x.player}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3 text-sm last:border-0"
                  >
                    <span className="font-medium">{x.player}</span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="text-muted-foreground">{fmtDate(x.date)}</span>
                      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {x.n} gola
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {year === ALL && (
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
                Najbolji strijelac po godinama
              </h2>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[420px] border-collapse text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2 text-left">Godina</th>
                      <th className="px-3 py-2 text-right">Golova tima</th>
                      <th className="px-4 py-2 text-left">Najbolji strijelac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perYear.map((r) => (
                      <tr
                        key={r.year}
                        onClick={() => setPick(r.year)}
                        className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-2">{r.year}</td>
                        <td className="px-3 py-2 text-right">{r.goals}</td>
                        <td className="px-4 py-2">{r.top}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
