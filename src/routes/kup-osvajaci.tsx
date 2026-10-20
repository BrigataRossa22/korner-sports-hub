import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { sameClub } from "@/lib/club-match";
import { getCupGoals, type CupGoal } from "@/lib/cupgoals.functions";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/kup-osvajaci")({
  head: () => ({
    meta: [{ title: "Osvajači Kupa BiH — Korner BiH" }],
  }),
  component: Osvajaci,
});

const FINAL_ROUNDS = ["Finale", "Superfinale"];

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

/** Pobjednik dvomeča ili jednomeča: ukupan rezultat, pa penali, pa gostujući golovi. */
function decide(legs: CupMatch[]): string | null {
  const names: string[] = [];
  for (const m of legs) {
    for (const n of [m.home, m.away]) {
      if (!names.some((x) => sameClub(x, n))) names.push(n);
    }
  }
  if (names.length !== 2) return null;
  const [a, b] = names as [string, string];
  let ga = 0,
    gb = 0,
    pa = 0,
    pb = 0,
    awayA = 0,
    awayB = 0;
  for (const m of legs) {
    if (m.score_home === null || m.score_away === null) return null;
    const aHome = sameClub(m.home, a);
    const sa = aHome ? m.score_home : m.score_away;
    const sb = aHome ? m.score_away : m.score_home;
    ga += sa;
    gb += sb;
    if (aHome) awayB += sb;
    else awayA += sa;
    if (m.pen_home != null && m.pen_away != null) {
      pa += aHome ? m.pen_home : m.pen_away;
      pb += aHome ? m.pen_away : m.pen_home;
    }
  }
  if (ga !== gb) return ga > gb ? a : b;
  if (pa !== pb) return pa > pb ? a : b;
  if (legs.length === 2 && awayA !== awayB) return awayA > awayB ? a : b;
  return null;
}

type Stage = { round: string; title: string; legs: CupMatch[] };
type SeasonFinal = { season: string; stages: Stage[]; winner: string | null };

function Osvajaci() {
  const crestFor = useClubCrest();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["cup-goals"],
    queryFn: () => getCupGoals(),
  });
  const goals = goalsData ?? [];

  const finals: SeasonFinal[] = useMemo(() => {
    const bySeason = new Map<string, CupMatch[]>();
    for (const m of matches ?? []) {
      if (!FINAL_ROUNDS.includes(m.round)) continue;
      bySeason.set(m.season,
