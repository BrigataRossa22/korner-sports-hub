import { useSuspenseQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { byCategory, categoryLabels, contentOptions } from "@/lib/content";
import type { Category } from "@/lib/content.functions";

export function CategoryPage({ category, intro }: { category: Category; intro: string }) {
  const { data } = useSuspenseQuery(contentOptions);
  const list = byCategory(data.articles, category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rule-top pt-3">
        <h1 className="text-4xl uppercase">{categoryLabels[category]}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-8 sm:grid-cols-2">
          {list.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              U ovoj rubrici još nema vijesti. Navratite uskoro.
            </p>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
