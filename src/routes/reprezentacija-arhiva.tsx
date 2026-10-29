import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalMatches, type NationalMatch } from "@/lib/nationalmatches.functions";
import { getNationalGoals, type NationalGoal } from "@/lib/nationalgoals.functions";

export const Route = createFileRoute("/reprezentacija-arhiva")({
  head: () => ({
    meta: [
      { title: "Arhiva utakmica reprezentacije — Korner BiH" },
      { name: "description", content: "Sve utakmice reprezentacije Bosne i Hercegovine od 1995. godine." },
    ],
  }),
  component: ArhivaReprezentacije,
});

const ALL = "sve";

const BALL_URL =
  "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/lopta.webp";

const isBih = (name: string) => /bosna|bih/i.test(name);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function flagSrc(flag: string): string {
  if (!flag) return "";
  return flag.startsWith("http") ? flag : `https://flagcdn.com/w40/${flag.toLowerCase()}.png`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function Team({ name, flag, align }: { name: string; flag: string; align: "left" | "right" }) {
  const src = flagSrc(flag);
  const img = src ? <img src={src} alt="" className="h-4 w-6 shrink-0 object-cover" /> : null;
  return (
    <span
      className={`flex flex-1 items-center gap-2 font-medium ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "right" ? (
        <>
          {name}
          {img}
        </>
      ) : (
        <>
          {img}
          {name}
        </>
      )}
    </span>
  );
}

// Zastava za mobitel; ako je nema, krug s inicijalima
function MobileFlag({ name, flag }: { name: string; flag: string }) {
  const src = flagSrc(flag);
  return src ? (
    <img src={src} alt="" className="h-5 w-8 shrink-0 rounded-[2px] object-cover" />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
      {initials(name)}
    </span>
  );
}

type Stat = { played: number; w: number; d: number; l: number; gf: number; ga: number };

function emptyStat(): Stat {
  return { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
}

function minuteKey(m: string): number {
  const [a, b] = m.split("+");
  return Number(a) + (b ? Number(b) / 100 : 0);
}

// "Džeko 17', 53'" + oznake (p) penal, (ag) autogol
function formatScorers(goals: NationalGoal[]): string {
  const sorted = goals.slice().sort((x, y) => minuteKey(x.minute) - minuteKey(y.minute));
  const order: string[] = [];
  const byPlayer = new Map<string, string[]>();
  for (const g of sorted) {
    const mark = g.kind === "p" ? " (p)" : g.kind === "o" ? " (ag)" : "";
    const min = `${g.minute}'${mark}`;
    if (!byPlayer.has(g.player)) {
      byPlayer.set(g.player, []);
      order.push(g.player);
    }
    byPlayer.get(g.player)!.push(min);
  }
  return order.map((p) => `${p} ${byPlayer.get(p)!.join(", ")}`).join(" · ");
}

function addMatch(s: Stat, m: NationalMatch) {
  if (m.score_home === null || m.score_away === null) return;
  const bihHome = isBih(m.home);
  const a = bihHome ? m.score_home : m.score_away;
  const b = bihHome ? m.score_away : m.score_home;
  s.played++;
  s.gf += a;
  s.ga += b;
  if (a > b) s.w++;
  else if (a === b) s.d++;
  else s.l++;
}

// Boja rezultata iz ugla BiH
function pillClass(m: NationalMatch): string {
  if (m.score_home === null || m.score_away === null) return "bg-muted text-foreground";
  const bihHome = isBih(m.home);
  const a = bihHome ? m.score_home : m.score_away;
  const b = bihHome ? m.score_away : m.score_home;
  if (a > b) return "bg-primary/15 text-primary";
  if (a < b) return "bg-destructive/15 text-destructive";
  return "bg-muted text-foreground";
}

function goalTag(g: NationalGoal): string {
  return g.kind === "p" ? " (pen.)" : g.kind === "o" ? " (autogol)" : "";
}

function ArhivaReprezentacije() {
  const { data, isLoading } = useQuery({
    queryKey: ["national-matches"],
    queryFn: () => getNationalMatches(),
  });
  const rows = data ?? [];

  const { data: goalData } = useQuery({
    queryKey: ["national-goals"],
    queryFn: () => getNationalGoals(),
  });
  const goalsByDate = useMemo(() => {
    const map = new Map<string, NationalGoal[]>();
    for (const g of goalData ?? []) {
      const k = g.match_date.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(g);
      map.set(k, arr);
    }
    return map;
  }, [goalData]);

  const [pick, setPick] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const years = useMemo(
    () => [...new Set(rows.map((m) => m.match_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [rows],
  );

  const perYear = useMemo(() => {
    const map = new Map<string, Stat>();
    for (const m of rows) {
      const y = m.match_date.slice(0, 4);
      const s = map.get(y) ?? emptyStat();
      addMatch(s, m);
      map.set(y, s);
    }
    return map;
  }, [rows]);

  const total = useMemo(() => {
    const s = emptyStat();
    for (const m of rows) addMatch(s, m);
    return s;
  }, [rows]);

  const year = pick === ALL || years.includes(pick) ? pick : years[0] || "";
  const list = (year === ALL ? rows : rows.filter((m) => m.match_date.startsWith(year))).slice();
  // Sve godine: najnovije prvo. Jedna godina: po datumu od početka godine.
  if (year === ALL) list.sort((a, b) => b.match_date.localeCompare(a.match_date));
  else list.sort((a, b) => a.match_date.localeCompare(b.match_date));

  const yearStat = useMemo(() => {
    const s = emptyStat();
    for (const m of list) addMatch(s, m);
    return s;
  }, [list]);

  const attText = (n: number): string =>
    n > 0 ? n.toLocaleString("de-DE") : n < 0 ? "x" : "—";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reprezentacija</p>
      <h1 className="font-display text-3xl font-bold uppercase">Arhiva utakmica</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Sve utakmice A reprezentacije Bosne i Hercegovine, od 1995. godine do danas.
      </p>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={3} />
        </div>
      ) : rows.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-muted-foreground">Još nema podataka.</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Utakmica", total.played],
              ["Pobjeda", total.w],
              ["Neriješeno", total.d],
              ["Poraza", total.l],
              ["Golovi", `${total.gf}:${total.ga}`],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
              Pregled po godinama
            </h2>
            <div className="max-h-72 overflow-auto">
              <table className="w-full border-collapse text-sm tabular-nums sm:min-w-[480px]">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 text-left sm:px-4">Godina</th>
                    <th className="px-2 py-2 text-right sm:px-3">Ut.</th>
                    <th className="px-2 py-2 text-right sm:px-3">P</th>
                    <th className="px-2 py-2 text-right sm:px-3">N</th>
                    <th className="px-2 py-2 text-right sm:px-3">I</th>
                    <th className="px-3 py-2 text-right">Golovi</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const s = perYear.get(y) ?? emptyStat();
                    return (
                      <tr
                        key={y}
                        onClick={() => setPick(y)}
                        className={`cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/40 ${
                          year === y ? "bg-primary/10 font-semibold" : ""
                        }`}
                      >
                        <td className="px-3 py-2 sm:px-4">{y}</td>
                        <td className="px-2 py-2 text-right sm:px-3">{s.played}</td>
                        <td className="px-2 py-2 text-right sm:px-3">{s.w}</td>
                        <td className="px-2 py-2 text-right sm:px-3">{s.d}</td>
                        <td className="px-2 py-2 text-right sm:px-3">{s.l}</td>
                        <td className="px-3 py-2 text-right">
                          {s.gf}:{s.ga}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-display text-lg font-bold uppercase">
                {year === ALL ? "Sve utakmice" : `Utakmice ${year}.`}
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="godina-arhiva" className="text-xs font-semibold uppercase text-muted-foreground">
                  Godina
                </label>
                <select
                  id="godina-arhiva"
                  value={year}
                  onChange={(e) => setPick(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
                >
                  <option value={ALL}>Sve godine</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ---- Mobitel: zastave, obojen rezultat, klik na strijelce ---- */}
            <div className="sm:hidden">
              <div className="grid grid-cols-[3.75rem_1fr_4rem] items-center gap-2 px-3 py-2 text-xs uppercase text-muted-foreground">
                <span>Datum</span>
                <span className="text-center">Utakmica</span>
                <span className="text-right">Gledalaca</span>
              </div>

              {list.map((m) => {
                const goals = (goalsByDate.get(m.match_date.slice(0, 10)) ?? [])
                  .slice()
                  .sort((x, y) => minuteKey(x.minute) - minuteKey(y.minute));
                const bihHome = isBih(m.home);
                const canOpen = goals.length > 0;
                const isOpen = canOpen && open.has(m.id);

                return (
                  <div key={m.id} className="border-t border-border">
                    <div
                      className={`grid grid-cols-[3.75rem_1fr_4rem] items-center gap-2 px-3 py-3 ${
                        canOpen ? "cursor-pointer" : ""
                      } ${isOpen ? "bg-muted" : ""}`}
                      role={canOpen ? "button" : undefined}
                      tabIndex={canOpen ? 0 : undefined}
                      aria-expanded={canOpen ? isOpen : undefined}
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
                    >
                      <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
                        {fmtDate(m.match_date)}
                      </span>

                      <div className="flex items-center justify-center gap-2">
                        <span className="flex flex-1 justify-end" title={m.home}>
                          <MobileFlag name={m.home} flag={m.home_flag} />
                        </span>
                        <span
                          className={`min-w-14 rounded-md px-2 py-1 text-center text-sm font-bold tabular-nums ${pillClass(m)}`}
                        >
                          {m.score_home !== null && m.score_away !== null
                            ? `${m.score_home}:${m.score_away}`
                            : "–"}
                        </span>
                        <span className="flex flex-1" title={m.away}>
                          <MobileFlag name={m.away} flag={m.away_flag} />
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1 text-sm tabular-nums">
                        <span>{attText(m.attendance)}</span>
                        <span className="inline-flex size-4 shrink-0 items-center justify-center">
                          {canOpen && (
                            <ChevronDown
                              className={`size-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="bg-muted px-3 pb-4 pt-1">
                        <p className="mb-3 text-center text-xs font-semibold text-muted-foreground">
                          {m.home} – {m.away}
                        </p>
                        <div className="relative">
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/30"
                          />
                          <ul className="space-y-2 text-xs">
                            {goals.map((g, i) => {
                              const isHome = g.team === (bihHome ? "B" : "O");
                              const minute = (
                                <span className="font-semibold tabular-nums">{g.minute}'</span>
                              );
                              const who = (
                                <span>
                                  <span className="font-semibold">{g.player}</span>
                                  <span className="text-muted-foreground">{goalTag(g)}</span>
                                </span>
                              );
                              return (
                                <li
                                  key={`${g.player}-${g.minute}-${i}`}
                                  className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                                >
                                  <div className="min-w-0 text-right">{isHome ? who : minute}</div>
                                  <span className="relative z-10 flex min-w-8 justify-center">
                                    <span className="rounded-full bg-muted p-0.5">
                                      <img src={BALL_URL} alt="" className="size-5 object-contain" />
                                    </span>
                                  </span>
                                  <div className="min-w-0 text-left">{isHome ? minute : who}</div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-3 text-[10px] uppercase text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-primary/15 ring-1 ring-primary/40" />
                  Pobjeda
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-muted ring-1 ring-border" />
                  Remi
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-destructive/15 ring-1 ring-destructive/40" />
                  Poraz
                </span>
              </div>
            </div>

            {/* ---- Računar: tabela kao do sada ---- */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-sm tabular-nums">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left">Datum</th>
                    <th className="px-4 py-2 text-center">Utakmica</th>
                    <th className="px-4 py-2 text-right">Gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const goals = goalsByDate.get(m.match_date.slice(0, 10)) ?? [];
                    const bihHome = isBih(m.home);
                    const homeGoals = goals.filter((g) => g.team === (bihHome ? "B" : "O"));
                    const awayGoals = goals.filter((g) => g.team === (bihHome ? "O" : "B"));
                    const homeTxt = formatScorers(homeGoals);
                    const awayTxt = formatScorers(awayGoals);
                    return (
                      <Fragment key={m.id}>
                        <tr className="border-t border-border">
                          <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Team name={m.home} flag={m.home_flag} align="right" />
                              <span className="min-w-14 text-center font-bold">
                                {m.score_home !== null && m.score_away !== null
                                  ? `${m.score_home}:${m.score_away}`
                                  : "–"}
                              </span>
                              <Team name={m.away} flag={m.away_flag} align="left" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{attText(m.attendance)}</td>
                        </tr>
                        {(homeTxt || awayTxt) && (
                          <tr>
                            <td />
                            <td className="px-4 pb-3 pt-0">
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <span className="flex-1 text-right">{homeTxt}</span>
                                <span className="min-w-14" />
                                <span className="flex-1 text-left">{awayTxt}</span>
                              </div>
                            </td>
                            <td />
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {list.length} utakmica · {yearStat.w} pobjeda · {yearStat.d} neriješeno · {yearStat.l} poraza · golovi{" "}
              {yearStat.gf}:{yearStat.ga}
            </p>
          </section>
        </>
      )}
    </main>
  );
}
