import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getAttendance } from "@/lib/attendance.functions";
import { useCrest } from "@/lib/use-crest";

const fmt = (n: number) => n.toLocaleString("de-DE");

export function Attendance() {
  const { data, isLoading } = useQuery({ queryKey: ["attendance"], queryFn: () => getAttendance() });
  const crestFor = useCrest();
  const rows = data ?? [];
  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        Gledanost
      </h2>
      {isLoading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Ekipa</th>
                <th className="px-4 py-2 text-right">Ukupno gledalaca</th>
                <th className="px-4 py-2 text-right">Prosjek</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const crest = crestFor(r.team);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">
                      <span className="flex items-center gap-2">
                        {crest && <img src={crest} alt="" className="size-6 object-contain" />}
                        {r.team}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{fmt(r.total)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmt(r.average)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
