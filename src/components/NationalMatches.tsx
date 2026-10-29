import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalMatches } from "@/lib/nationalmatches.functions";

const isBih = (name: string) => /bosna|bih/i.test(name);

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
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

// Zastava za mobitel; ako je nema, krug s inicijalima
function MobileFlag({ name, flag }: { name: string; flag: string }) {
  const src = flagSrc(flag);
  return src ? (
    <img src={src} alt="" className="h-5 w-8 shrink-0 rounded-[2px] object-cover" />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
      {initials(name)}
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
    const bihHome = isBih(m.home);
    const a = bihHome ? m.score_home : m.score_away;
    const b = bihHome ? m.score_away : m.score_home;
    if (a > b) w++;
    else if (a === b) d++;
    else l++;
  }

  // Boja rezultata iz ugla BiH
  const pillClass = (m: (typeof rows)[number]): string => {
    if (m.score_home === null || m.score_away === null) return "bg-muted text-foreground";
    const bihHome = isBih(m.home);
    const a = bihHome ? m.score_home : m.score_away;
    const b = bihHome ? m.score_away : m.score_home;
    if (a > b) return "bg-primary/15 text-primary";
    if (a < b) return "bg-destructive/15 text-destructive";
    return "bg-muted text-foreground";
  };

  const attText = (n: number): string =>
    n > 0 ? n.toLocaleString("de-DE") : "—";

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
          {/* ---- Mobitel: zastave i obojen rezultat (iz ugla BiH) ---- */}
          <div className="sm:hidden">
            <div className="grid grid-cols-[3.75rem_1fr_3.5rem] items-center gap-2 px-3 py-2 text-xs uppercase text-muted-foreground">
              <span>Datum</span>
              <span className="text-center">Utakmica</span>
              <span className="text-right">Gledalaca</span>
            </div>

            {list.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[3.75rem_1fr_3.5rem] items-center gap-2 border-t border-border px-3 py-3"
              >
                <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
                  {fmtDate(m.match_date)}
                </span>

                <div className="flex items-center justify-center gap-2">
                  <span className="flex flex-1 justify-end" title={m.home}>
                    <MobileFlag name={m.home} flag={m.home_flag} />
                  </span>
                  <span
                    className={`min-w-14 rounded-md px-2 py-1 text-center text-sm font-bold tabular-nums ${pillClass(m)}`}
                  >
                    {m.score_home !== null && m.score_away !== null
                      ? `${m.score_home}:${m.score_away}`
                      : "–"}
                  </span>
                  <span className="flex flex-1" title={m.away}>
                    <MobileFlag name={m.away} flag={m.away_flag} />
                  </span>
                </div>

                <span className="text-right text-xs tabular-nums">{attText(m.attendance)}</span>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-3 text-[10px] uppercase text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-primary/15 ring-1 ring-primary/40" />
                Pobjeda
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-muted ring-1 ring-border" />
                Remi
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-destructive/15 ring-1 ring-destructive/40" />
                Poraz
              </span>
            </div>
          </div>

          {/* ---- Računar: tabela kao do sada ---- */}
          <div className="hidden overflow-x-auto sm:block">
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
                    <td className="px-4 py-3 text-right">{attText(m.attendance)}</td>
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
