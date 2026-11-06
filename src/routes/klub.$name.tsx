import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { ClubMatchesSection } from "@/components/ClubMatchesSection";
import { ClubPrvaLiga } from "@/components/ClubPrvaLiga";
import { ClubTopScorers } from "@/components/ClubTopScorers";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getClubInfo } from "@/lib/clubinfo.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { getEuroMatches } from "@/lib/euromatches.functions";
import { displayClub, sameClub } from "@/lib/club-match";
import { useCrest } from "@/lib/use-crest";
import { useClubCrest } from "@/lib/use-club-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

export const Route = createFileRoute("/klub/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${displayClub(params.name)} — Korner BiH` },
      { name: "description", content: `${displayClub(params.name)}: utakmice, trofeji i uspjesi.` },
    ],
  }),
  errorComponent: LoadError,
  component: Klub,
});

type HonourGroup = { title: string; items: { label: string; value: string }[] };

// Tekst iz kolone "honours": red bez dvotačke je naslov takmičenja, red s dvotačkom je uspjeh
// ("Pobjednik (2): 2005-06, 2018-19"). Prazni redovi se preskaču.
function parseHonours(text: string | null | undefined): HonourGroup[] {
  const groups: HonourGroup[] = [];
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i === -1) {
      groups.push({ title: line, items: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ title: "Uspjesi", items: [] });
    groups[groups.length - 1]!.items.push({
      label: line.slice(0, i).trim(),
      value: line.slice(i + 1).trim(),
    });
  }
  return groups.filter((g) => g.items.length > 0);
}

type Comp = "liga" | "kup" | "evropa" | "prva";

const COMP_LABEL: Record<Comp, string> = {
  liga: "WWIN liga",
  kup: "Kup BiH",
  evropa: "Evropa",
  prva: "Prva liga BiH",
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
  attSum: number;
  attCount: number;
};

const ns = (s: string) => s.replace(/[–—]/g, "-").trim();

