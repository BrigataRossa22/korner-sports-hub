import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/ostali-sportovi")({
  head: () => ({
    meta: [
      { title: "Ostali sportovi — Korner BiH" },
      {
        name: "description",
        content: "Rukomet, atletika, borilački sportovi i ostale bh. sportske priče.",
      },
      { property: "og:title", content: "Ostali sportovi — Korner BiH" },
      { property: "og:description", content: "Rukomet, atletika i druge bh. sportske priče." },
    ],
  }),
  component: () => (
    <CategoryPage
      category="ostali-sportovi"
      intro="Rukomet, atletika, borilački sportovi i sve ostalo što nosi bh. boje."
    />
  ),
});
