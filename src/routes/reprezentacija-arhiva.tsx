import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalMatches, type NationalMatch } from "@/lib/nationalmatches.functions";

export const Route = createFileRoute("/reprezentacija-arhiva")({
  head: () => ({
    meta: [
      { title: "Arhiva utakmica reprezentacije — Korner BiH" },
      { name: "description", content: "Sve utakmice reprezentacije Bosne i Hercegovine od 1995. godine." },
    ],
  }),
  component: ArhivaReprezentacije,
});

const ALL = "sve";

const isBih = (name: string) => /bosna|bih/i.test(name);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function flagSrc(flag: string): string {
  if (!flag) return "";
  return flag.startsWith("http") ? flag : `https://flagcdn.com/w40/${flag.toLowerCase()}.png`;
}

function Team({ name, flag, align }: { name: string; flag: string; align: "left" | "right" }) {
  const src = flagSrc(flag);
  const img = src ? <img src={src} alt="" className="h-4 w-6 shrink-0 object-cover" /> : null;
  return (
    <span
      className={`flex flex-1 items-center gap-2 font-medium ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "right" ? (
        <>
          {name}
          {img}
        </>
      ) : (
        <>
          {img}
          {name}
        </>
      )}
    </span>
  );
}

type Stat = { played: number; w: number; d: number; l: number; gf: number; ga: number };

function emptyStat(): Stat {
  return { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
}

function addMatch(s: Stat, m: NationalMatch) {
  if (m.score_home === null || m.score_away === null) return;
  const bihHome = isBih(m.home);
  const a = bihHome ? m.score_home : m.score_away;
  const b = bihHome ? m.score_away : m.score_home;
  s.played++;
  s.gf += a;
  s.ga += b;
  if (a > b) s.w++;
  else if (a === b) s.d++;
  else s.l++;
}

function ArhivaReprezentacije() {
  const { data, isLoading } = useQuery({
    queryKey: ["national-matches"],
    queryFn: () => getNationalMatches(),
  });
  const rows = data ?? [];

  const [pick, setPick] = useState("");

  const years = useMemo(
    () => [...new Set(rows.map((m) => m.match_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [rows],
  );

  const perYear = useMemo(() => {
    const map = new Map<string, Stat>();
    for (const m of rows) {
      const y = m.match_date.slice(0, 4);
      const s = map.get(y) ?? emptyStat();
      addMatch(s, m);
      map.set(y, s);
    }
    return map;
  }, [rows]);

  const total = useMemo(() => {
    const s = emptyStat();
    for (const m of rows) addMatch(s, m);
    return s;
  }, [rows]);

  const year = pick === ALL || years.includes(pick) ? pick : years[0] || "";
  const list = (year === ALL ? rows : rows.filter((m) => m.match_date.startsWith(year))).slice();
  // Sve godine: najnovije prvo. Jedna godina: po datumu od početka godine.
  if (year === ALL) list.sort((a, b) => b.match_date.localeCompare(a.match_date));
  else list.sort((a, b) => a.match_date.localeCompare(b.match_date));

  const yearStat = useMemo(() => {
    const s = emptyStat();
    for (const m of list) addMatch(s, m);
    return s;
  }, [list]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reprezentacija</p>
      <h1 className="font-display text-3xl font-bold uppercase">Arhiva utakmica</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Sve utakmice A reprezentacije Bosne i Hercegovine, od 1995. godine do danas.
      </p>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={3} />
        </div>
      ) : rows.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-muted-foreground">Još nema podataka.</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Utakmica", total.played],
              ["Pobjeda", total.w],
              ["Neriješeno", total.d],
              ["Poraza", total.l],
              ["Golovi", `${total.gf}:${total.ga}`],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
              Pregled po godinama
            </h2>
            <div className="max-h-72 overflow-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left">Godina</th>
                    <th className="px-3 py-2 text-right">Ut.</th>
                    <th className="px-3 py-2 text-right">P</th>
                    <th className="px-3 py-2 text-right">N</th>
                    <th className="px-3 py-2 text-right">I</th>
                    <th className="px-3 py-2 text-right">Golovi</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const s = perYear.get(y) ?? emptyStat();
                    return (
                      <tr
                        key={y}
                        onClick={() => setPick(y)}
                        className={`cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/40 ${
                          year === y ? "bg-primary/10 font-semibold" : ""
                        }`}
                      >
                        <td className="px-4 py-2">{y}</td>
                        <td className="px-3 py-2 text-right">{s.played}</td>
                        <td className="px-3 py-2 text-right">{s.w}</td>
                        <td className="px-3 py-2 text-right">{s.d}</td>
                        <td className="px-3 py-2 text-right">{s.l}</td>
                        <td className="px-3 py-2 text-right">
                          {s.gf}:{s.ga}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-display text-lg font-bold uppercase">
                {year === ALL ? "Sve utakmice" : `Utakmice ${year}.`}
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="godina-arhiva" className="text-xs font-semibold uppercase text-muted-foreground">
                  Godina
                </label>
                <select
                  id="godina-arhiva"
                  value={year}
                  onChange={(e) => setPick(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
                >
                  <option value={ALL}>Sve godine</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm tabular-nums">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left">Datum</th>
                    <th className="px-4 py-2 text-center">Utakmica</th>
                    <th className="px-4 py-2 text-right">Gledalaca</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Team name={m.home} flag={m.home_flag} align="right" />
                          <span className="min-w-14 text-center font-bold">
                            {m.score_home !== null && m.score_away !== null
                              ? `${m.score_home}:${m.score_away}`
                              : "–"}
                          </span>
                          <Team name={m.away} flag={m.away_flag} align="left" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.attendance > 0 ? m.attendance.toLocaleString("de-DE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {list.length} utakmica · {yearStat.w} pobjeda · {yearStat.d} neriješeno · {yearStat.l} poraza · golovi{" "}
              {yearStat.gf}:{yearStat.ga}
            </p>
          </section>
        </>
      )}
    </main>
  );
}
