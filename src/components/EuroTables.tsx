import { useQuery } from "@tanstack/react-query";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";

const COMPETITIONS: { key: EuroMatch["competition"]; title: string }[] = [
  { key: "LP", title: "Liga prvaka" },
  { key: "LE", title: "Liga Evrope" },
  { key: "KL", title: "Konferencijska liga" },
  { key: "KPK", title: "Kup pobjednika kupova" },
];

function Table({ title, rows }: { title: string; rows: EuroMatch[] }) {
  const info = rows.map((row, i) => {
    const prev = rows[i - 1];
    const next = rows[i + 1];
    const newSeason = !prev || prev.season !== row.season;
    const newClub = newSeason || prev.club !== row.club;
    let seasonCount = 0;
    let clubCount = 0;
    if (newSeason) {
      for (let j = i; j < rows.length && rows[j]!.season === row.season; j++) seasonCount++;
    }
    if (newClub) {
      for (
        let j = i;
        j < rows.length && rows[j]!.season === row.season && rows[j]!.club === row.club;
        j++
      )
        clubCount++;
    }
    const lastOfSeason = !next || next.season !== row.season;
    const lastOfClub = lastOfSeason || next.club !== row.club;
    return { newSeason, newClub, seasonCount, clubCount, lastOfSeason, lastOfClub };
  });

  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2 text-left">Sezona</th>
              <th className="px-3 py-2 text-left">Klub</th>
              <th className="px-3 py-2 text-left">Runda</th>
              <th className="px-3 py-2 text-left">Protivnik</th>
              <th className="px-3 py-2 text-center">Domaćin</th>
              <th className="px-3 py-2 text-center">Gost</th>
              <th className="px-3 py-2 text-center">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const x = info[i]!;
              const border = x.lastOfSeason
                ? "border-b-4 border-foreground/30"
                : x.lastOfClub
                  ? "border-b border-border"
                  : "";
              return (
                <tr key={r.id} className={border}>
                  {x.newSeason && (
                    <td rowSpan={x.seasonCount} className="border-r border-border px-3 py-2 align-middle font-semibold">
                      {r.season}
                    </td>
                  )}
                  {x.newClub && (
                    <td rowSpan={x.clubCount} className="border-r border-border px-3 py-2 align-middle">
                      <span className="flex items-center gap-2 font-semibold">
                        {r.club_crest && (
                          <img src={r.club_crest} alt="" className="size-6 shrink-0 object-contain" />
                        )}
                        {r.club}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2">{r.round}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {r.opponent_flag && (
                        <img src={r.opponent_flag} alt="" className="h-4 w-6 shrink-0 object-cover" />
                      )}
                      {r.opponent}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">{r.home || "—"}</td>
                  <td className="px-3 py-2 text-center">{r.away || "—"}</td>
                  <td className="px-3 py-2 text-center font-bold">{r.agg || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EuroTables() {
  const { data } = useQuery({ queryKey: ["euro-matches"], queryFn: () => getEuroMatches() });
  const rows = data ?? [];
  return (
    <>
      {COMPETITIONS.map(({ key, title }) => {
        const list = rows.filter((m) => m.competition === key);
        return list.length ? <Table key={key} title={title} rows={list} /> : null;
      })}
    </>
  );
}
