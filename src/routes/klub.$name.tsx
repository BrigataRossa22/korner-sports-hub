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
    ?
