import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getManagedArticle } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Uređivanje vijesti — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditArticlePage,
});

function EditArticlePage() {
  const { id } = Route.useParams();
  const fetch = useServerFn(getManagedArticle);

  const article = useQuery({
    queryKey: ["managed-article", id],
    queryFn: () => fetch({ data: { id } }),
  });

  if (article.isLoading) {
    return <p className="text-sm text-muted-foreground">Učitavam vijest...</p>;
  }

  if (article.error) {
    return (
      <p className="text-sm text-destructive">
        Ne mogu da otvorim vijest: {article.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Uređivanje vijesti</h1>
      <ArticleEditor key={article.data.id} initial={article.data} />
    </div>
  );
}
