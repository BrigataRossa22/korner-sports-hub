import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/fudbal")({
  head: () => ({
    meta: [
      { title: "Fudbal — Korner BiH" },
      {
        name: "description",
        content: "Reprezentacija BiH, Premijer liga, transferi i analize iz svijeta fudbala.",
      },
      { property: "og:title", content: "Fudbal — Korner BiH" },
      {
        property: "og:description",
        content: "Reprezentacija BiH, Premijer liga, transferi i analize.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      category="fudbal"
      intro="Reprezentacija, Premijer liga BiH, transferi i analize — sve na jednom mjestu."
    />
  ),
});
