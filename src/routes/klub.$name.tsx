import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getClubInfo } from "@/lib/clubinfo.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { normClub, sameClub } from "@/lib/club-match";
import { useCrest } from "@/lib/use-crest";
import { useClubCrest } from "@/lib/use-club-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

// Mora biti ista oznaka kao u clubhistory.functions.ts
const CURRENT_SEASON = "2026-27";

export const Route = createFileRoute("/klub/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — Korner BiH` },
      { name: "description", content: `${params.name}: utakmice, trofeji i uspjesi.` },
    ],
  }),
  errorComponent: LoadError,
  component: Klub,
});

type Comp = "liga" | "evropa" | "kup" | "ukupno";

const COMP_LABEL: Record<Comp, string> = {
  liga: "Liga",
  evropa: "Evropa",
  kup: "Kup BiH",
  ukupno: "Ukupno",
};

const CUP_ORDER = ["Q1", "Q2", "1/32", "1/16", "1/8", "1/4", "1/2", "Finale"];
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

type CompRow = {
  season: string;
  stage: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  avg: number | null;
};

type TotalRow = {
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  avgs: number[];
};

const ns = (s: string) => s.replace(/[–—]/g, "-").trim();

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function parseScore(score: string): [number, number] | null {
  const m = /^\s*(\d+)\s*[:\-–]\s*(\d+)/.exec(score ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function mean(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((s, x) => s + x, 0) / values.length) : null;
}

function attendanceText(n: number): string {
  return n > 0 ? n.toLocaleString("de-DE") : n < 0 ? "x" : "—";
}

function Klub() {
  const { name } = Route.useParams();
  const crestFor = useCrest();
  const clubCrest = useClubCrest();
  const [comp, setComp] = useState<Comp>("liga");
  const [matchSeason, setMatchSeason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["club-detail", name],
    queryFn: () => getClubDetail({ data: { name } }),
  });
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["club-history", name],
    queryFn: () => getClubHistory({ data: { name } }),
  });
  const { data: info } = useQuery({
    queryKey: ["club-info", name],
    queryFn: () => getClubInfo({ data: { name } }),
  });
  const { data: euro } = useQuery({
    queryKey: ["euro-matches"],
    queryFn: () => getEuroMatches(),
  });
  const { data: cup } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });

  const pastSelected = matchSeason !== "" && matchSeason !== CURRENT_SEASON;
  const { data: seasonLeague, isLoading: seasonLeagueLoading } = useQuery({
    queryKey: ["season-matches", matchSeason],
    queryFn: () => getSeasonMatches({ data: { season: matchSeason } }),
    enabled: pastSelected,
  });

  const flags = new Map<string, string>();
  for (const e of euro ?? []) {
    if (e.opponent_flag) flags.set(normClub(e.opponent), e.opponent_flag);
  }
  const flagFor = (club: string): string => {
    const f = flags.get(normClub(club));
    if (!f) return "";
    return f.startsWith("http") ? f : `https://flagcdn.com/w40/${f.toLowerCase()}.png`;
  };

  const crest = clubCrest(name) || crestFor(name);

  const Badge = ({ club }: { club: string }) => {
    const c = crestFor(club);
    if (c) return <img src={c} alt="" className="size-6 shrink-0 object-contain" />;
    const f = flagFor(club);
    if (f) return <img src={f} alt="" className="h-4 w-6 shrink-0 object-cover" />;
    const b = clubCrest(club);
    if (b) return <img src={b} alt="" className="size-6 shrink-0 object-contain" />;
    return null;
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

  // ---- Kup BiH po sezonama ----
  const clubCup = (cup ?? []).filter((m) => sameClub(m.home, name) || sameClub(m.away, name));

  const kupRows: CompRow[] = (() => {
    const bySeason = new Map<string, CupMatch[]>();
    for (const m of clubCup) {
      const s = ns(m.season);
      bySeason.set(s, [...(bySeason.get(s) ?? []), m]);
    }
    return [...bySeason.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([season, ms]) => {
        let w = 0,
          d = 0,
          l = 0,
          gf = 0,
          ga = 0,
          best = -1;
        let finalGf = 0,
          finalGa = 0,
          hasFinal = false;
        const att: number[] = [];
        for (const m of ms) {
          const isHome = sameClub(m.home, name);
          const idx = CUP_ORDER.indexOf(m.round);
          if (idx > best) best = idx;
          if (isHome && m.attendance > 0) att.push(m.attendance);
          if (m.score_home === null || m.score_away === null) continue;
          const a = isHome ? m.score_home : m.score_away;
          const b = isHome ? m.score_away : m.score_home;
          gf += a;
          ga += b;
          if (a > b) w++;
          else if (a === b) d++;
          else l++;
          if (m.round === "Finale") {
            hasFinal = true;
            finalGf += a;
            finalGa += b;
          }
        }
        const lastRound = best >= 0 ? CUP_ORDER[best]! : (ms[0]?.round ?? "—");
        let stage = CUP_TITLE[lastRound] ?? lastRound;
        if (lastRound === "Finale" && hasFinal) {
          stage = finalGf > finalGa ? "Pobjednik" : "Finalista";
        }
        return {
          season,
          stage,
          played: w + d + l,
          wins: w,
          draws: d,
          losses: l,
          gf,
          ga,
          avg: mean(att),
        };
      });
  })();

  // ---- Evropa po sezonama ----
  const clubEuro = (euro ?? []).filter((e) => sameClub(e.club, name));

  const euroRows: CompRow[] = (() => {
    const bySeason = new Map<string, EuroMatch[]>();
    for (const e of clubEuro) {
      const s = ns(e.season);
      bySeason.set(s, [...(bySeason.get(s) ?? []), e]);
    }
    return [...bySeason.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([season, es]) => {
        let w = 0,
          d = 0,
          l = 0,
          gf = 0,
          ga = 0;
        const att: number[] = [];
        const sorted = [...es].sort((a, b) => a.sort_order - b.sort_order);
        for (const e of es) {
          if ((e.attendance ?? 0) > 0) att.push(e.attendance);
          for (const leg of [e.home, e.away]) {
            const p = parseScore(leg);
            if (!p) continue;
            gf += p[0];
            ga += p[1];
            if (p[0] > p[1]) w++;
            else if (p[0] === p[1]) d++;
            else l++;
          }
        }
        return {
          season,
          stage: sorted[sorted.length - 1]?.round ?? "—",
          played: w + d + l,
          wins: w,
          draws: d,
          losses: l,
          gf,
          ga,
          avg: mean(att),
        };
      });
  })();

  // ---- Ukupno: liga + kup + Evropa po sezonama ----
  const totalRows: TotalRow[] = (() => {
    const map = new Map<string, TotalRow>();
    const add = (
      season: string,
      r: {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gf: number;
        ga: number;
        avg: number | null;
      },
    ) => {
      const s = ns(season);
      const t = map.get(s) ?? {
        season: s,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        avgs: [],
      };
      t.played += r.played;
      t.wins += r.wins;
      t.draws += r.draws;
      t.losses += r.losses;
      t.gf += r.gf;
      t.ga += r.ga;
      if (r.avg !== null) t.avgs.push(r.avg);
      map.set(s, t);
    };
    for (const r of history ?? []) add(r.season, r);
    for (const r of euroRows) add(r.season, r);
    for (const r of kupRows) add(r.season, r);
    return [...map.values()].sort((a, b) => b.season.localeCompare(a.season));
  })();

  // ---- Izbor sezone za utakmice ----
  const seasonOptions = (() => {
    const set = new Set<string>([CURRENT_SEASON]);
    for (const r of history ?? []) set.add(ns(r.season));
    for (const m of clubCup) set.add(ns(m.season));
    for (const e of clubEuro) set.add(ns(e.season));
    return [...set].sort((a, b) => b.localeCompare(a));
  })();

  const pastLeague = (seasonLeague ?? [])
    .filter((m) => sameClub(m.home, name) || sameClub(m.away, name))
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));
  const pastCup = clubCup
    .filter((m) => ns(m.season) === matchSeason)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const pastEuro = clubEuro
    .filter((e) => ns(e.season) === matchSeason)
    .sort((a, b) => a.sort_order - b.sort_order);

  const otherRows = comp === "kup" ? kupRows : euroRows;
  const showStage = comp === "kup";

  const sumLiga = (pick: (r: NonNullable<typeof history>[number]) => number) =>
    (history ?? []).reduce((s, r) => s + pick(r), 0);
  const ligaTotalAvg = mean(
    (history ?? []).map((r) => r.avg).filter((a): a is number => a !== null),
  );

  const sumOther = (pick: (r: CompRow) => number) => otherRows.reduce((s, r) => s + pick(r), 0);
  const otherTotalAvg = mean(otherRows.map((r) => r.avg).filter((a): a is number => a !== null));

  const sumTotal = (pick: (r: TotalRow) => number) => totalRows.reduce((s, r) => s + pick(r), 0);
  const totalAvgAll = mean(
    totalRows.map((r) => mean(r.avgs)).filter((a): a is number => a !== null),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/tabela" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na tabelu
      </Link>
      <div className="rule-top mb-5 mt-3 flex items-center gap-4 pt-3">
        {crest && <img src={crest} alt="" className="size-16 object-contain" />}
        <div>
          <p className="kicker">Klub · sezona 2026/27</p>
          <h1 className="mt-1 font-display text-3xl uppercase sm:text-4xl">{name}</h1>
        </div>
      </div>

      {info && (info.founded || info.stadium) && (
        <section className="mb-8 flex flex-wrap gap-x-12 gap-y-4 rounded-lg border border-border bg-card px-5 py-4">
          {info.founded && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datum osnivanja
              </p>
              <p className="mt-1 text-base font-semibold">{info.founded}</p>
            </div>
          )}
          {info.stadium && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Stadion
              </p>
              <p className="mt-1 text-base font-semibold">{info.stadium}</p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h2 className="font-display text-lg font-bold uppercase">Utakmice</h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="utakmice-sezona"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Sezona
            </label>
            <select
              id="utakmice-sezona"
              value={matchSeason}
              onChange={(e) => setMatchSeason(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
            >
              <option value="">Izaberi sezonu</option>
              {seasonOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {matchSeason === CURRENT_SEASON &&
          (isLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : !data || data.matches.length === 0 ? (
            <p className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
              Još nema utakmica.
            </p>
          ) : (
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[620px] text-sm tabular-nums">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left">Datum</th>
                    <th className="px-4 py-2 text-left">Takmičenje</th>
                    <th className="px-4 py-2 text-center">Utakmica</th>
                    <th className="px-4 py-2 text-right">Gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matches.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                      <td className="px-4 py-3">{m.competition}</td>
                      <td className="px-4 py-3">
                        <MatchCell
                          home={m.home}
                          away={m.away}
                          sh={m.score_home}
                          sa={m.score_away}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">{attendanceText(m.attendance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {pastSelected && (
          <div className="border-t border-border">
            {seasonLeagueLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : pastLeague.length === 0 && pastCup.length === 0 && pastEuro.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Za ovu sezonu još nema unesenih utakmica.
              </p>
            ) : (
              <>
                {pastLeague.length > 0 && (
                  <div>
                    <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Liga
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm tabular-nums">
                        <thead>
                          <tr className="text-xs uppercase text-muted-foreground">
                            <th className="px-4 py-2 text-left">Kolo</th>
                            <th className="px-4 py-2 text-left">Datum</th>
                            <th className="px-4 py-2 text-center">Utakmica</th>
                            <th className="px-4 py-2 text-right">Gledalaca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastLeague.map((m) => (
                            <tr key={m.id} className="border-t border-border">
                              <td className="px-4 py-3">{m.round ?? "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {fmtDate(m.match_date)}
                              </td>
                              <td className="px-4 py-3">
                                <MatchCell
                                  home={m.home}
                                  away={m.away}
                                  sh={m.score_home}
                                  sa={m.score_away}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                {attendanceText(m.attendance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {pastCup.length > 0 && (
                  <div>
                    <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Kup BiH
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm tabular-nums">
                        <thead>
                          <tr className="text-xs uppercase text-muted-foreground">
                            <th className="px-4 py-2 text-left">Runda</th>
                            <th className="px-4 py-2 text-left">Datum</th>
                            <th className="px-4 py-2 text-center">Utakmica</th>
                            <th className="px-4 py-2 text-right">Gledalaca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastCup.map((m) => (
                            <tr key={m.id} className="border-t border-border">
                              <td className="px-4 py-3">{CUP_TITLE[m.round] ?? m.round}</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {fmtDate(m.match_date)}
                              </td>
                              <td className="px-4 py-3">
                                <MatchCell
                                  home={m.home}
                                  away={m.away}
                                  sh={m.score_home}
                                  sa={m.score_away}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                {attendanceText(m.attendance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {pastEuro.length > 0 && (
                  <div>
                    <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Evropa
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm tabular-nums">
                        <thead>
                          <tr className="text-xs uppercase text-muted-foreground">
                            <th className="px-4 py-2 text-left">Takmičenje</th>
                            <th className="px-4 py-2 text-left">Runda</th>
                            <th className="px-4 py-2 text-left">Protivnik</th>
                            <th className="px-4 py-2 text-center">Domaćin</th>
                            <th className="px-4 py-2 text-center">Gost</th>
                            <th className="px-4 py-2 text-center">Ukupno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastEuro.map((e) => {
                            const f = e.opponent_flag
                              ? e.opponent_flag.startsWith("http")
                                ? e.opponent_flag
                                : `https://flagcdn.com/w40/${e.opponent_flag.toLowerCase()}.png`
                              : "";
                            return (
                              <tr key={e.id} className="border-t border-border">
                                <td className="px-4 py-3">{EURO_TITLE[e.competition]}</td>
                                <td className="px-4 py-3">{e.round}</td>
                                <td className="px-4 py-3">
                                  <span className="flex items-center gap-2 font-medium">
                                    {f && (
                                      <img src={f} alt="" className="h-4 w-6 shrink-0 object-cover" />
                                    )}
                                    {e.opponent}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">{e.home || "—"}</td>
                                <td className="px-4 py-3 text-center">{e.away || "—"}</td>
                                <td className="px-4 py-3 text-center font-bold">{e.agg || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {data && data.trophies.length > 0 && (
        <section className="mt-10 rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Trofeji
          </h2>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.trophies.map((t) => (
              <div key={t.id} className="rounded-md border border-border p-4 text-center">
                {t.image && (
                  <img
                    src={t.image.startsWith("http") ? t.image : `${SUPA}${t.image}`}
                    alt=""
                    className="mx-auto h-24 object-contain"
                  />
                )}
                <p className="mt-3 font-display text-2xl font-bold">{t.times}×</p>
                <p className="text-sm font-semibold">{t.title}</p>
                {t.years && <p className="mt-1 text-xs text-muted-foreground">{t.years}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-bold uppercase">Sezone</h2>
          <div className="flex flex-wrap gap-2">
            {(["liga", "evropa", "kup", "ukupno"] as Comp[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setComp(c)}
                className={`rounded-md border px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide ${
                  comp === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {COMP_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {comp === "liga" ? (
          historyLoading ? (
            <TableSkeleton rows={6} cols={10} />
          ) : !history || history.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-3 text-left">Sezona</th>
                    <th className="px-3 py-3 text-center">Poz.</th>
                    <th className="px-3 py-3 text-right">Utakmica</th>
                    <th className="px-3 py-3 text-right">Pobjeda</th>
                    <th className="px-3 py-3 text-right">Neriješeno</th>
                    <th className="px-3 py-3 text-right">Poraza</th>
                    <th className="px-3 py-3 text-right">Golovi</th>
                    <th className="px-3 py-3 text-right">Primljeni</th>
                    <th className="px-3 py-3 text-right">Bodova</th>
                    <th className="px-3 py-3 text-right">Prosjek gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.season} className="border-t border-border">
                      <td className="px-3 py-3 font-semibold">
                        {r.current ? (
                          <span>
                            {r.season}{" "}
                            <span className="text-xs font-normal text-muted-foreground">(u toku)</span>
                          </span>
                        ) : (
                          <Link
                            to="/arhiva/$season/$club"
                            params={{ season: r.season, club: r.team }}
                            className="hover:underline"
                          >
                            {r.season}
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-primary">
                        {r.position ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-right">{r.played}</td>
                      <td className="px-3 py-3 text-right">{r.wins}</td>
                      <td className="px-3 py-3 text-right">{r.draws}</td>
                      <td className="px-3 py-3 text-right">{r.losses}</td>
                      <td className="px-3 py-3 text-right">{r.gf}</td>
                      <td className="px-3 py-3 text-right">{r.ga}</td>
                      <td className="px-3 py-3 text-right font-bold">{r.points}</td>
                      <td className="px-3 py-3 text-right">
                        {r.avg !== null ? r.avg.toLocaleString("de-DE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                    <td className="px-3 py-3 uppercase">Ukupno</td>
                    <td className="px-3 py-3 text-center">—</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.played)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.wins)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.draws)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.losses)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.gf)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.ga)}</td>
                    <td className="px-3 py-3 text-right">{sumLiga((r) => r.points)}</td>
                    <td className="px-3 py-3 text-right">
                      {ligaTotalAvg !== null ? ligaTotalAvg.toLocaleString("de-DE") : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : comp === "ukupno" ? (
          historyLoading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : totalRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-3 text-left">Sezona</th>
