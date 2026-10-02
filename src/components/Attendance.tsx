import { useQuery } from "@tanstack/react-query";
import { getAttendance } from "@/lib/attendance.functions";

const fmt = (n: number) => n.toLocaleString("de-DE");

export function Attendance() {
  const { data } = useQuery({ queryKey: ["attendance"], queryFn: () => getAttendance() });
  const rows = data ?? [];
  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        Gledanost
      </h2>
      {rows.length === 0 ? (
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
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{r.team}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.total)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{fmt(r.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
