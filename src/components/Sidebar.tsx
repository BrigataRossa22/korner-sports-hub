import { useSuspenseQuery } from "@tanstack/react-query";
import { ArticleRow } from "@/components/ArticleCard";
import { contentOptions, mostRead } from "@/lib/content";

export function Sidebar() {
  const { data } = useSuspenseQuery(contentOptions);
  const read = mostRead(data.articles);

  return (
    <aside className="space-y-8">
      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Najčitanije</h3>
        <div className="mt-2">
          {read.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Raspored</h3>
        <ul className="mt-2 divide-y divide-border">
          {data.fixtures.map((fixture) => (
            <li key={fixture.id} className="py-2.5">
              <p className="text-sm font-medium">
                {fixture.home} <span className="text-muted-foreground">–</span> {fixture.away}
              </p>
              <p className="text-xs text-muted-foreground">
                {fixture.comp} ·{" "}
                {fixture.finished && fixture.scoreHome !== null && fixture.scoreAway !== null
                  ? `${fixture.scoreHome}:${fixture.scoreAway}`
                  : fixture.when}
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
            {data.standings.map((standing, index) => (
              <tr key={standing.id} className="border-b border-border last:border-0">
                <td className="py-2">
                  <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                  {standing.team}
                </td>
                <td className="py-2 text-right text-muted-foreground">{standing.played}</td>
                <td className="py-2 text-right font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </aside>
  );
}
