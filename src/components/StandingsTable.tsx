import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import type { StandingDTO } from "@/lib/content.functions";
import { sameClub } from "@/lib/club-match";
import { getLeagueMatches, type LeagueMatch } from "@/lib/leaguematches.functions";
import { getMatchGoals, type MatchGoal } from "@/lib/matchgoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";
import { useCrest } from "@/lib/use-crest";

const resultStyle: Record<string, string> = {
  W: "bg-primary text-primary-foreground",
  D: "bg-muted text-muted-foreground",
  L: "bg-destructive text-destructive-foreground",
};

const BALL_URL =
  "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/lopta.webp";

// Na mobitelu: # i grb ostaju zaglavljeni lijevo, a ime kluba klizi ispod grba
const stickyHead = "sticky z-20 bg-surface sm:static sm:bg-transparent";
const stickyCell = (selected: boolean) =>
  `sticky z-10 ${selected ? "bg-muted" : "bg-card"} sm:static sm:bg-transparent`;

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

function GoalText({ g }: { g: MatchGoal }) {
  return (
    <span>
      <span className="font-semibold">{g.player}</span>
      {g.assist && g.kind !== "own" && (
        <span className="text-muted-foreground"> ({g.assist})</span>
      )}
      <span className="text-muted-foreground">{tagOf(g)}</span>
    </span>
  );
}

