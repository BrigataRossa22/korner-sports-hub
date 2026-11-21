import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArticleCard, ArticleRow, timeAgo } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { ArticleMissing, LoadError } from "@/components/RouteFallbacks";
import { getPublicContent, type ArticleDTO, type PublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/clanak/$slug")({
  loader: async ({ params }): Promise<{ content: PublicContent; article: ArticleDTO }> => {
    const content = await getPublicContent();
    const article = content.articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { content, article };
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    if (!article) {
      return {
        meta: [
          { title: "Vijest nije pronađena — Korner BiH" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${article.title} — Korner BiH`;
    const description = article.lead.slice(0, 160);
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (article.imageAbs) {
      meta.push(
        { property: "og:image", content: article.imageAbs },
        { name: "twitter:image", content: article.imageAbs },
      );
    }
    return { meta };
  },
  errorComponent: LoadError,
  notFoundComponent: ArticleMissing,
  component: Clanak,
});

function Clanak() {
  const { content, article } = Route.useLoaderData();
  const related = content.articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 5);
  // Još vijesti ispod članka: najnovije koje nisu ovaj članak
  const more = content.articles.filter((a) => a.slug !== article.slug).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="font-display text-sm uppercase tracking-[0.18em] text-primary">
            {article.kicker || article.category}
          </p>
          <h1 className="mt-3 text-4xl leading-tight">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{article.lead}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-sm text-muted-foreground">
            <span>{article.author}</span>
            <span suppressHydrationWarning>{timeAgo(article.publishedAt)}</span>
            <span>{article.comments} komentara</span>
          </div>

          {article.image && (
            <figure className="mt-6">
              <img
                src={article.image}
                alt={article.title}
                className="aspect-[16/9] w-full rounded-md object-cover"
              />
              <figcaption className="mt-2 text-xs text-muted-foreground">Foto: Korner BiH</figcaption>
            </figure>
          )}

          <div className="mt-6 space-y-4">
            {article.body.map((paragraph, index) => (
              <p
                key={`${article.slug}-${index}`}
                className="text-[1.05rem] leading-relaxed text-foreground/90"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {more.length > 0 && (
            <section className="mt-12">
              <div className="border-b-2 border-primary pb-1.5">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                  Pročitajte još
                </h2>
              </div>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((item) => (
                  <ArticleCard key={item.id} article={item} size="sm" />
                ))}
              </div>
            </section>
          )}
        </article>

        <div className="space-y-8">
          {related.length > 0 && (
            <section>
              <h3 className="rule-top pt-2 font-display text-lg uppercase">Povezane vijesti</h3>
              <div className="mt-2 divide-y divide-border">
                {related.map((item) => (
                  <ArticleRow key={item.id} article={item} />
                ))}
              </div>
            </section>
          )}
          <Sidebar content={content} />
        </div>
      </div>
    </div>
  );
} 
