import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getCupMatches, type CupMatch } from "@/lib/cupmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

const KEY = "kup-sezona";

const ROUNDS: { key: string; title: string }[] = [
  { key: "Q1", title: "Q1" },
  { key: "Q2", title: "Q2" },
  { key: "1/32", title: "1/32 finala" },
  { key: "1/16", title: "1/16 finala" },
  { key: "1/8", title: "1/8 finala" },
  { key: "1/4", title: "Četvrtfinale" },
  { key: "1/2", title: "Polufinale" },
  { key: "Finale", title: "Finale" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}.`;
}

function Team({ name, crest, align }: { name: string; crest: string; align: "left" | "right" }) {
  const img = crest ? (
    <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
  ) : (
    <span className="size-6 shrink-0" />
  );
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

function RoundTable({ title, rows }: { title: string; rows: CupMatch[] }) {
  const crestFor = useClubCrest();
  return (
    <section className="mt-8 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
      </h2>
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
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Team name={m.home} crest={crestFor(m.home) || m.home_crest} align="right" />
                    <span className="min-w-14 text-center font-bold">
                      {m.score_home !== null && m.score_away !== null
                        ? `${m.score_home}:${m.score_away}`
                        : "–"}
                    </span>
                    <Team name={m.away} crest={crestFor(m.away) || m.away_crest} align="left" />
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
    </section>
  );
}

export function CupMatches() {
  const { data, isLoading } = useQuery({
    queryKey: ["cup-matches"],
    queryFn: () => getCupMatches(),
  });
  const rows = data ?? [];

  const seasons = [...new Set(rows.map((m) => m.season))].sort((a, b) => b.localeCompare(a));

  const [picked, setPicked] = useState("");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setPicked(saved);
    } catch {
      /* ignoriši */
    }
  }, []);
  const choose = (s: string) => {
    setPicked(s);
    try {
      sessionStorage.setItem(KEY, s);
    } catch {
      /* ignoriši */
    }
  };

  const season = seasons.includes(picked) ? picked : seasons[0] || "";
  const inSeason = rows.filter((m) => m.season === season);

  const known = new Set(ROUNDS.map((r) => r.key));
  const extra = [...new Set(inSeason.map((m) => m.round).filter((r) => !known.has(r)))];
  const order = [...ROUNDS, ...extra.map((r) => ({ key: r, title: r }))];

  if (isLoading) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card">
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  if (seasons.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">Kup BiH {season}</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="kup-sezona" className="text-xs font-semibold uppercase text-muted-foreground">
            Sezona
          </label>
          <select
            id="kup-sezona"
            value={season}
            onChange={(e) => choose(e.target.value)}
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

      {order.map(({ key, title }) => {
        const list = inSeason.filter((m) => m.round === key);
        return list.length ? <RoundTable key={key} title={title} rows={list} /> : null;
      })}
    </div>
  );
}
