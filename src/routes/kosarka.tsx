import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/kosarka")({
  head: () => ({
    meta: [
      { title: "Košarka — Korner BiH" },
      {
        name: "description",
        content: "Košarkaška reprezentacija BiH, domaća liga, ABA liga i Evropa.",
      },
      { property: "og:title", content: "Košarka — Korner BiH" },
      { property: "og:description", content: "Reprezentacija, domaća liga i evropska takmičenja." },
    ],
  }),
  component: () => (
    <CategoryPage
      category="kosarka"
      intro="Reprezentacija, domaća liga i evropska takmičenja iz ugla naših klubova."
    />
  ),
});
