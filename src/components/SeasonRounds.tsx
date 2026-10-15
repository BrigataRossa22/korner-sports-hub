import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getSeasonMatches, type SeasonMatch } from "@/lib/seasonmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

export function SeasonRounds({ season }: { season: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
  });
  const crestFor = useClubCrest();
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [season]);

  const rows = data ?? [];
  const groups = new Map<number, SeasonMatch[]>();
  for (const m of rows) {
    const r = m.round ?? 0;
    groups.set(r, [...(groups.get(r) ?? []), m]);
  }
  const rounds = [...groups.keys()].sort((a, b) => a - b);
  const round = picked !== null && rounds.includes(picked) ? picked : (rounds[0] ?? 0);
  const list = groups.get(round) ?? [];

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-6 shrink-0 object-contain" />
    ) : (
      <span className="size-6 shrink-0" />
    );
  };

  if (isLoading) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card">
        <TableSkeleton rows={8} cols={3} />
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <p className="mt-10 border-y border-border py-6 text-sm text-muted-foreground">
        Utakmice po kolima za ovu sezonu još nisu unesene.
      </p>
    );
  }

  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">
          {round === 0 ? "Bez kola" : `${round}. kolo`}
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="kolo-arhiva" className="text-xs font-semibold uppercase text-muted-foreground">
            Kolo
          </label>
          <select
            id="kolo-arhiva"
            value={round}
            onChange={(e) => setPicked(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          >
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "Bez kola" : `${r}. kolo`}
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
    </section>
  );
}
