import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { byCategory, categoryLabels, type Category } from "@/data/articles";

export function CategoryPage({ category, intro }: { category: Category; intro: string }) {
  const list = byCategory(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rule-top pt-3">
        <h1 className="text-4xl uppercase">{categoryLabels[category]}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-8 sm:grid-cols-2">
          {list.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
