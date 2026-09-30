import { articles, fixtures, standings } from "@/data/articles";
import { ArticleRow } from "@/components/ArticleCard";

export function Sidebar() {
  return (
    <aside className="space-y-8">
      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Najčitanije</h3>
        <div className="mt-2">
          {articles.slice(0, 5).map((a) => (
            <ArticleRow key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Raspored</h3>
        <ul className="mt-2 divide-y divide-border">
          {fixtures.map((f) => (
            <li key={`${f.home}-${f.away}`} className="py-2.5">
              <p className="text-sm font-medium">
                {f.home} <span className="text-muted-foreground">–</span> {f.away}
              </p>
              <p className="text-xs text-muted-foreground">
                {f.comp} · {f.time}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Tabela</h3>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2 font-medium">Klub</th>
              <th className="py-2 text-right font-medium">Ut</th>
              <th className="py-2 text-right font-medium">Bod</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.team} className="border-b border-border last:border-0">
                <td className="py-2">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {s.team}
                </td>
                <td className="py-2 text-right text-muted-foreground">{s.played}</td>
                <td className="py-2 text-right font-semibold">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </aside>
  );
}
