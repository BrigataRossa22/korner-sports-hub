import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { LoadError } from "@/components/RouteFallbacks";
import { getLeagueMatches, type LeagueMatch } from "@/lib/leaguematches.functions";
import { useCrest } from "@/lib/use-crest";

export const Route = createFileRoute("/raspored-i-rezultati")({
  head: () => ({
    meta: [{ title: "Raspored i rezultati — Korner BiH" }],
  }),
  errorComponent: LoadError,
  component: Raspored,
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function Raspored() {
  const { data, isLoading } = useQuery({
    queryKey: ["league-matches"],
    queryFn: () => getLeagueMatches(),
  });
  const crestFor = useCrest();
  const [sel, setSel] = useState("all");
  const rows = data ?? [];

  const groups = new Map<number, LeagueMatch[]>();
  for (const m of rows) {
    const r = m.round ?? 0;
    groups.set(r, [...(groups.get(r) ?? []), m]);
  }
  const rounds = [...groups.keys()].sort((a, b) => a - b);
  const shown = sel === "all" ? rounds : rounds.filter((r) => String(r) === sel);

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? <img src={c} alt="" className="size-6 shrink-0 object-contain" /> : <span className="size-6 shrink-0" />;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">WWiN liga</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Raspored i rezultati</h1>
      </div>

      {rounds.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="kolo" className="text-sm font-semibold uppercase text-muted-foreground">
            Kolo
          </label>
          <select
            id="kolo"
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"
          >
            <option value="all">Sva kola</option>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "Bez kola" : `${r}. kolo`}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : rounds.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Još nema utakmica.</p>
      ) : (
        shown.map((r) => (
          <section key={r} className="mb-8 rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
              {r === 0 ? "Bez kola" : `${r}. kolo`}
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
                  {groups.get(r)!.map((m) => (
                    <tr key={m.id} className="border-t border-border">
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
                        {m.attendance > 0 ? m.attendance.toLocaleString("de-DE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
