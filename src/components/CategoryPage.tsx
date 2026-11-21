import { useState } from "react";
import { ArticleFeedItem, ArticleTile } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { byCategory, categoryLabels } from "@/lib/content";
import type { Category, PublicContent } from "@/lib/content.functions";

const PAGE_SIZE = 12;

export function CategoryPage({
  category,
  intro,
  content,
}: {
  category: Category;
  intro: string;
  content: PublicContent;
}) {
  const list = byCategory(content.articles, category);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const first = list[0] ?? null;
  const rest = list.slice(1, visible + 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="border-b-2 border-primary pb-3">
        <h1 className="text-4xl uppercase">{categoryLabels[category]}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {first ? (
            <>
              <ArticleTile
                article={first}
                className="aspect-[16/9]"
                titleClass="text-2xl sm:text-3xl"
              />
              <div className="mt-6">
                {rest.map((article) => (
                  <ArticleFeedItem key={article.id} article={article} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              U ovoj rubrici još nema vijesti. Navratite uskoro.
            </p>
          )}

          {visible + 1 < list.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-md bg-primary px-8 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:opacity-90"
              >
                Učitaj još vijesti
              </button>
            </div>
          )}
        </div>
        <Sidebar content={content} />
      </div>
    </div>
  );
}
