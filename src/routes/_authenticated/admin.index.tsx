import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listManagedArticles, setArticleFlag } from "@/lib/admin.functions";
import { categoryLabels, formatDate, contentOptions } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Vijesti — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminArticlesPage,
});

function AdminArticlesPage() {
  const queryClient = useQueryClient();
  const fetchArticles = useServerFn(listManagedArticles);
  const setFlag = useServerFn(setArticleFlag);

  const articles = useQuery({
    queryKey: ["managed-articles"],
    queryFn: () => fetchArticles(),
  });

  async function toggle(id: string, flag: "published" | "headline" | "featured", value: boolean) {
    try {
      await setFlag({ data: { id, flag, value } });
      queryClient.invalidateQueries({ queryKey: ["managed-articles"] });
      queryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Promjena nije sačuvana.");
    }
  }

  if (articles.isLoading || !articles.data) {
    return <p className="text-sm text-muted-foreground">Učitavam vijesti...</p>;
  }

  if (articles.error) {
    return (
      <p className="text-sm text-destructive">
        Ne mogu da učitam vijesti: {articles.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Vijesti</h1>
        <Button asChild>
          <Link to="/admin/nova">
            <Plus className="size-4" /> Nova vijest
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Ukupno {articles.data.length}. Nacrti se ne vide na sajtu dok ih ne objaviš.
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {articles.data.map((article) => (
          <div key={article.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-[240px] flex-1">
              <Link
                to="/admin/$id"
                params={{ id: article.id }}
                className="font-semibold hover:text-primary"
              >
                {article.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {categoryLabels[article.category]} · {formatDate(article.publishedAt)} ·{" "}
                {article.comments} komentara · /{article.slug}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {article.isPublished ? (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Objavljeno</Badge>
                ) : (
                  <Badge variant="secondary">Nacrt</Badge>
                )}
                {article.isHeadline && <Badge>Glavna</Badge>}
                {article.isFeatured && <Badge variant="outline">Istaknuto</Badge>}
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <label className="flex flex-col items-center gap-1 text-muted-foreground">
                <span>Objava</span>
                <Switch
                  checked={article.isPublished}
                  onCheckedChange={(v) => toggle(article.id, "published", v)}
                />
              </label>
              <label className="flex flex-col items-center gap-1 text-muted-foreground">
                <span>Glavna</span>
                <Switch
                  checked={article.isHeadline}
                  onCheckedChange={(v) => toggle(article.id, "headline", v)}
                />
              </label>
              <label className="flex flex-col items-center gap-1 text-muted-foreground">
                <span>Istak.</span>
                <Switch
                  checked={article.isFeatured}
                  onCheckedChange={(v) => toggle(article.id, "featured", v)}
                />
              </label>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/$id" params={{ id: article.id }}>
                <Pencil className="size-4" /> Uredi
              </Link>
            </Button>
          </div>
        ))}

        {articles.data.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Još nema vijesti. Dodaj prvu.
          </p>
        )}
      </div>
    </div>
  );
}
