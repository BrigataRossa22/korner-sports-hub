import { createFileRoute } from "@tanstack/react-router";
import { ArticleCard, ArticleRow } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { LoadError } from "@/components/RouteFallbacks";
import { homeLayout } from "@/lib/content";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/")({
  loader: () => getPublicContent(),
  head: ({ loaderData }) => {
    const lead = loaderData?.articles.find((a) => a.isHeadline) ?? loaderData?.articles[0];
    const title = lead ? `${lead.title} — Korner BiH` : "Korner BiH — Sportske vijesti iz BiH";
    const description = lead?.lead ?? "Fudbal, košarka i ostali sportovi iz Bosne i Hercegovine.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (lead?.imageAbs) {
      meta.push(
        { property: "og:image", content: lead.imageAbs },
        { name: "twitter:image", content: lead.imageAbs },
      );
    }
    return { meta };
  },
  errorComponent: LoadError,
  component: Index,
});

function Index() {
  const content = Route.useLoaderData();
  const { lead, secondary, grid } = homeLayout(content.articles);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {lead ? (
            <article className="rule-top pb-8">
              <ArticleCard article={lead} size="hero" />
            </article>
          ) : (
            <p className="py-10 text-muted-foreground">
              Još nema objavljenih vijesti. Nahodajte se.
            </p>
          )}

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {secondary.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {grid.length > 0 && (
            <section className="mt-10">
              <h2 className="rule-top pt-2 font-display text-xl uppercase">Aktuelno</h2>
              <div className="mt-2 divide-y divide-border">
                {grid.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>

        <Sidebar content={content} />
      </div>
    </div>
  );
}