function parseScore(score: string): [number, number] | null {
  const m = /^\s*(\d+)\s*[:\-–]\s*(\d+)/.exec(score ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

// Prosjek = zbir gledalaca / broj utakmica
function wavg(sum: number, count: number): number | null {
  return count > 0 ? Math.round(sum / count) : null;
}

const fmtAvg = (n: number | null) => (n !== null ? n.toLocaleString("de-DE") : "—");

type MobileRow = {
  season: string;
  sub?: string;
  played: number;
  w: number;
  d: number;
  l: number;
  avg: number | null;
};

function Klub() {
  const { name } = Route.useParams();
  const crestFor = useCrest();
  const clubCrest = useClubCrest();
  const [comp, setComp] = useState<Comp>("liga");
  const [matchSeason, setMatchSeason] = useState("");
  // Telefon: Uspjesi / Trofeji / Najbolji strijelci jedan ispod drugog, otvara se onaj koji izabereš
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);

  // Klik na sezonu u tabeli: izaberi sezonu u dijelu "Utakmice" i klizi do njega
  const openSeason = (s: string) => {
    setMatchSeason(ns(s));
    setTimeout(() => {
      document.getElementById("utakmice")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const SeasonButton = ({ season, note }: { season: string; note?: string }) => (
    <button
      type="button"
      onClick={() => openSeason(season)}
      title="Prikaži sve utakmice ove sezone"
      className="text-left font-semibold text-primary hover:underline"
    >
      {season}
      {note && <span className="ml-1 text-xs font-normal text-muted-foreground">{note}</span>}
    </button>
  );

  // Kompaktna tabela za mobitel (kao "Pregled po godinama"): sezona, Ut., P, N, I, prosjek
  const MobileSeasonTable = ({ rows }: { rows: MobileRow[] }) => (
    <div className="max-h-80 overflow-auto sm:hidden">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-xs uppercase text-muted-foreground">
            <th className="px-3 py-2 text-left">Sezona</th>
            <th className="px-1.5 py-2 text-right">Ut.</th>
            <th className="px-1.5 py-2 text-right">P</th>
            <th className="px-1.5 py-2 text-right">N</th>
            <th className="px-1.5 py-2 text-right">I</th>
            <th className="px-3 py-2 text-right">Prosjek</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const selected = matchSeason !== "" && ns(r.season) === matchSeason;
            return (
              <tr
                key={r.season}
                onClick={() => openSeason(r.season)}
                className={`cursor-pointer border-b border-border/70 last:border-0 ${
                  selected ? "bg-primary/10 font-semibold" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <span className="text-primary">{r.season}</span>
                  {r.sub && (
                    <span className="block text-[10px] font-normal leading-tight text-muted-foreground">
                      {r.sub}
                    </span>
                  )}
                </td>
                <td className="px-1.5 py-2.5 text-right">{r.played}</td>
                <td className="px-1.5 py-2.5 text-right">{r.w}</td>
                <td className="px-1.5 py-2.5 text-right">{r.d}</td>
                <td className="px-1.5 py-2.5 text-right">{r.l}</td>
                <td className="px-3 py-2.5 text-right">{fmtAvg(r.avg)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const { data } = useQuery({
    queryKey: ["club-detail", name],
    queryFn: () => getClubDetail({ data: { name } }),
  });
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["club-history-v2", name],
    queryFn: () => getClubHistory({ data: { name } }),
  });
  const { data: info } = useQuery({
    queryKey: ["club-info", name],
    queryFn: () => getClubInfo({ data: { name } }),
  });
  const honours = parseHonours(info?.honours);
  const { data: euro } = useQuery({
    queryKey: ["euro-matches"],
    queryFn: () => getEuroMatches(),
  });
  const { data: cup } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });

  const crest = clubCrest(name) || crestFor(name);

  // Godina osnivanja (samo godina), slika stadiona u pozadini, podaci za klub u aktuelnoj ligi
  const foundedYear = info?.founded
    ? (/\b(\d{4})\b/.exec(info.founded)?.[1] ?? info.founded)
    : "";
  const cover = (info?.cover ?? "").trim();
  const coverUrl = cover ? (cover.startsWith("http") ? cover : `${SUPA}${cover}`) : "";
  const currentRow = (history ?? []).find((r) => r.current);

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
        // Finale koje se igra jednom je na neutralnom terenu: ne ulazi u prosjek gledalaca
        const finalCount = ms.filter((x) => x.round === "Finale").length;
        // Penali u finalu (odlučuju pobjednika kad je ukupan rezultat izjednačen)
        let finalPf = 0,
          finalPa = 0;
        let attSum = 0,
          attCount = 0;
        for (const m of ms) {
          const isHome = sameClub(m.home, name);
          const idx = CUP_ORDER.indexOf(m.round);
          if (idx > best) best = idx;
          const neutralFinal = m.round === "Finale" && finalCount === 1;
          if (isHome && !neutralFinal && m.attendance > 0) {
            attSum += m.attendance;
            attCount++;
          }
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
            if (m.pen_home != null && m.pen_away != null) {
              finalPf += isHome ? m.pen_home : m.pen_away;
              finalPa += isHome ? m.pen_away : m.pen_home;
            }
          }
        }
        const lastRound = best >= 0 ? CUP_ORDER[best]! : (ms[0]?.round ?? "—");
        let stage = CUP_TITLE[lastRound] ?? lastRound;
        if (lastRound === "Finale" && hasFinal) {
          stage =
            finalGf > finalGa || (finalGf === finalGa && finalPf > finalPa)
              ? "Pobjednik"
              : "Finalista";
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
          avg: wavg(attSum, attCount),
          attSum,
          attCount,
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
        let attSum = 0,
          attCount = 0;
        const sorted = [...es].sort((a, b) => a.sort_order - b.sort_order);
        for (const e of es) {
          if ((e.attendance ?? 0) > 0) {
            attSum += e.attendance;
            attCount++;
          }
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
          avg: wavg(attSum, attCount),
          attSum,
          attCount,
        };
      });
  })();

  const otherRows = comp === "kup" ? kupRows : euroRows;
  const showStage = comp === "kup";

  const sumLiga = (pick: (r: NonNullable<typeof history>[number]) => number) =>
    (history ?? []).reduce((s, r) => s + pick(r), 0);
  const ligaTotalAvg = wavg(
    sumLiga((r) => r.attSum),
    sumLiga((r) => r.attCount),
  );

  const sumOther = (pick: (r: CompRow) => number) => otherRows.reduce((s, r) => s + pick(r), 0);
  const otherTotalAvg = wavg(
    sumOther((r) => r.attSum),
    sumOther((r) => r.attCount),
  );

  // ---- Telefon: stavke menija (Uspjesi, Trofeji, Najbolji strijelci) ----
  const mobileItems: { id: string; label: string; body: ReactNode }[] = [];
  if (honours.length > 0) {
    mobileItems.push({
      id: "uspjesi",
      label: "Uspjesi",
      body: (
        <div className="grid gap-y-5 p-4">
          {honours.map((g) => (
            <div key={g.title}>
              <h3 className="font-display text-base font-bold">{g.title}</h3>
              <ul className="mt-2 space-y-1.5 border-l-2 border-primary/40 pl-3 text-sm">
                {g.items.map((it, i) => (
                  <li key={i}>
                    {it.label && <span className="font-semibold">{it.label}</span>}
                    {it.label && it.value ? ": " : ""}
                    <span className="text-muted-foreground">{it.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    });
  } else if (data && data.achievements.length > 0) {
    mobileItems.push({
      id: "uspjesi",
      label: "Uspjesi",
      body: (
        <ul className="space-y-2 p-4 text-sm">
          {data.achievements.map((a) => (
            <li key={a.id} className="border-b border-border pb-2 last:border-0">
              {a.text}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (data && data.trophies.length > 0) {
    mobileItems.push({
      id: "trofeji",
      label: "Trofeji",
      body: (
        <div className="grid gap-2 p-3">
          {data.trophies.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md border border-border p-2.5"
            >
              {t.image && (
                <img
                  src={t.image.startsWith("http") ? t.image : `${SUPA}${t.image}`}
                  alt=""
                  className="h-12 w-10 shrink-0 object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-tight">{t.times}×</p>
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.years && <p className="mt-0.5 text-xs text-muted-foreground">{t.years}</p>}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }
  mobileItems.push({
    id: "strijelci",
    label: "Najbolji strijelci",
    body: (
      <div className="[&>section]:mt-0 [&>section]:rounded-none [&>section]:border-0">
        <ClubTopScorers name={name} />
      </div>
    ),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/klubovi" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na klubove
      </Link>

      {/* ---- Naslovni dio kluba: grb, ime, godina osnivanja | stadion, slika stadiona u pozadini ---- */}
      <section className="relative mb-8 mt-3 overflow-hidden rounded-2xl bg-ink text-white">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="eager"
          />
        )}
        <div
          className={`absolute inset-0 ${
            coverUrl
              ? "bg-gradient-to-r from-black/85 via-black/60 to-black/30"
              : "bg-gradient-to-br from-primary/40 via-ink to-ink"
          }`}
        />
        <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5 sm:gap-8">
            {crest && (
              <img
                src={crest}
                alt=""
                className="size-24 shrink-0 object-contain drop-shadow-lg sm:size-36"
              />
            )}
            <div className="min-w-0">
              {(foundedYear || info?.stadium) && (
                <p className="text-sm text-white/80 sm:text-base">
                  {foundedYear}
                  {foundedYear && info?.stadium ? (
                    <span className="mx-2 inline-block h-3.5 w-px bg-white/50 align-middle" />
                  ) : null}
                  {info?.stadium}
                </p>
              )}
              <h1 className="mt-1 font-display text-3xl font-bold uppercase leading-tight sm:text-5xl">
                {displayClub(name)}
              </h1>
              <p className="mt-2 hidden text-xs uppercase tracking-[0.15em] text-white/60 sm:block">
                Klub · sezona 2026/27
              </p>
            </div>
          </div>

          {currentRow && (
            <dl className="hidden w-full shrink-0 divide-y divide-white/20 rounded-xl border border-white/20 bg-white/10 px-4 backdrop-blur-md sm:block lg:w-72">
              {[
                ["Trenutna pozicija", currentRow.position ?? "—"],
                ["Odigrano utakmica", currentRow.played],
                ["Pobjeda", currentRow.wins],
                ["Postignuto golova", currentRow.gf],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-white/85">
                    {label}
                  </dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ---- Telefon: Uspjesi, Trofeji i Najbolji strijelci jedan ispod drugog ---- */}
      <div className="mb-8 space-y-2 sm:hidden">
        {mobileItems.map((it) => {
          const isOpen = mobileOpen === it.id;
          return (
            <div key={it.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setMobileOpen(isOpen ? null : it.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 font-display text-base font-bold uppercase"
              >
                {it.label}
                <ChevronDown
                  className={`size-5 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && <div className="border-t border-border">{it.body}</div>}
            </div>
          );
        })}
      </div>

      {honours.length > 0 && (
        <section className="mb-8 hidden rounded-lg border border-border bg-card sm:block">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Uspjesi
          </h2>
          <div className="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
            {honours.map((g) => (
              <div key={g.title}>
                <h3 className="font-display text-base font-bold">{g.title}</h3>
                <ul className="mt-2 space-y-1.5 border-l-2 border-primary/40 pl-3 text-sm">
                  {g.items.map((it, i) => (
                    <li key={i}>
                      {it.label && <span className="font-semibold">{it.label}</span>}
                      {it.label && it.value ? ": " : ""}
                      <span className="text-muted-foreground">{it.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data && data.trophies.length > 0 && (
        <section className="hidden rounded-lg border border-border bg-card sm:block">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Trofeji
          </h2>
          <div className="grid gap-2 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-4">
            {data.trophies.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-md border border-border p-2.5 sm:block sm:p-4 sm:text-center"
              >
                {t.image && (
                  <img
                    src={t.image.startsWith("http") ? t.image : `${SUPA}${t.image}`}
                    alt=""
                    className="h-12 w-10 shrink-0 object-contain sm:mx-auto sm:h-24 sm:w-auto"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-tight sm:mt-3 sm:text-2xl">
                    {t.times}×
                  </p>
                  <p className="text-sm font-semibold leading-tight">{t.title}</p>
                  {t.years && (
                    <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">{t.years}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-bold uppercase">Sezone</h2>
          <div className="flex flex-wrap gap-2">
            {(["liga", "kup", "evropa", "prva"] as Comp[]).map((c) => (
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
            <>
              {/* ---- Mobitel: kompaktna tabela, klik otvara utakmice ispod ---- */}
              <MobileSeasonTable
                rows={history.map((r) => ({
                  season: r.season,
                  sub: [
                    r.position ? `${r.position}. mjesto` : "",
                    r.current ? "u toku" : "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  played: r.played,
                  w: r.wins,
                  d: r.draws,
                  l: r.losses,
                  avg: r.avg,
                }))}
              />

              {/* ---- Računar: tabela kao do sada ---- */}
              <div className="hidden overflow-x-auto sm:block">
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
                        <td className="px-3 py-3">
                          <SeasonButton season={r.season} note={r.current ? "(u toku)" : undefined} />
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
                        <td className="px-3 py-3 text-right">{fmtAvg(r.avg)}</td>
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
                      <td className="px-3 py-3 text-right">{fmtAvg(ligaTotalAvg)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )
        ) : comp === "prva" ? (
          <ClubPrvaLiga name={name} />
        ) : otherRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Za ovo takmičenje još nema podataka za ovaj klub.
          </p>
        ) : (
          <>
            {/* ---- Mobitel: kompaktna tabela, klik otvara utakmice ispod ---- */}
            <MobileSeasonTable
              rows={otherRows.map((r) => ({
                season: r.season,
                sub: showStage ? r.stage : undefined,
                played: r.played,
                w: r.wins,
                d: r.draws,
                l: r.losses,
                avg: r.avg,
              }))}
            />

            {/* ---- Računar: tabela kao do sada ---- */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-3 text-left">Sezona</th>
                    {showStage && <th className="px-3 py-3 text-left">Najdalje</th>}
                    <th className="px-3 py-3 text-right">Utakmica</th>
                    <th className="px-3 py-3 text-right">Pobjeda</th>
                    <th className="px-3 py-3 text-right">Neriješeno</th>
                    <th className="px-3 py-3 text-right">Poraza</th>
                    <th className="px-3 py-3 text-right">Golovi</th>
                    <th className="px-3 py-3 text-right">Primljeni</th>
                    <th className="px-3 py-3 text-right">Prosjek gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {otherRows.map((r) => (
                    <tr key={r.season} className="border-t border-border">
                      <td className="px-3 py-3">
                        <SeasonButton season={r.season} />
                      </td>
                      {showStage && (
                        <td className="px-3 py-3 font-semibold text-primary">{r.stage}</td>
                      )}
                      <td className="px-3 py-3 text-right">{r.played}</td>
                      <td className="px-3 py-3 text-right">{r.wins}</td>
                      <td className="px-3 py-3 text-right">{r.draws}</td>
                      <td className="px-3 py-3 text-right">{r.losses}</td>
                      <td className="px-3 py-3 text-right">{r.gf}</td>
                      <td className="px-3 py-3 text-right">{r.ga}</td>
                      <td className="px-3 py-3 text-right">{fmtAvg(r.avg)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                    <td className="px-3 py-3 uppercase">Ukupno</td>
                    {showStage && <td className="px-3 py-3">—</td>}
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.played)}</td>
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.wins)}</td>
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.draws)}</td>
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.losses)}</td>
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.gf)}</td>
                    <td className="px-3 py-3 text-right">{sumOther((r) => r.ga)}</td>
                    <td className="px-3 py-3 text-right">{fmtAvg(otherTotalAvg)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Klikni na sezonu da vidiš sve utakmice te sezone ispod.
        </p>
      </section>

      <div className="hidden sm:block">
        <ClubTopScorers name={name} />
      </div>

      <div className="mt-10">
        <ClubMatchesSection name={name} season={matchSeason} onSeasonChange={setMatchSeason} />
      </div>

      {honours.length === 0 && data && data.achievements.length > 0 && (
        <section className="mt-10 hidden rounded-lg border border-border bg-card sm:block">
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
