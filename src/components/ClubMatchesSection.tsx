import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getCupMatches } from "@/lib/cupmatches.functions";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";
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

function attendanceText(n: number): string {
  return n > 0 ? n.toLocaleString("de-DE") : n < 0 ? "x" : "—";
}

export function ClubMatchesSection({ name }: { name: string }) {
  const crestFor = useCrest();
  const clubCrest = useClubCrest();
  const [season, setSeason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["club-detail", name],
    queryFn: () => getClubDetail({ data: { name } }),
  });
  const { data: history } = useQuery({
    queryKey: ["club-history", name],
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

  const past = season !== "" && season !== CURRENT_SEASON;
  const { data: seasonLeague, isLoading: leagueLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
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
  const pastCup = clubCup
    .filter((m) => ns(m.season) === season)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const pastEuro = clubEuro
    .filter((e) => ns(e.season) === season)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
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

      {season === CURRENT_SEASON &&
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
                      <MatchCell home={m.home} away={m.away} sh={m.score_home} sa={m.score_away} />
                    </td>
                    <td className="px-4 py-3 text-right">{attendanceText(m.attendance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {past && (
        <div className="border-t border-border">
          {leagueLoading ? (
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
                            <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
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
                            <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
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
                          const f = flagUrl(e.opponent_flag);
                          return (
                            <tr key={e.id} className="border-t border-border">
                              <td className="px-4 py-3">{EURO_TITLE[e.competition]}</td>
                              <td className="px-4 py-3">{e.round}</td>
                              <td className="px-4 py-3">
                                <span className="flex items-center gap-2 font-medium">
                                  {f && <img src={f} alt="" className="h-4 w-6 shrink-0 object-cover" />}
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
  );
}
