import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubDetail } from "@/lib/clubdetail.functions";
import { getEuroMatches } from "@/lib/euromatches.functions";
import { useCrest } from "@/lib/use-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

export const Route = createFileRoute("/klub/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — Korner BiH` },
      { name: "description", content: `${params.name}: utakmice, trofeji i uspjesi.` },
    ],
  }),
  errorComponent: LoadError,
  component: Klub,
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Klub() {
  const { name } = Route.useParams();
  const crestFor = useCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["club-detail", name],
    queryFn: () => getClubDetail({ data: { name } }),
  });
  const { data: euro } = useQuery({
    queryKey: ["euro-matches"],
    queryFn: () => getEuroMatches(),
  });

  // ime protivnika -> zastava (iz tabele euro_matches)
  const flags = new Map<string, string>();
  for (const e of euro ?? []) {
    if (e.opponent_flag) flags.set(norm(e.opponent), e.opponent_flag);
  }
  const flagFor = (club: string): string => {
    const f = flags.get(norm(club));
    if (!f) return "";
    return f.startsWith("http") ? f : `https://flagcdn.com/w40/${f.toLowerCase()}.png`;
  };

  const crest = crestFor(name);

  const Badge = ({ club }: { club: string }) => {
    const c = crestFor(club);
    if (c) return <img src={c} alt="" className="size-6 shrink-0 object-contain" />;
    const f = flagFor(club);
    if (f) return <img src={f} alt="" className="h-4 w-6 shrink-0 object-cover" />;
    return null;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/tabela" className="text-sm text-muted-foreground hover:underline">
        ← Nazad na tabelu
      </Link>
      <div className="rule-top mb-5 mt-3 flex items-center gap-4 pt-3">
        {crest && <img src={crest} alt="" className="size-16 object-contain" />}
        <div>
          <p className="kicker">Klub · sezona 2026/27</p>
          <h1 className="mt-1 font-display text-3xl uppercase sm:text-4xl">{name}</h1>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
          Utakmice
        </h2>
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : !data || data.matches.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Još nema utakmica.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm tabular-nums">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2 text-left">Datum</th>
                  <th className="px-4 py-2 text-left">Takmičenje</th>
                  <th className="px-4 py-2 text-center">Utakmica</th>
                  <th className="px-4 py-2 text-right">Gledalaca</th>
                </tr>
              </thead>
              <tbody>
                {data.matches.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(m.match_date)}</td>
                    <td className="px-4 py-3">{m.competition}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex flex-1 items-center justify-end gap-2 text-right font-medium">
                          {m.home}
                          <Badge club={m.home} />
                        </span>
                        <span className="min-w-14 text-center font-bold">
                          {m.score_home !== null && m.score_away !== null
                            ? `${m.score_home}:${m.score_away}`
                            : "–"}
                        </span>
                        <span className="flex flex-1 items-center gap-2 font-medium">
                          <Badge club={m.away} />
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
        )}
      </section>

      {data && data.trophies.length > 0 && (
        <section className="mt-10 rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Trofeji
          </h2>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.trophies.map((t) => (
              <div key={t.id} className="rounded-md border border-border p-4 text-center">
                {t.image && (
                  <img
                    src={t.image.startsWith("http") ? t.image : `${SUPA}${t.image}`}
                    alt=""
                    className="mx-auto h-24 object-contain"
                  />
                )}
                <p className="mt-3 font-display text-2xl font-bold">{t.times}×</p>
                <p className="text-sm font-semibold">{t.title}</p>
                {t.years && <p className="mt-1 text-xs text-muted-foreground">{t.years}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data && data.achievements.length > 0 && (
        <section className="mt-10 rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
            Uspjesi
          </h2>
          <ul className="space-y-2 p-4 text-sm">
            {data.achievements.map((a) => (
              <li key={a.id} className="border-b border-border pb-2 last:border-0">
                {a.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
