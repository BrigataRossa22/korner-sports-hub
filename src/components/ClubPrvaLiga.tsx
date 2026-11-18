import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubPrva } from "@/lib/clubprva.functions";
import { groupRank } from "@/lib/season-groups";

const fmtAvg = (n: number | null) => (n !== null ? n.toLocaleString("de-DE") : "—");

// Boje samo u zaglavlju: P zeleno, N žuto, I crveno (isto kao u ostalim takmičenjima)
const WIN = "text-green-600 dark:text-green-500";
const DRAW = "text-yellow-600 dark:text-yellow-400";
const LOSS = "text-red-600 dark:text-red-500";

// Kartica "Prva liga BiH" na stranici kluba: sezone 1994/95 do 2001/02
export function ClubPrvaLiga({ name }: { name: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["club-prva", name],
    queryFn: () => getClubPrva({ data: { name } }),
  });

  if (isLoading) return <TableSkeleton rows={4} cols={10} />;

  // Najnovija sezona prva; unutar sezone prvo finalna grupa, pa ostale grupe
  const rows = [...(data ?? [])].sort(
    (a, b) =>
      b.season.localeCompare(a.season) ||
      groupRank(b.grp) - groupRank(a.grp) ||
      a.grp.localeCompare(b.grp, "bs"),
  );

  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>;
  }

  const tot = rows.reduce(
    (s, r) => ({
      played: s.played + r.played,
      wins: s.wins + r.wins,
      draws: s.draws + r.draws,
      losses: s.losses + r.losses,
      gf: s.gf + r.gf,
      ga: s.ga + r.ga,
    }),
    { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
  );
  const seasons = new Set(rows.map((r) => r.season)).size;

  const open = (r: (typeof rows)[number]) =>
    navigate({ to: "/arhiva/$season/$club", params: { season: r.season, club: r.team } });

  return (
    <>
      {/* ---- Mobitel: kompaktna tabela, isto kao WWIN liga, Kup i Evropa ---- */}
      <div className="max-h-80 overflow-auto sm:hidden">
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2 text-left">Sezona</th>
              <th className="px-1.5 py-2 text-right">Ut.</th>
              <th className={`px-1.5 py-2 text-right ${WIN}`}>P</th>
              <th className={`px-1.5 py-2 text-right ${DRAW}`}>N</th>
              <th className={`px-1.5 py-2 text-right ${LOSS}`}>I</th>
              <th className="px-3 py-2 text-right">Prosjek</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.season}|${r.grp}`}
                onClick={() => open(r)}
                className="cursor-pointer border-b border-border/70 last:border-0"
              >
                <td className="px-3 py-2.5">
                  <span className="text-primary">{r.season}</span>
                  {r.position ? (
                    <span className="block text-[10px] font-normal leading-tight text-muted-foreground">
                      {r.position}. mjesto
                    </span>
                  ) : null}
                </td>
                <td className="px-1.5 py-2.5 text-right">{r.played}</td>
                <td className="px-1.5 py-2.5 text-right">{r.wins}</td>
                <td className="px-1.5 py-2.5 text-right">{r.draws}</td>
                <td className="px-1.5 py-2.5 text-right">{r.losses}</td>
                <td className="px-3 py-2.5 text-right">{fmtAvg(r.avg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Računar: tabela ---- */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[700px] table-fixed text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
              <th className="px-3 py-3 text-left">Sezona</th>
              <th className="w-24 px-3 py-3 text-center">Utakmica</th>
              <th className={`w-20 px-3 py-3 text-center ${WIN}`}>P</th>
              <th className={`w-20 px-3 py-3 text-center ${DRAW}`}>N</th>
              <th className={`w-20 px-3 py-3 text-center ${LOSS}`}>I</th>
              <th className="w-24 px-3 py-3 text-center">Golova</th>
              <th className="w-24 px-3 py-3 text-center">Primljenih</th>
              <th className="w-24 px-3 py-3 text-center">Plasman</th>
              <th className="w-28 px-3 py-3 text-center">Prosjek</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.season}|${r.grp}`} className="border-t border-border">
                <td className="px-3 py-3">
                  <Link
                    to="/arhiva/$season/$club"
                    params={{ season: r.season, club: r.team }}
                    title="Prikaži sve utakmice ove sezone"
                    className="font-semibold text-primary hover:underline"
                  >
                    {r.season}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">{r.played}</td>
                <td className="px-3 py-3 text-center">{r.wins}</td>
                <td className="px-3 py-3 text-center">{r.draws}</td>
                <td className="px-3 py-3 text-center">{r.losses}</td>
                <td className="px-3 py-3 text-center">{r.gf}</td>
                <td className="px-3 py-3 text-center">{r.ga}</td>
                <td className="px-3 py-3 text-center font-semibold">{r.position}</td>
                <td className="px-3 py-3 text-center">{fmtAvg(r.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
              <td className="px-3 py-3 uppercase">
                Ukupno <span className="text-xs font-normal normal-case text-muted-foreground">({seasons} sez.)</span>
              </td>
              <td className="px-3 py-3 text-center">{tot.played}</td>
              <td className="px-3 py-3 text-center">{tot.wins}</td>
              <td className="px-3 py-3 text-center">{tot.draws}</td>
              <td className="px-3 py-3 text-center">{tot.losses}</td>
              <td className="px-3 py-3 text-center">{tot.gf}</td>
              <td className="px-3 py-3 text-center">{tot.ga}</td>
              <td className="px-3 py-3 text-center">—</td>
              <td className="px-3 py-3 text-center">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
