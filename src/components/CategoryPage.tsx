import { useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { byCategory, categoryLabels } from "@/lib/content";
import type { Category, PublicContent } from "@/lib/content.functions";

const PAGE_SIZE = 10;

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
  const shown = list.slice(0, visible);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rule-top pt-3">
        <h1 className="text-4xl uppercase">{categoryLabels[category]}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="grid gap-8 sm:grid-cols-2">
            {shown.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground">
                U ovoj rubrici još nema vijesti. Navratite uskoro.
              </p>
            )}
          </div>

          {visible < list.length && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-md border border-border px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wide hover:bg-muted"
              >
                Učitaj još
              </button>
            </div>
          )}
        </div>
        <Sidebar content={content} />
      </div>
    </div>
  );
}
