import { createFileRoute } from "@tanstack/react-router";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export const Route = createFileRoute("/_authenticated/admin/nova")({
  head: () => ({
    meta: [
      { title: "Nova vijest — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewArticlePage,
});

function NewArticlePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Nova vijest</h1>
      <ArticleEditor />
    </div>
  );
}
