import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/arhiva/$season/$club")({
  head: ({ params }) => ({
    meta: [{ title: `${params.club} ${params.season} — Korner BiH` }],
  }),
  errorComponent: LoadError,
  component: ArhivaKlub,
});

const PREFIXES = new Set(["fk", "nk", "hsk", "hnk", "sk", "gnk", "fc", "nogometni", "klub"]);

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PREFIXES.has(w))
    .join(" ");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function ArhivaKlub() {
  const { season, club } = Route.useParams();
  const crestFor = useClubCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["season-matches", season],
    queryFn: () => getSeasonMatches({ data: { season } }),
  });

  const key = norm(club);
  const mine = (data ?? []).filter((m) => norm(m.home) === key || norm(m.away) === key);

  let w = 0,
    d = 0,
    l = 0,
    gf = 0,
    ga = 0;
  const resultOf = (m: (typeof mine)[number]): "W" | "D" | "L" | null => {
    if (m.score_home === null || m.score_away === null) return null;
    const isHome = norm(m.home) === key;
    const a = isHome ? m.score_home : m.score_away;
    const b = isHome ? m.score_away : m.score_home;
    return a > b ? "W" : a === b ? "D" : "L";
  };
  for (const m of mine) {
    const r = resultOf(m);
    if (!r) continue;
    const isHome = norm(m.home) === key;
    gf += isHome ? m.score_home! : m.score_away!;
    ga += isHome ? m.score_away! : m.score_home!;
    if (r === "W") w++;
    else if (r === "D") d++;
    else l++;
  }

  const style: Record<string, string> = {
    W: "bg-primary text-primary-foreground",
    D: "bg-muted text-muted-foreground",
    L: "bg-destructive text-destructive-foreground",
  };

  const Team = ({ name, align }: { name: string; align: "left" | "right" }) => {
    const c = crestFor(name);
    const img = c ? (
      <img src={c} alt="" className="size-6 shrink-0 object-contain" />
    ) : (
      <span className="size-6 shrink-0" />
    );
    const bold = norm(name) === key ? "font-bold" : "font-medium";
    return (
      <span className={`flex flex-1 items-center gap-2 ${bold} ${align === "right" ? "justify-end text-right" : ""}`}>
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
  };

  const crest = crestFor(club);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/stare-sezone" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na arhivu sezona
      </Link>
      <div className="rule-top mb-5 mt-3 flex items-center gap-4 pt-3">
        {crest && <img src={crest} alt="" className="size-16 object-contain" />}
        <div>
          <p className="kicker">Sezona {season}</p>
          <h1 className="mt-1 font-display text-3xl uppercase sm:text-4xl">{club}</h1>
          {mine.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {w} pobjeda · {d} neriješeno · {l} poraza · golovi {gf}:{ga}
            </p>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
          Utakmice
        </h2>
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : mine.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Za ovu sezonu još nema utakmica.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left">Kolo</th>
                  <th className="px-3 py-2 text-left">Datum</th>
                  <th className="px-3 py-2 text-center">Utakmica</th>
                  <th className="px-3 py-2 text-center"></th>
                  <th className="px-3 py-2 text-right">Gledalaca</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((m) => {
                  const r = resultOf(m);
                  return (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-3 py-3">{m.round ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{fmtDate(m.match_date)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Team name={m.home} align="right" />
                          <span className="min-w-14 text-center font-bold">
                            {m.score_home !== null && m.score_away !== null
                              ? `${m.score_home}:${m.score_away}`
                              : "–"}
                          </span>
                          <Team name={m.away} align="left" />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {r && (
                          <span
                            className={`inline-flex size-5 items-center justify-center rounded-sm text-[11px] font-bold ${style[r]}`}
                          >
                            {r}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {m.attendance > 0 ? m.attendance.toLocaleString("de-DE") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