// Utakmice izabranog kluba u ovoj sezoni; klik na utakmicu otvara strijelce
function ClubMatches({ team }: { team: string }) {
  const crestFor = useClubCrest();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ["league-matches"],
    queryFn: () => getLeagueMatches(),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["match-goals"],
    queryFn: () => getMatchGoals(),
  });

  const matches = (matchesData ?? [])
    .filter((m) => sameClub(m.home, team) || sameClub(m.away, team))
    .sort(
      (a, b) =>
        (a.round ?? 999) - (b.round ?? 999) || a.match_date.localeCompare(b.match_date),
    );
  const goals = goalsData ?? [];

  const goalsOf = (m: LeagueMatch) =>
    m.round === null
      ? []
      : goals
          .filter(
            (g) =>
              g.round === m.round && sameClub(g.home, m.home) && sameClub(g.away, m.away),
          )
          .sort((a, b) => a.minute - b.minute || a.extra - b.extra);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Boja rezultata iz ugla izabranog kluba
  const pill = (m: LeagueMatch): string => {
    if (m.score_home === null || m.score_away === null) return "bg-muted text-foreground";
    const isHome = sameClub(m.home, team);
    const mine = isHome ? m.score_home : m.score_away;
    const theirs = isHome ? m.score_away : m.score_home;
    if (mine > theirs) return "bg-primary text-primary-foreground";
    if (mine < theirs) return "bg-destructive text-destructive-foreground";
    return "bg-muted text-foreground";
  };

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-6 shrink-0 object-contain" />
    ) : (
      <span className="size-6 shrink-0" />
    );
  };

  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Učitavam utakmice…</p>;
  }
  if (matches.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Još nema utakmica.</p>;
  }

  return (
    <ul>
      {matches.map((m) => {
        const mg = goalsOf(m);
        const hasResult = m.score_home !== null && m.score_away !== null;
        const goalless = hasResult && m.score_home === 0 && m.score_away === 0;
        const canOpen = mg.length > 0 || (hasResult && !goalless);
        const isOpen = canOpen && open.has(m.id);

        return (
          <li key={m.id} className="border-t border-border first:border-t-0">
            <div
              className={`flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 ${
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
              <span className="w-12 shrink-0 text-[10px] leading-tight text-muted-foreground tabular-nums sm:w-24 sm:text-xs">
                {fmtDate(m.match_date)}
                {m.round !== null && (
                  <span className="block">{m.round}. kolo</span>
                )}
              </span>

              <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right text-[13px] font-medium sm:text-sm">
                <span className="hidden truncate sm:inline">{m.home}</span>
                <Crest club={m.home} />
              </span>
              <span
                className={`min-w-12 shrink-0 rounded-md px-2 py-1 text-center text-sm font-bold tabular-nums ${pill(m)}`}
              >
                {hasResult ? `${m.score_home}:${m.score_away}` : "–"}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium sm:text-sm">
                <Crest club={m.away} />
                <span className="hidden truncate sm:inline">{m.away}</span>
              </span>

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

            {isOpen && (
              <div className="bg-muted px-3 pb-4 pt-1 sm:px-4">
                <p className="mb-3 text-center text-xs font-semibold text-muted-foreground">
                  {m.home} – {m.away}
                </p>
                {mg.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Strijelci još nisu uneseni.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {mg.map((g) => {
                      const isHome = sameClub(g.team, m.home);
                      const minute = (
                        <span className="font-semibold tabular-nums">{minuteOf(g)}</span>
                      );
                      return (
                        <li
                          key={g.id}
                          className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                        >
                          <div className="min-w-0 text-right">
                            {isHome ? <GoalText g={g} /> : minute}
                          </div>
                          <img src={BALL_URL} alt="" className="size-5 object-contain" />
                          <div className="min-w-0 text-left">
                            {isHome ? minute : <GoalText g={g} />}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function StandingsTable({ standings }: { standings: StandingDTO[] }) {
  const crestFor = useCrest();
  const [selected, setSelected] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Kad se izabere klub, spusti se do njegovih utakmica
  useEffect(() => {
    if (selected) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  const choose = (team: string) => setSelected((cur) => (cur === team ? null : team));

  return (
    <>
      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[600px] border-collapse text-sm tabular-nums sm:min-w-[660px]">
          <thead>
            <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
              <th
                scope="col"
                className={`${stickyHead} left-0 w-8 min-w-8 px-1 py-3 text-center font-semibold sm:w-10 sm:px-2`}
              >
                #
              </th>
              <th
                scope="col"
                className={`${stickyHead} left-8 w-11 min-w-11 border-r border-border px-1 py-3 sm:w-10 sm:min-w-0 sm:border-r-0 sm:px-0`}
              />
              <th scope="col" className="w-28 min-w-28 px-1 py-3 text-left font-semibold sm:w-auto sm:min-w-36 sm:px-2">
                Klub
              </th>
              {/* Bod odmah poslije kluba, samo na mobitelu */}
              <th scope="col" className="w-11 px-1 py-3 text-center font-semibold sm:hidden" title="Bodovi">
                Bod
              </th>
              <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Odigrano">Ut</th>
              <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Pobjede">P</th>
              <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Neriješeno">N</th>
              <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Porazi">I</th>
              <th scope="col" className="w-16 px-1 py-3 text-center font-semibold" title="Postignuti i primljeni golovi">Golovi</th>
              <th scope="col" className="w-10 px-0.5 py-3 text-center font-semibold sm:w-12 sm:px-1" title="Gol-razlika">GR</th>
              <th scope="col" className="w-32 px-1 py-3 text-center font-semibold sm:w-36">Forma</th>
              <th scope="col" className="hidden w-12 px-2 py-3 text-center font-semibold sm:table-cell" title="Bodovi">Bod</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => {
              const knownGoals = row.played === 0 || row.goalsFor !== 0 || row.goalsAgainst !== 0;
              const crest = crestFor(row.team) || row.crest;
              const isSel = selected === row.team;
              return (
                <tr
                  key={row.id}
                  onClick={() => choose(row.team)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      choose(row.team);
                    }
                  }}
                  tabIndex={0}
                  aria-expanded={isSel}
                  title="Prikaži utakmice ovog kluba"
                  className={`cursor-pointer border-b border-border/70 last:border-0 ${
                    isSel ? "bg-muted" : "hover:bg-muted/40 sm:even:bg-surface/50"
                  }`}
                >
                  <td
                    className={`${stickyCell(isSel)} left-0 w-8 min-w-8 px-1 py-2.5 text-center font-semibold text-primary sm:px-2 sm:py-3`}
                  >
                    {index + 1}
                  </td>
                  <td
                    className={`${stickyCell(isSel)} left-8 w-11 min-w-11 border-r border-border px-1 py-2.5 sm:w-10 sm:min-w-0 sm:border-r-0 sm:px-0 sm:py-3`}
                  >
                    <span className="flex items-center justify-center sm:justify-start">
                      {crest ? (
                        <img src={crest} alt="" className="size-7 shrink-0 object-contain sm:size-6" />
                      ) : (
                        <span className="size-7 shrink-0 sm:size-6" />
                      )}
                    </span>
                  </td>
                  <th
                    scope="row"
                    className="w-28 min-w-28 max-w-28 px-1 py-2.5 text-left font-semibold text-foreground sm:w-auto sm:min-w-36 sm:max-w-none sm:px-2 sm:py-3"
                  >
                    <span className="block truncate text-[13px] sm:overflow-visible sm:text-sm">
                      {row.team}
                    </span>
                  </th>
                  <td className="px-1 py-2.5 text-center font-bold text-primary sm:hidden">{row.points}</td>
                  <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.played}</td>
                  <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.wins}</td>
                  <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.draws}</td>
                  <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.losses}</td>
                  <td className="whitespace-nowrap px-1 py-2.5 text-center sm:py-3">
                    {knownGoals ? `${row.goalsFor}:${row.goalsAgainst}` : "—"}
                  </td>
                  <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">
                    {knownGoals
                      ? (row.goalsFor - row.goalsAgainst > 0 ? "+" : "") + (row.goalsFor - row.goalsAgainst)
                      : "—"}
                  </td>
                  <td className="px-1 py-2.5 sm:py-3">
                    <div
                      className="flex items-center justify-center gap-1"
                      aria-label={row.recentForm ? `Forma: ${row.recentForm}` : "Forma nije unesena"}
                    >
                      {row.recentForm ? (
                        row.recentForm
                          .slice(-5)
                          .split("")
                          .map((result, i) => (
                            <span
                              key={i}
                              title={result === "W" ? "Pobjeda" : result === "D" ? "Neriješeno" : "Poraz"}
                              className={`flex size-5 items-center justify-center rounded-sm text-[11px] font-bold ${
                                resultStyle[result] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {result}
                            </span>
                          ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-2 py-3 text-center font-bold text-primary sm:table-cell">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Klikni na klub da vidiš njegove utakmice u ovoj sezoni, a na utakmicu da vidiš strijelce.
      </p>

      {selected && (
        <section
          ref={panelRef}
          className="mt-6 scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="font-display text-lg font-bold uppercase">{selected}</h2>
            <div className="flex items-center gap-4 text-sm">
              <Link
                to="/klub/$name"
                params={{ name: selected }}
                className="font-semibold text-primary hover:underline"
              >
                Stranica kluba →
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Zatvori"
                className="text-lg leading-none text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          </div>
          <ClubMatches team={selected} />
        </section>
      )}
    </>
  );
}
