import { useCrest } from "@/lib/use-crest";
import { useQuery } from "@tanstack/react-query";
import { getEuroMatches, type EuroMatch } from "@/lib/euromatches.functions";

const COMPETITIONS: { key: EuroMatch["competition"]; title: string }[] = [
  { key: "LP", title: "Liga prvaka" },
  { key: "LE", title: "Liga Evrope" },
  { key: "KL", title: "Konferencijska liga" },
  { key: "KPK", title: "Kup pobjednika kupova" },
];

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

function Table({ title, rows: rawRows }: { title: string; rows: EuroMatch[] }) {
  // Redoslijed klubova u sezoni = redoslijed po najmanjem sort_order tog kluba
      const crestFor = useCrest();
  const firstOrder = new Map<string, number>();
  for (const r of rawRows) {
    const k = `${r.season}|${r.club}`;
    firstOrder.set(k, Math.min(firstOrder.get(k) ?? Infinity, r.sort_order));
  }
  const rows = [...rawRows].sort(
    (a, b) =>
      a.season.localeCompare(b.season) ||
      firstOrder.get(`${a.season}|${a.club}`)! - firstOrder.get(`${b.season}|${b.club}`)! ||
      a.club.localeCompare(b.club) ||
      a.sort_order - b.sort_order,
  );

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
              const flag = r.opponent_flag
                ? r.opponent_flag.startsWith("http")
                  ? r.opponent_flag
                  : `https://flagcdn.com/w40/${r.opponent_flag.toLowerCase()}.png`
                : "";
             const crest = crestFor(r.club) || (r.club_crest
  ? r.club_crest.startsWith("http")
    ? r.club_crest
    : `${SUPA}${r.club_crest}`
  : "");
              return (
                <tr key={r.id} className={border}>
                  {x.newSeason && (
                    <td
                      rowSpan={x.seasonCount}
                      className="border-r border-border px-3 py-2 align-middle font-semibold"
                    >
                      {r.season}
                    </td>
                  )}
                  {x.newClub && (
                    <td
                      rowSpan={x.clubCount}
                      className={`border-r border-border px-3 py-2 align-middle ${
                        x.lastOfSeason || true ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        {crest && (
                          <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
                        )}
                        {r.club}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2">{r.round}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {flag && <img src={flag} alt="" className="h-4 w-6 shrink-0 object-cover" />}
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
