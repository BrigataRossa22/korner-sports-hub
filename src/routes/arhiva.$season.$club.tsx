import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { sameClub } from "@/lib/club-match";
import { getSeasonGoals, type SeasonGoal } from "@/lib/seasongoals.functions";
import { getSeasonMatches, type SeasonMatch } from "@/lib/seasonmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/arhiva/$season/$club")({
  head: ({ params }) => ({
    meta: [{ title: `${params.club} ${params.season} — Korner BiH` }],
  }),
  errorComponent: LoadError,
  component: ArhivaKlub,
});

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

function ArhivaKlub() {
  const { season, club } = Route.useParams();
  const crestFor = useClubCrest();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["season-goals", season],
    queryFn: () => getSeasonGoals({ data: { season } }),
  });

  // Isti klub pod različitim imenima ("Slavija" i "Slavija Sarajevo") se prepoznaje kao isti
  const isMine = (name: string) => sameClub(name, club);
  const mine = (data ?? []).filter((m) => isMine(m.home) || isMine(m.away));
  const goals = goalsData ?? [];

  let w = 0,
    d = 0,
    l = 0,
    gf = 0,
    ga = 0;
  const resultOf = (m: SeasonMatch): "W" | "D" | "L" | null => {
    if (m.score_home === null || m.score_away === null) return null;
    const home = isMine(m.home);
    const a = home ? m.score_home : m.score_away;
    const b = home ? m.score_away : m.score_home;
    return a > b ? "W" : a === b ? "D" : "L";
  };
  for (const m of mine) {
    const r = resultOf(m);
    if (!r) continue;
    const home = isMine(m.home);
    gf += home ? m.score_home! : m.score_away!;
    ga += home ? m.score_away! : m.score_home!;
    if (r === "W") w++;
    else if (r === "D") d++;
    else l++;
  }

  const pill: Record<string, string> = {
    W: "bg-primary/15 text-primary",
    D: "bg-muted text-foreground",
    L: "bg-destructive/15 text-destructive",
  };

  const goalsOf = (m: SeasonMatch): SeasonGoal[] =>
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

  const Crest = ({ name }: { name: string }) => {
    const c = crestFor(name);
    return c ? (
      <img src={c} alt="" className="size-8 shrink-0 object-contain sm:size-7" />
    ) : (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground sm:size-7">
        {initials(name)}
      </span>
    );
  };

  const crest = crestFor(club);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/stare-sezone" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na arhivu sezona
      </Link>
      <div className="rule-top mb-5 mt-3 flex items-center gap-4 pt-3">
        {crest && <img src={crest} alt="" className="size-16 object-contain" />}
        <div>
          <p className="kicker">Sezona {season}</p>
          <h1 className="mt-1 font-display text-3xl uppercase sm:text-4xl">{club}</h1>
          {mine.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {w} pobjeda · {d} neriješeno · {l} poraza · golovi {gf}:{ga}
            </p>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
          Utakmice
        </h2>
        {isLoading ? (
          <TableSkeleton rows={8} cols={3} />
        ) : mine.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Za ovu sezonu još nema utakmica.</p>
        ) : (
          <div>
            <div className="grid grid-cols-[3.25rem_1fr_4.75rem] items-center gap-2 px-3 py-2 text-xs uppercase text-muted-foreground sm:grid-cols-[4.5rem_1fr_6rem]">
              <span>Kolo</span>
              <span className="text-center">Utakmica</span>
              <span className="text-right">Gledalaca</span>
            </div>

            {mine.map((m) => {
              const r = resultOf(m);
              const mg = goalsOf(m);
              const canOpen = mg.length > 0;
              const isOpen = canOpen && open.has(m.id);
              const att =
                m.attendance > 0
                  ? m.attendance.toLocaleString("de-DE")
                  : m.attendance < 0
                    ? "x"
                    : "—";

              return (
                <div key={m.id} className="border-t border-border">
                  <div
                    className={`grid grid-cols-[3.25rem_1fr_4.75rem] items-center gap-2 px-3 py-3 sm:grid-cols-[4.5rem_1fr_6rem] ${
                      canOpen ? "cursor-pointer hover:bg-muted/40" : ""
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
                    <div>
                      <p className="text-base font-bold leading-none tabular-nums">
                        {m.round ?? "—"}
                      </p>
                      <p className="mt-1 text-[10px] leading-tight text-muted-foreground tabular-nums">
                        {fmtDate(m.match_date)}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <span
                        className="flex flex-1 items-center justify-end gap-2 text-right"
                        title={m.home}
                      >
                        <span
                          className={`hidden sm:inline ${isMine(m.home) ? "font-bold" : "font-medium"}`}
                        >
                          {m.home}
                        </span>
                        <Crest name={m.home} />
                      </span>
                      <span
                        className={`min-w-14 rounded-md px-2 py-1 text-center text-sm font-bold tabular-nums ${
                          r ? pill[r] : "text-muted-foreground"
                        }`}
                      >
                        {m.score_home !== null && m.score_away !== null
                          ? `${m.score_home}:${m.score_away}`
                          : "–"}
                      </span>
                      <span className="flex flex-1 items-center gap-2" title={m.away}>
                        <Crest name={m.away} />
                        <span
                          className={`hidden sm:inline ${isMine(m.away) ? "font-bold" : "font-medium"}`}
                        >
                          {m.away}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1 text-right text-sm tabular-nums">
                      <span>{att}</span>
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
                            const who = (
                              <span>
                                <span className="font-semibold">{g.player}</span>
                                <span className="text-muted-foreground">{tagOf(g)}</span>
                              </span>
                            );
                            return (
                              <li
                                key={g.id}
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

            <div className="flex items-center justify-center gap-5 border-t border-border px-3 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" />
                Pobjeda
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                Remi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive" />
                Poraz
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
