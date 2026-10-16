import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getClubInfo } from "@/lib/clubinfo.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { getEuroMatches } from "@/lib/euromatches.functions";
import { normClub, sameClub } from "@/lib/club-match";
import { useCrest } from "@/lib/use-crest";
import { useClubCrest } from "@/lib/use-club-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

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
  comps: string[];
};

const ns = (s: string) => s.replace(/[–—]/g, "-").trim();

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function parseScore(score: string): [number, number] | null {
  const m = /^\s*(\d+)\s*[:\-–]\s*(\d+)/.exec(score ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function Klub() {
  const { name } = Route.useParams();
  const crestFor = useCrest();
  const clubCrest = useClubCrest();
  const [comp, setComp] = useState<Comp>("liga");

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

  // ---- Kup BiH po sezonama ----
  const kupRows: CompRow[] = (() => {
    const bySeason = new Map<string, CupMatch[]>();
    for (const m of cup ?? []) {
      if (!(sameClub(m.home, name) || sameClub(m.away, name))) continue;
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
          avg: att.length ? Math.round(att.reduce((s, x) => s + x, 0) / att.length) : null,
        };
      });
  })();

  // ---- Evropa po sezonama ----
  const euroRows: CompRow[] = (() => {
    const bySeason = new Map<string, NonNullable<typeof euro>>();
    for (const e of euro ?? []) {
      if (!sameClub(e.club, name)) continue;
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
        const sorted = [...es].sort((a, b) => a.sort_order - b.sort_order);
        for (const e of es) {
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
          avg: null,
        };
      });
  })();

  // ---- Ukupno: liga + kup + Evropa po sezonama ----
  const totalRows: TotalRow[] = (() => {
    const map = new Map<string, TotalRow>();
    const add = (
      season: string,
      r: { played: number; wins: number; draws: number; losses: number; gf: number; ga: number },
      label: string,
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
        comps: [],
      };
      t.played += r.played;
      t.wins += r.wins;
      t.draws += r.draws;
      t.losses += r.losses;
      t.gf += r.gf;
      t.ga += r.ga;
      if (!t.comps.includes(label)) t.comps.push(label);
      map.set(s, t);
    };
    for (const r of history ?? []) add(r.season, r, "Liga");
    for (const r of euroRows) add(r.season, r, "Evropa");
    for (const r of kupRows) add(r.season, r, "Kup BiH");
    return [...map.values()].sort((a, b) => b.season.localeCompare(a.season));
  })();

  const otherRows = comp === "kup" ? kupRows : euroRows;

  const sumLiga = (pick: (r: NonNullable<typeof history>[number]) => number) =>
    (history ?? []).reduce((s, r) => s + pick(r), 0);
  const ligaAvgs = (history ?? []).map((r) => r.avg).filter((a): a is number => a !== null);
  const ligaTotalAvg = ligaAvgs.length
    ? Math.round(ligaAvgs.reduce((s, a) => s + a, 0) / ligaAvgs.length)
    : null;

  const sumOther = (pick: (r: CompRow) => number) => otherRows.reduce((s, r) => s + pick(r), 0);
  const otherAvgs = otherRows.map((r) => r.avg).filter((a): a is number => a !== null);
  const otherTotalAvg = otherAvgs.length
    ? Math.round(otherAvgs.reduce((s, a) => s + a, 0) / otherAvgs.length)
    : null;

  const sumTotal = (pick: (r: TotalRow) => number) => totalRows.reduce((s, r) => s + pick(r), 0);

  const showAvg = comp !== "evropa";

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
        <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
          Utakmice
        </h2>
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : !data || data.matches.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Još nema utakmica.</p>
        ) : (
          <div className="overflow-x-auto">
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
                      <div className="flex items-center gap-3">
                        <span className="flex flex-1 items-center justify-end gap-2 text-right font-medium">
                          {m.home}
                          <Badge club={m.home} />
                        </span>
                        <span className="min-w-14 text-center font-bold">
                          {m.score_home !== null && m.score_away !== null
                            ? `${m.score_home}:${m.score_away}`
                            : "–"}
                        </span>
                        <span className="flex flex-1 items-center gap-2 font-medium">
                          <Badge club={m.away} />
                          {m.away}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.attendance > 0
                        ? m.attendance.toLocaleString("de-DE")
                        : m.attendance < 0
                          ? "x"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <th className="px-3 py-3 text-left">Takmičenja</th>
                    <th className="px-3 py-3 text-right">Utakmica</th>
                    <th className="px-3 py-3 text-right">Pobjeda</th>
                    <th className="px-3 py-3 text-right">Neriješeno</th>
                    <th className="px-3 py-3 text-right">Poraza</th>
                    <th className="px-3 py-3 text-right">Golovi</th>
                    <th className="px-3 py-3 text-right">Primljeni</th>
                  </tr>
                </thead>
                <tbody>
                  {totalRows.map((r) => (
                    <tr key={r.season} className="border-t border-border">
                      <td className="px-3 py-3 font-semibold">{r.season}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {r.comps.join(" · ")}
                      </td>
                      <td className="px-3 py-3 text-right">{r.played}</td>
                      <td className="px-3 py-3 text-right">{r.wins}</td>
                      <td className="px-3 py-3 text-right">{r.draws}</td>
                      <td className="px-3 py-3 text-right">{r.losses}</td>
                      <td className="px-3 py-3 text-right">{r.gf}</td>
                      <td className="px-3 py-3 text-right">{r.ga}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                    <td className="px-3 py-3 uppercase">Ukupno</td>
                    <td className="px-3 py-3">—</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.played)}</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.wins)}</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.draws)}</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.losses)}</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.gf)}</td>
                    <td className="px-3 py-3 text-right">{sumTotal((r) => r.ga)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : otherRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Za ovo takmičenje još nema podataka za ovaj klub.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-3 text-left">Sezona</th>
                  <th className="px-3 py-3 text-left">Najdalje</th>
                  <th className="px-3 py-3 text-right">Utakmica</th>
                  <th className="px-3 py-3 text-right">Pobjeda</th>
                  <th className="px-3 py-3 text-right">Neriješeno</th>
                  <th className="px-3 py-3 text-right">Poraza</th>
                  <th className="px-3 py-3 text-right">Golovi</th>
                  <th className="px-3 py-3 text-right">Primljeni</th>
                  {showAvg && <th className="px-3 py-3 text-right">Prosjek gledalaca</th>}
                </tr>
              </thead>
              <tbody>
                {otherRows.map((r) => (
                  <tr key={r.season} className="border-t border-border">
                    <td className="px-3 py-3 font-semibold">{r.season}</td>
                    <td className="px-3 py-3 font-semibold text-primary">{r.stage}</td>
                    <td className="px-3 py-3 text-right">{r.played}</td>
                    <td className="px-3 py-3 text-right">{r.wins}</td>
                    <td className="px-3 py-3 text-right">{r.draws}</td>
                    <td className="px-3 py-3 text-right">{r.losses}</td>
                    <td className="px-3 py-3 text-right">{r.gf}</td>
                    <td className="px-3 py-3 text-right">{r.ga}</td>
                    {showAvg && (
                      <td className="px-3 py-3 text-right">
                        {r.avg !== null ? r.avg.toLocaleString("de-DE") : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                  <td className="px-3 py-3 uppercase">Ukupno</td>
                  <td className="px-3 py-3">—</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.played)}</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.wins)}</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.draws)}</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.losses)}</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.gf)}</td>
                  <td className="px-3 py-3 text-right">{sumOther((r) => r.ga)}</td>
                  {showAvg && (
                    <td className="px-3 py-3 text-right">
                      {otherTotalAvg !== null ? otherTotalAvg.toLocaleString("de-DE") : "—"}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {data && data.achievements.length > 0 && (
        <section className="mt-10 rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Uspjesi
          </h2>
          <ul className="space-y-2 p-4 text-sm">
            {data.achievements.map((a) => (
              <li key={a.id} className="border-b border-border pb-2 last:border-0">
                {a.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
