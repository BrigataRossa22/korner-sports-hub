import { Fragment, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { sameClub } from "@/lib/club-match";
import { getSeasonGoals, type SeasonGoal } from "@/lib/seasongoals.functions";
import { getSeasonMatches, type SeasonMatch } from "@/lib/seasonmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

const BALL_URL =
  "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/lopta.webp";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function minuteOf(g: SeasonGoal): string {
  return `${g.minute}${g.extra > 0 ? `+${g.extra}` : ""}'`;
}

function tagOf(g: SeasonGoal): string {
  return g.kind === "p" ? " (pen.)" : g.kind === "o" ? " (autogol)" : "";
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

function GoalText({ g }: { g: SeasonGoal }) {
  return (
    <span>
      <span className="font-semibold">{g.player}</span>
      <span className="text-muted-foreground">{tagOf(g)}</span>
    </span>
  );
}

export function SeasonRounds({ season }: { season: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["season-goals", season],
    queryFn: () => getSeasonGoals({ data: { season } }),
  });
  const crestFor = useClubCrest();
  const [picked, setPicked] = useState<number | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPicked(null);
    setOpen(new Set());
  }, [season]);

  const rows = data ?? [];
  const goals = goalsData ?? [];
  const groups = new Map<number, SeasonMatch[]>();
  for (const m of rows) {
    const r = m.round ?? 0;
    groups.set(r, [...(groups.get(r) ?? []), m]);
  }
  const rounds = [...groups.keys()].sort((a, b) => a - b);
  const round = picked !== null && rounds.includes(picked) ? picked : (rounds[0] ?? 0);
  const list = groups.get(round) ?? [];

  const goalsOf = (m: SeasonMatch) =>
    m.round === null
      ? []
      : goals
          .filter((g) => g.round === m.round && sameClub(g.home, m.home) && sameClub(g.away, m.away))
          .sort((a, b) => a.minute - b.minute || a.extra - b.extra);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const attText = (n: number): string =>
    n > 0 ? n.toLocaleString("de-DE") : n < 0 ? "x" : "—";

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-6 shrink-0 object-contain" />
    ) : (
      <span className="size-6 shrink-0" />
    );
  };

  // Veći grb za mobitel; ako grba nema, krug s inicijalima
  const MobileCrest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-8 shrink-0 object-contain" />
    ) : (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
        {initials(club)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card">
        <TableSkeleton rows={8} cols={3} />
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <p className="mt-10 border-y border-border py-6 text-sm text-muted-foreground">
        Utakmice po kolima za ovu sezonu još nisu unesene.
      </p>
    );
  }

  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">
          {round === 0 ? "Bez kola" : `${round}. kolo`}
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="kolo-arhiva" className="text-xs font-semibold uppercase text-muted-foreground">
            Kolo
          </label>
          <select
            id="kolo-arhiva"
            value={round}
            onChange={(e) => setPicked(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          >
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "Bez kola" : `${r}. kolo`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Mobitel: grbovi, rezultat i klik na strijelce ---- */}
      <div className="sm:hidden">
        <div className="grid grid-cols-[3.75rem_1fr_4rem] items-center gap-2 px-3 py-2 text-xs uppercase text-muted-foreground">
          <span>Datum</span>
          <span className="text-center">Utakmica</span>
          <span className="text-right">Gledalaca</span>
        </div>

        {list.map((m) => {
          const mg = goalsOf(m);
          const canOpen = mg.length > 0;
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
                    <MobileCrest club={m.home} />
                  </span>
                  <span className="min-w-14 rounded-md bg-muted px-2 py-1 text-center text-sm font-bold tabular-nums">
                    {m.score_home !== null && m.score_away !== null
                      ? `${m.score_home}:${m.score_away}`
                      : "–"}
                  </span>
                  <span className="flex flex-1" title={m.away}>
                    <MobileCrest club={m.away} />
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
                            <span className="relative z-10 flex min-w-8 justify-center">
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
                </div>
              )}
            </div>
          );
        })}
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
              const mg = goalsOf(m);
              const canOpen = mg.length > 0;
              const isOpen = canOpen && open.has(m.id);
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
                          {m.score_home !== null && m.score_away !== null
                            ? `${m.score_home}:${m.score_away}`
                            : "–"}
                        </span>
                        <span className="flex flex-1 items-center gap-2 font-medium">
                          <Crest club={m.away} />
                          {m.away}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        {attText(m.attendance)}
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
