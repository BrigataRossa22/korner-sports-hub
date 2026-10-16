import { Fragment, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { normClub, sameClub } from "@/lib/club-match";
import { getCupGoals, type CupGoal } from "@/lib/cupgoals.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

const KEY = "kup-sezona";

const BALL_URL =
  "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/lopta.webp";

const ROUNDS: { key: string; title: string }[] = [
  { key: "Q1", title: "Q1" },
  { key: "Q2", title: "Q2" },
  { key: "1/32", title: "1/32 finala" },
  { key: "1/16", title: "1/16 finala" },
  { key: "1/8", title: "1/8 finala" },
  { key: "1/4", title: "Četvrtfinale" },
  { key: "1/2", title: "Polufinale" },
  { key: "Finale", title: "Finale" },
];

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

function GoalText({ g }: { g: CupGoal }) {
  return (
    <span>
      <span className="font-semibold">{g.player}</span>
      <span className="text-muted-foreground">{tagOf(g)}</span>
    </span>
  );
}

function Team({ name, crest, align }: { name: string; crest: string; align: "left" | "right" }) {
  const img = crest ? (
    <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
  ) : (
    <span className="size-6 shrink-0" />
  );
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

type Leg = { leg: 1 | 2; aggregate: string | null };

/** Za parove koji se igraju dva puta u istoj rundi: koji je meč i ukupan rezultat. */
function legInfo(rows: CupMatch[]): Map<string, Leg> {
  const byPair = new Map<string, CupMatch[]>();
  for (const m of rows) {
    const key = [normClub(m.home), normClub(m.away)].sort().join("|");
    byPair.set(key, [...(byPair.get(key) ?? []), m]);
  }

  const out = new Map<string, Leg>();
  for (const legs of byPair.values()) {
    if (legs.length !== 2) continue;
    const [first, second] = [...legs].sort((a, b) => a.match_date.localeCompare(b.match_date));
    if (!first || !second) continue;

    let aggregate: string | null = null;
    if (
      first.score_home !== null &&
      first.score_away !== null &&
      second.score_home !== null &&
      second.score_away !== null
    ) {
      // ukupno, gledano od domaćina drugog meča
      const h = second.score_home + first.score_away;
      const a = second.score_away + first.score_home;
      aggregate = `${h}:${a}`;
    }
    out.set(first.id, { leg: 1, aggregate: null });
    out.set(second.id, { leg: 2, aggregate });
  }
  return out;
}

function RoundTable({
  title,
  rows,
  goals,
}: {
  title: string;
  rows: CupMatch[];
  goals: CupGoal[];
}) {
  const crestFor = useClubCrest();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const legs = legInfo(rows);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const goalsOf = (m: CupMatch) =>
    goals
      .filter(
        (g) =>
          g.season === m.season &&
          g.round === m.round &&
          sameClub(g.home, m.home) &&
          sameClub(g.away, m.away),
      )
      .sort((a, b) => a.minute - b.minute || a.extra - b.extra);

  return (
    <section className="mt-8 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
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
            {rows.map((m) => {
              const mg = goalsOf(m);
              const canOpen = mg.length > 0;
              const isOpen = canOpen && open.has(m.id);
              const leg = legs.get(m.id);
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
                    <td className="whitespace-nowrap px-4 py-3">
                      {fmtDate(m.match_date)}
                      {leg && (
                        <span className="block text-[10px] font-semibold uppercase opacity-70">
                          {leg.leg}. meč
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Team name={m.home} crest={crestFor(m.home) || m.home_crest} align="right" />
                        <span className="flex min-w-14 flex-col items-center whitespace-nowrap">
                          <span className="font-bold">
                            {m.score_home !== null && m.score_away !== null
                              ? `${m.score_home}:${m.score_away}`
                              : "–"}
                          </span>
                          {leg?.aggregate && (
                            <span className="text-[10px] font-semibold uppercase opacity-70">
                              ukupno {leg.aggregate}
                            </span>
                          )}
                        </span>
                        <Team name={m.away} crest={crestFor(m.away) || m.away_crest} align="left" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        {m.attendance > 0
                          ? m.attendance.toLocaleString("de-DE")
                          : m.attendance < 0
                            ? "x"
                            : "—"}
                        <span className="inline-flex size-4 shrink-0 items-center justify-center">
                          {canOpen && (
                            <ChevronDown
                              className={`size-4 transition-transform ${
                                isOpen ? "rotate-180 text-primary-foreground" : "text-muted-foreground"
                              }`}
                            />
                          )}
                        </span>
                      </span>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="text-foreground">
                      <td className="bg-muted" />
                      <td className="bg-muted px-4 py-4">
                        <div className="relative">
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/30"
                          />
                          <ul className="space-y-2 text-xs">
                            {mg.map((g) => {
                              const isHome = g.side === "H";
                              const minute = (
                                <span className="font-semibold tabular-nums">{minuteOf(g)}</span>
                              );
                              return (
                                <li
                                  key={g.id}
                                  className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                                >
                                  <div className="min-w-0 text-right">
                                    {isHome ? <GoalText g={g} /> : minute}
                                  </div>
                                  <span className="relative z-10 flex min-w-14 justify-center">
                                    <span className="rounded-full bg-muted p-0.5">
                                      <img src={BALL_URL} alt="" className="size-5 object-contain" />
                                    </span>
                                  </span>
                                  <div className="min-w-0 text-left">
                                    {isHome ? minute : <GoalText g={g} />}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </td>
                      <td className="bg-muted" />
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CupMatches() {
  const { data, isLoading } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["cup-goals"],
    queryFn: () => getCupGoals(),
  });
  const rows = data ?? [];
  const goals = goalsData ?? [];

  const seasons = [...new Set(rows.map((m) => m.season))].sort((a, b) => b.localeCompare(a));

  const [picked, setPicked] = useState("");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setPicked(saved);
    } catch {
      /* ignoriši */
    }
  }, []);
  const choose = (s: string) => {
    setPicked(s);
    try {
      sessionStorage.setItem(KEY, s);
    } catch {
      /* ignoriši */
    }
  };

  const season = seasons.includes(picked) ? picked : seasons[0] || "";
  const inSeason = rows.filter((m) => m.season === season);

  const known = new Set(ROUNDS.map((r) => r.key));
  const extra = [...new Set(inSeason.map((m) => m.round).filter((r) => !known.has(r)))];
  const order = [...ROUNDS, ...extra.map((r) => ({ key: r, title: r }))];

  if (isLoading) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card">
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  if (seasons.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">Kup BiH {season}</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="kup-sezona" className="text-xs font-semibold uppercase text-muted-foreground">
            Sezona
          </label>
          <select
            id="kup-sezona"
            value={season}
            onChange={(e) => choose(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {order.map(({ key, title }) => {
        const list = inSeason.filter((m) => m.round === key);
        return list.length ? <RoundTable key={key} title={title} rows={list} goals={goals} /> : null;
      })}
    </div>
  );
}
