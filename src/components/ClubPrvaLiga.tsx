import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getClubPrva } from "@/lib/clubprva.functions";
import { groupRank } from "@/lib/season-groups";

// Kartica "Prva liga BiH" na stranici kluba: sezone 1994/95 do 2001/02
export function ClubPrvaLiga({ name }: { name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["club-prva", name],
    queryFn: () => getClubPrva({ data: { name } }),
  });

  if (isLoading) return <TableSkeleton rows={4} cols={9} />;

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th className="px-3 py-3 text-left">Sezona</th>
            <th className="px-3 py-3 text-center">Poz.</th>
            <th className="px-3 py-3 text-right">Utakmica</th>
            <th className="px-3 py-3 text-right">Pobjeda</th>
            <th className="px-3 py-3 text-right">Neriješeno</th>
            <th className="px-3 py-3 text-right">Poraza</th>
            <th className="px-3 py-3 text-right">Golovi</th>
            <th className="px-3 py-3 text-right">Primljeni</th>
            <th className="px-3 py-3 text-right">Bodova</th>
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
                {r.grp && <span className="ml-2 text-xs text-muted-foreground">{r.grp}</span>}
              </td>
              <td className="px-3 py-3 text-center font-semibold text-primary">{r.position}</td>
              <td className="px-3 py-3 text-right">{r.played}</td>
              <td className="px-3 py-3 text-right">{r.wins}</td>
              <td className="px-3 py-3 text-right">{r.draws}</td>
              <td className="px-3 py-3 text-right">{r.losses}</td>
              <td className="px-3 py-3 text-right">{r.gf}</td>
              <td className="px-3 py-3 text-right">{r.ga}</td>
              <td className="px-3 py-3 text-right font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
