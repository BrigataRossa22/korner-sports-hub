import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { ROUNDS, RoundTable } from "@/components/CupMatches";
import { sameClub } from "@/lib/club-match";
import { getClubHistory } from "@/lib/clubhistory.functions";
import { getCupGoals } from "@/lib/cupgoals.functions";
import { getCupMatches } from "@/lib/cupmatches.functions";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

type Tab = "liga" | "kup" | "evropa";

const TAB_LABEL: Record<Tab, string> = {
  liga: "Liga",
  kup: "Kup BiH",
  evropa: "Evropa",
};

const COMPETITIONS: { key: EuroMatch["competition"]; title: string }[] = [
  { key: "LP", title: "Liga prvaka" },
  { key: "LE", title: "Liga Evrope" },
  { key: "KL", title: "Konferencijska liga" },
  { key: "KPK", title: "Kup pobjednika kupova" },
];

const ns = (s: string) => s.replace(/[–—]/g, "-").trim();

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function flagSrc(flag: string): string {
  if (!flag) return "";
  return flag.startsWith("http") ? flag : `https://flagcdn.com/w40/${flag.toLowerCase()}.png`;
}

export function ClubSeasons({ name }: { name: string }) {
  const crestFor = useClubCrest();
  const [season, setSeason] = useState("");
  const [tab, setTab] = useState<Tab | "">("");

  const { data: history } = useQuery({
    queryKey: ["club-history", name],
    queryFn: () => getClubHistory({ data: { name } }),
  });
  const { data: cup, isLoading: cupLoading } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });
  const { data: cupGoals } = useQuery({
    queryKey: ["cup-goals"],
    queryFn: () => getCupGoals(),
  });
  const { data: euro, isLoading: euroLoading } = useQuery({
    queryKey: ["euro-matches"],
    queryFn: () => getEuroMatches(),
  });

  const clubCup = (cup ?? []).filter((m) => sameClub(m.home, name) || sameClub(m.away, name));
  const clubEuro = (euro ?? []).filter((e) => sameClub(e.club, name));

  const seasonSet = new Set<string>();
  for (const r of history ?? []) if (!r.current) seasonSet.add(ns(r.season));
  for (const m of clubCup) seasonSet.add(ns(m.season));
  for (const e of clubEuro) seasonSet.add(ns(e.season));
  const seasons = [...seasonSet].sort((a, b) => b.localeCompare(a));

  const cur = seasons.includes(season) ? season : (seasons[0] ?? "");

  const { data: leagueAll } = useQuery({
    queryKey: ["season-matches", cur],
    queryFn: () => getSeasonMatches({ data: { season: cur } }),
    enabled: cur !== "",
  });

  const leagueRows = (leagueAll ?? []).filter(
    (m) => sameClub(m.home, name) || sameClub(m.away, name),
  );
  const cupRows = clubCup.filter((m) => ns(m.season) === cur);
  const euroRows = clubEuro
    .filter((e) => ns(e.season) === cur)
    .sort((a, b) => a.sort_order - b.sort_order);

  const available: Tab[] = [];
  if (leagueRows.length > 0) available.push("liga");
  if (cupRows.length > 0) available.push("kup");
  if (euroRows.length > 0) available.push("evropa");
  const active: Tab | "" = tab !== "" && available.includes(tab) ? tab : (available[0] ?? "");

  if (cupLoading || euroLoading) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card">
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  if (seasons.length === 0) return null;

  const known = new Set(ROUNDS.map((r) => r.key));
  const extraRounds = [...new Set(cupRows.map((m) => m.round).filter((r) => !known.has(r)))];
  const cupOrder = [...ROUNDS, ...extraRounds.map((r) => ({ key: r, title: r }))];

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-6 shrink-0 object-contain" />
    ) : (
      <span className="size-6 shrink-0" />
    );
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">Takmičenja po sezonama</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="klub-sezona" className="text-xs font-semibold uppercase text-muted-foreground">
            Sezona
          </label>
          <select
            id="klub-sezona"
            value={cur}
            onChange={(e) => setSeason(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {available.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Za ovu sezonu još nema unesenih utakmica.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {available.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md border px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wide ${
                  active === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          {active === "liga" && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
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
                  {leagueRows.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-4 py-3">{m.round ?? "—"}</td>
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

          {active === "kup" &&
            cupOrder.map(({ key, title }) => {
              const list = cupRows.filter((m) => m.round === key);
              return list.length ? (
                <RoundTable key={key} title={title} rows={list} goals={cupGoals ?? []} />
              ) : null;
            })}

          {active === "evropa" &&
            COMPETITIONS.map(({ key, title }) => {
              const list = euroRows.filter((e) => e.competition === key);
              if (list.length === 0) return null;
              return (
                <section key={key} className="mt-4 rounded-lg border border-border bg-card">
                  <h3 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
                    {title}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-sm tabular-nums">
                      <thead>
                        <tr className="text-xs uppercase text-muted-foreground">
                          <th className="px-4 py-2 text-left">Runda</th>
                          <th className="px-4 py-2 text-left">Protivnik</th>
                          <th className="px-4 py-2 text-center">Domaćin</th>
                          <th className="px-4 py-2 text-center">Gost</th>
                          <th className="px-4 py-2 text-center">Ukupno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((e) => {
                          const flag = flagSrc(e.opponent_flag);
                          return (
                            <tr key={e.id} className="border-t border-border">
                              <td className="px-4 py-3">{e.round}</td>
                              <td className="px-4 py-3">
                                <span className="flex items-center gap-2 font-medium">
                                  {flag && (
                                    <img src={flag} alt="" className="h-4 w-6 shrink-0 object-cover" />
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
                </section>
              );
            })}
        </>
      )}
    </section>
  );
}
