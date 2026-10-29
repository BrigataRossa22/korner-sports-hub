import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getCupMatches } from "@/lib/cupmatches.functions";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";
import { getSeasonGoals } from "@/lib/seasongoals.functions";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { normClub, sameClub } from "@/lib/club-match";
import { useCrest } from "@/lib/use-crest";
import { useClubCrest } from "@/lib/use-club-crest";

// Mora biti ista oznaka kao u clubhistory.functions.ts
const CURRENT_SEASON = "2026-27";

const CUP_TITLE: Record<string, string> = {
  Q1: "Q1",
  Q2: "Q2",
  "1/32": "1/32 finala",
  "1/16": "1/16 finala",
  "1/8": "1/8 finala",
  "1/4": "Četvrtfinale",
  "1/2": "Polufinale",
  Finale: "Finale",
};

const EURO_TITLE: Record<EuroMatch["competition"], string> = {
  LP: "Liga prvaka",
  LE: "Liga Evrope",
  KL: "Konferencijska liga",
  KPK: "Kup pobjednika kupova",
};

const ns = (s: string) => s.replace(/[–—]/g, "-").trim();

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function attendanceText(n: number | null): string {
  if (n === null) return "—";
  return n > 0 ? n.toLocaleString("de-DE") : n < 0 ? "x" : "—";
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

// "2:1" ili "2:1 (4:3 p)" -> [2, 1]; "-" ili prazno -> null
function pair(s: string | null | undefined): [number, number] | null {
  const m = /^\s*(\d+)\s*[:\-–]\s*(\d+)/.exec(s ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

type Comp = "liga" | "kup" | "evropa";

const COMP_RANK: Record<Comp, number> = { liga: 0, kup: 1, evropa: 2 };

// Iz naziva takmičenja (tekuća sezona) pogodi o kojoj se vrsti utakmice radi
function compOf(name: string): Comp {
  const s = name.toLowerCase();
  if (/(liga prvaka|liga evrope|konferenc|uefa|champions|europa|pobjednika kupova|evrop)/.test(s)) {
    return "evropa";
  }
  if (/kup/.test(s)) return "kup";
  return "liga";
}

type MatchRow = {
  key: string;
  date: string | null;
  comp: Comp;
  title: string;
  sub: string;
  home: string;
  away: string;
  sh: number | null;
  sa: number | null;
  pen: string | null;
  /** Penali: [domaći, gosti] kad je utakmica odlučena penalima */
  penPair: [number, number] | null;
  att: number | null;
  /** Redoslijed za utakmice bez datuma (npr. kolo) */
  order: number;
};

// Sve utakmice idu zajedno po datumu; one bez datuma na kraju (liga, kup, Evropa)
function sortKey(r: MatchRow): string {
  const tail = `${COMP_RANK[r.comp]}${String(r.order).padStart(5, "0")}`;
  return r.date ? `0${r.date.slice(0, 10)}${tail}` : `1${tail}`;
}

type EuroLeg = {
  key: string;
  title: string;
  round: string;
  agg: string;
  date: string | null;
  home: string;
  away: string;
  sh: number;
  sa: number;
  att: number | null;
};

export function ClubMatchesSection({
  name,
  season: seasonProp,
  onSeasonChange,
}: {
  name: string;
  /** Ako se proslijedi, sezonu bira roditelj (npr. klik na sezonu u tabeli iznad) */
  season?: string;
  onSeasonChange?: (s: string) => void;
}) {
  const crestFor = useCrest();
  const clubCrest = useClubCrest();
  const [localSeason, setLocalSeason] = useState("");
  const season = seasonProp ?? localSeason;
  const setSeason = onSeasonChange ?? setLocalSeason;

  const { data, isLoading } = useQuery({
    queryKey: ["club-detail", name],
    queryFn: () => getClubDetail({ data: { name } }),
  });
  const { data: history } = useQuery({
    queryKey: ["club-history-v2", name],
    queryFn: () => getClubHistory({ data: { name } }),
  });
  const { data: euro } = useQuery({
    queryKey: ["euro-matches"],
    queryFn: () => getEuroMatches(),
  });
  const { data: cup } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });

  const isCurrent = season === CURRENT_SEASON;
  const past = season !== "" && !isCurrent;
  const { data: seasonLeague, isLoading: leagueLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
    enabled: past,
  });

  // Golovi te sezone (isti upit kao "Najbolji strijelci sezone", pa se dijeli keš)
  const { data: seasonGoals } = useQuery({
    queryKey: ["season-goals", season],
    queryFn: () => getSeasonGoals({ data: { season } }),
    enabled: past,
  });

  const flags = new Map<string, string>();
  for (const e of euro ?? []) {
    if (e.opponent_flag) flags.set(normClub(e.opponent), e.opponent_flag);
  }
  const flagUrl = (f: string): string =>
    !f ? "" : f.startsWith("http") ? f : `https://flagcdn.com/w40/${f.toLowerCase()}.png`;

  const Badge = ({ club }: { club: string }) => {
    const c = crestFor(club);
    if (c) return <img src={c} alt="" className="size-6 shrink-0 object-contain" />;
    const f = flagUrl(flags.get(normClub(club)) ?? "");
    if (f) return <img src={f} alt="" className="h-4 w-6 shrink-0 object-cover" />;
    const b = clubCrest(club);
    if (b) return <img src={b} alt="" className="size-6 shrink-0 object-contain" />;
    return null;
  };

  // Veći grb za mobitel; ako ga nema, zastava ili krug s inicijalima
  const MobileBadge = ({ club }: { club: string }) => {
    const c = crestFor(club) || clubCrest(club);
    if (c) return <img src={c} alt="" className="size-8 shrink-0 object-contain" />;
    const f = flagUrl(flags.get(normClub(club)) ?? "");
    if (f) return <img src={f} alt="" className="h-5 w-8 shrink-0 object-cover" />;
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
        {initials(club)}
      </span>
    );
  };

  const MatchCell = ({
    home,
    away,
    sh,
    sa,
  }: {
    home: string;
    away: string;
    sh: number | null;
    sa: number | null;
  }) => (
    <div className="flex items-center gap-3">
      <span className="flex flex-1 items-center justify-end gap-2 text-right font-medium">
        {home}
        <Badge club={home} />
      </span>
      <span className="min-w-14 text-center font-bold">
        {sh !== null && sa !== null ? `${sh}:${sa}` : "–"}
      </span>
      <span className="flex flex-1 items-center gap-2 font-medium">
        <Badge club={away} />
        {away}
      </span>
    </div>
  );

  // Boja rezultata iz ugla ovog kluba
  const pillClass = (r: MatchRow): string => {
    if (r.sh === null || r.sa === null) return "bg-muted text-foreground";
    const isHome = sameClub(r.home, name);
    const isAway = sameClub(r.away, name);
    if (!isHome && !isAway) return "bg-muted text-foreground";
    let mine = isHome ? r.sh : r.sa;
    let theirs = isHome ? r.sa : r.sh;
    if (mine === theirs && r.penPair) {
      mine = isHome ? r.penPair[0] : r.penPair[1];
      theirs = isHome ? r.penPair[1] : r.penPair[0];
    }
    if (mine > theirs) return "bg-primary/15 text-primary";
    if (mine < theirs) return "bg-destructive/15 text-destructive";
    return "bg-muted text-foreground";
  };

  const clubCup = (cup ?? []).filter((m) => sameClub(m.home, name) || sameClub(m.away, name));
  const clubEuro = (euro ?? []).filter((e) => sameClub(e.club, name));

  const options = (() => {
    const set = new Set<string>([CURRENT_SEASON]);
    for (const r of history ?? []) set.add(ns(r.season));
    for (const m of clubCup) set.add(ns(m.season));
    for (const e of clubEuro) set.add(ns(e.season));
    return [...set].sort((a, b) => b.localeCompare(a));
  })();

  const pastLeague = (seasonLeague ?? [])
    .filter((m) => sameClub(m.home, name) || sameClub(m.away, name))
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));
  const seasonCup = clubCup
    .filter((m) => ns(m.season) === season)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const seasonEuro = clubEuro
    .filter((e) => ns(e.season) === season)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Strijelci kluba u ligi te sezone (autogol se ne računa igraču koji ga je dao)
  const scorers = (() => {
    const map = new Map<string, { player: string; goals: number }>();
    for (const g of seasonGoals ?? []) {
      if (g.kind === "o") continue;
      const team = g.side === "H" ? g.home : g.away;
      if (!sameClub(team, name)) continue;
      const row = map.get(g.player) ?? { player: g.player, goals: 0 };
      row.goals += 1;
      map.set(g.player, row);
    }
    return [...map.values()].sort(
      (a, b) => b.goals - a.goals || a.player.localeCompare(b.player, "bs"),
    );
  })();
  const scorersTotal = scorers.reduce((sum, r) => sum + r.goals, 0);

  // Svaka evropska utakmica u svom redu (domaći i gostujući meč posebno)
  const euroLegs: EuroLeg[] = seasonEuro.flatMap((e) => {
    const base = {
      title: EURO_TITLE[e.competition],
      round: e.round,
      agg: e.agg,
    };
    const h = pair(e.home);
    const a = pair(e.away);
    const legs: EuroLeg[] = [];
    if (h) {
      legs.push({
        ...base,
        key: `${e.id}-h`,
        date: e.home_date ?? null,
        home: e.club,
        away: e.opponent,
        sh: h[0],
        sa: h[1],
        att: e.attendance,
      });
    }
    if (a) {
      legs.push({
        ...base,
        key: `${e.id}-a`,
        date: e.away_date ?? null,
        home: e.opponent,
        away: e.club,
        sh: a[1],
        sa: a[0],
        att: e.away_attendance ?? null,
      });
    }
    // Ako su oba datuma upisana, prvo ide raniji meč
    if (legs.length === 2 && legs[0]!.date && legs[1]!.date && legs[0]!.date > legs[1]!.date) {
      legs.reverse();
    }
    return legs;
  });

  // ---- Sve utakmice sezone u jednoj listi ----
  const rows: MatchRow[] = [];
  const seen = new Set<string>();
  const pairKey = (d: string | null, h: string, a: string) =>
    `${(d ?? "").slice(0, 10)}|${normClub(h)}|${normClub(a)}`;
  const push = (r: MatchRow) => {
    rows.push(r);
    if (r.date) seen.add(pairKey(r.date, r.home, r.away));
  };

  if (isCurrent) {
    (data?.matches ?? []).forEach((m, i) => {
      push({
        key: `club-${m.id}`,
        date: m.match_date,
        comp: compOf(m.competition ?? ""),
        title: m.competition,
        sub: "",
        home: m.home,
        away: m.away,
        sh: m.score_home,
        sa: m.score_away,
        pen: null,
        penPair: null,
        att: m.attendance,
        order: i,
      });
    });
  } else if (past) {
    pastLeague.forEach((m, i) => {
      push({
        key: `liga-${m.id}`,
        date: m.match_date,
        comp: "liga",
        title: "WWIN liga",
        sub: m.round !== null ? `${m.round}. kolo` : "",
        home: m.home,
        away: m.away,
        sh: m.score_home,
        sa: m.score_away,
        pen: null,
        penPair: null,
        att: m.attendance,
        order: m.round ?? i,
      });
    });
  }

  if (season !== "") {
    const hasEuroRows = rows.some((r) => r.comp === "evropa");

    seasonCup.forEach((m, i) => {
      if (isCurrent && seen.has(pairKey(m.match_date, m.home, m.away))) return;
      const hasPen = m.pen_home != null && m.pen_away != null;
      push({
        key: `kup-${m.id}`,
        date: m.match_date,
        comp: "kup",
        title: "Kup BiH",
        sub: CUP_TITLE[m.round] ?? m.round,
        home: m.home,
        away: m.away,
        sh: m.score_home,
        sa: m.score_away,
        pen: hasPen ? `pen. ${m.pen_home}:${m.pen_away}` : null,
        penPair: hasPen ? [Number(m.pen_home), Number(m.pen_away)] : null,
        att: m.attendance,
        order: i,
      });
    });

    euroLegs.forEach((l, i) => {
      if (isCurrent) {
        // Utakmica koja je već u listi (isti datum i par) se ne dodaje drugi put
        if (l.date && seen.has(pairKey(l.date, l.home, l.away))) return;
        if (!l.date && hasEuroRows) return;
      }
      push({
        key: `euro-${l.key}`,
        date: l.date,
        comp: "evropa",
        title: l.title,
        sub: `${l.round}${l.agg ? ` · ukupno ${l.agg}` : ""}`,
        home: l.home,
        away: l.away,
        sh: l.sh,
        sa: l.sa,
        pen: null,
        penPair: null,
        att: l.att,
        order: i,
      });
    });
  }

  const sorted = [...rows].sort((a, b) => {
    const x = sortKey(a);
    const y = sortKey(b);
    return x < y ? -1 : x > y ? 1 : 0;
  });

  const loading = isCurrent ? isLoading : past ? leagueLoading : false;

  return (
    <section id="utakmice" className="scroll-mt-24 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">
          Utakmice{season ? ` · ${season}` : ""}
        </h2>
        <div className="flex items-center gap-2">
          <label
            htmlFor="utakmice-sezona"
            className="text-xs font-semibold uppercase text-muted-foreground"
          >
            Sezona
          </label>
          <select
            id="utakmice-sezona"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          >
            <option value="">Izaberi sezonu</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {season === "" && (
        <p className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
          Izaberi sezonu ili klikni na sezonu u tabeli iznad da vidiš sve utakmice te sezone.
        </p>
      )}

      {season !== "" && (
        <div className="border-t border-border">
          {loading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : sorted.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {isCurrent ? "Još nema utakmica." : "Za ovu sezonu još nema unesenih utakmica."}
            </p>
          ) : (
            <>
              {/* ---- Mobitel: grbovi, obojen rezultat, takmičenje ispod ---- */}
              <div className="sm:hidden">
                <div className="grid grid-cols-[3.75rem_1fr_3.5rem] items-center gap-2 px-3 py-2 text-xs uppercase text-muted-foreground">
                  <span>Datum</span>
                  <span className="text-center">Utakmica</span>
                  <span className="text-right">Gledalaca</span>
                </div>

                {sorted.map((r) => (
                  <div key={r.key} className="border-t border-border px-3 py-3">
                    <div className="grid grid-cols-[3.75rem_1fr_3.5rem] items-center gap-2">
                      <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
                        {fmtDate(r.date)}
                      </span>

                      <div className="flex items-center justify-center gap-2">
                        <span className="flex flex-1 justify-end" title={r.home}>
                          <MobileBadge club={r.home} />
                        </span>
                        <span
                          className={`min-w-14 rounded-md px-2 py-1 text-center text-sm font-bold tabular-nums ${pillClass(r)}`}
                        >
                          {r.sh !== null && r.sa !== null ? `${r.sh}:${r.sa}` : "–"}
                        </span>
                        <span className="flex flex-1" title={r.away}>
                          <MobileBadge club={r.away} />
                        </span>
                      </div>

                      <span className="text-right text-xs tabular-nums">
                        {attendanceText(r.att)}
                      </span>
                    </div>

                    <p className="mt-1 text-center text-[10px] text-muted-foreground">
                      <span className="font-semibold">{r.title}</span>
                      {r.sub ? ` · ${r.sub}` : ""}
                      {r.pen ? ` · ${r.pen}` : ""}
                    </p>
                  </div>
                ))}

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
                <table className="w-full min-w-[680px] text-sm tabular-nums">
                  <thead>
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2 text-left">Datum</th>
                      <th className="px-4 py-2 text-left">Takmičenje</th>
                      <th className="px-4 py-2 text-center">Utakmica</th>
                      <th className="px-4 py-2 text-right">Gledalaca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.key} className="border-t border-border">
                        <td className="whitespace-nowrap px-4 py-3">{fmtDate(r.date)}</td>
                        <td className="px-4 py-3">
                          <span className="block font-semibold">{r.title}</span>
                          {r.sub && (
                            <span className="block text-xs text-muted-foreground">{r.sub}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <MatchCell home={r.home} away={r.away} sh={r.sh} sa={r.sa} />
                          {r.pen && (
                            <p className="mt-0.5 text-center text-[10px] font-semibold uppercase text-muted-foreground">
                              {r.pen}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">{attendanceText(r.att)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {past && scorers.length > 0 && (
            <div>
              <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strijelci u ligi · {season}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="w-12 px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Igrač</th>
                      <th className="px-4 py-2 text-right">Golova</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorers.map((r, i) => (
                      <tr key={r.player} className="border-t border-border">
                        <td className="px-4 py-3 font-semibold text-primary">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold">{r.player}</td>
                        <td className="px-4 py-3 text-right text-base font-bold">{r.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-surface font-bold">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 uppercase">Ukupno</td>
                      <td className="px-4 py-3 text-right">{scorersTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
