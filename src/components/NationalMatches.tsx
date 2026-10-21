import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalMatches } from "@/lib/nationalmatches.functions";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}.`;
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

export function NationalMatches() {
  const { data, isLoading } = useQuery({
    queryKey: ["national-matches"],
    queryFn: () => getNationalMatches(),
  });
  const rows = data ?? [];

  // Prikazuje se samo najnovija godina; ostalo je u arhivi
  const years = [...new Set(rows.map((m) => m.match_date.slice(0, 4)))].sort((a, b) =>
    b.localeCompare(a),
  );
  const year = years[0] || "";
  const list = rows.filter((m) => m.match_date.startsWith(year));

  let w = 0,
    d = 0,
    l = 0;
  for (const m of list) {
    if (m.score_home === null || m.score_away === null) continue;
    const bihHome = /bosna|bih/i.test(m.home);
    const a = bihHome ? m.score_home : m.score_away;
    const b = bihHome ? m.score_away : m.score_home;
    if (a > b) w++;
    else if (a === b) d++;
    else l++;
  }

  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">
          Utakmice reprezentacije BiH {year}.
        </h2>
        <Link
          to="/reprezentacija-arhiva"
          className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          Arhiva utakmica →
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : list.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>
      ) : (
        <>
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
            {list.length} utakmica · {w} pobjeda · {d} neriješeno · {l} poraza
          </p>
        </>
      )}
    </section>
  );
}
