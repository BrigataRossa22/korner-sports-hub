import { queryOptions } from "@tanstack/react-query";
import { getPublicContent, type ArticleDTO, type Category } from "./content.functions";

export { type ArticleDTO, type Category } from "./content.functions";

export const contentOptions = queryOptions({
  queryKey: ["korner-content"],
  queryFn: () => getPublicContent(),
});

export const categoryLabels: Record<Category, string> = {
  fudbal: "Fudbal",
  kosarka: "Košarka",
  "ostali-sportovi": "Ostali sportovi",
  "wwin-liga": "WWiN liga",
  reprezentacija: "Reprezentacija",
  "nize-lige": "Niže lige",
};

export const categoryHrefs: Record<Category, string> = {
  fudbal: "/fudbal",
  kosarka: "/kosarka",
  "ostali-sportovi": "/ostali-sportovi",
  "wwin-liga": "/wwin-liga",
  reprezentacija: "/reprezentacija",
  "nize-lige": "/nize-lige",
};

/** "2026-09-30T12:00:00+02:00" -> "30.09.2026." */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}.`;
}

export function homeLayout(articles: ArticleDTO[]) {
  const lead = articles.find((a) => a.isHeadline) ?? articles[0] ?? null;
  const withoutLead = lead ? articles.filter((a) => a.id !== lead.id) : [];
  const featured = withoutLead.filter((a) => a.isFeatured);
  const secondary = featured.length >= 2 ? featured.slice(0, 2) : withoutLead.slice(0, 2);
  const grid = withoutLead
    .filter((a) => !secondary.some((s) => s.id === a.id))
    .slice(0, 6);

  return { lead, secondary, grid };
}

export function mostRead(articles: ArticleDTO[], limit = 5) {
  return [...articles].sort((a, b) => b.comments - a.comments).slice(0, limit);
}

export function byCategory(articles: ArticleDTO[], category: Category) {
  return articles.filter((a) => a.category === category);
}
