import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleCard, ArticleFeedItem, ArticleTile } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { LoadError } from "@/components/RouteFallbacks";
import { byCategory, categoryLabels } from "@/lib/content";
import { getPublicContent, type Category } from "@/lib/content.functions";

export const Route = createFileRoute("/")({
  loader: () => getPublicContent(),
  head: ({ loaderData }) => {
    const lead = loaderData?.articles.find((a) => a.isHeadline) ?? loaderData?.articles[0];
    const title = lead ? `${lead.title} — Korner BiH` : "Korner BiH — Sportske vijesti iz BiH";
    const description = lead?.lead ?? "Fudbal, košarka i ostali sportovi iz Bosne i Hercegovine.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (lead?.imageAbs) {
      meta.push(
        { property: "og:image", content: lead.imageAbs },
        { name: "twitter:image", content: lead.imageAbs },
      );
    }
    return { meta };
  },
  errorComponent: LoadError,
  component: Index,
});

const FEED_STEP = 12;

// Rubrike na početnoj, redom kojim se prikazuju
const BLOCKS: { category: Category; to: string }[] = [
  { category: "wwin-liga", to: "/wwin-liga" },
  { category: "reprezentacija", to: "/reprezentacija" },
  { category: "kup-bih", to: "/kup-bih" },
  { category: "u-evropi", to: "/u-evropi" },
  { category: "nize-lige", to: "/nize-lige" },
  { category: "kosarka", to: "/kosarka" },
  { category: "ostali-sportovi", to: "/ostali-sportovi" },
  { category: "fudbal", to: "/fudbal" },
];

function SectionTitle({ children, to }: { children: string; to?: string }) {
  return (
    <div className="flex items-end justify-between border-b-2 border-primary pb-1.5">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">{children}</h2>
      {to && (
        <Link
          to={to as "/"}
          className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          Sve vijesti →
        </Link>
      )}
    </div>
  );
}

function Index() {
  const content = Route.useLoaderData();
  const all = content.articles;
  const [visible, setVisible] = useState(FEED_STEP);

  // Glavna vijest, pa izdvojene, pa najnovije
  const lead = all.find((a) => a.isHeadline) ?? all[0] ?? null;
  const rest = lead ? all.filter((a) => a.id !== lead.id) : [];
  const picks = [...rest.filter((a) => a.isFeatured), ...rest.filter((a) => !a.isFeatured)];
  const side = picks.slice(0, 2); // desno od glavne vijesti
  const row = picks.slice(2, 6); // red malih ispod
  const shown = new Set([lead?.id, ...side.map((a) => a.id), ...row.map((a) => a.id)]);
  const feed = all.filter((a) => !shown.has(a.id));

  const blocks = BLOCKS.map((b) => ({ ...b, list: byCategory(all, b.category).slice(0, 4) })).filter(
    (b) => b.list.length > 0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <h1 className="sr-only">Korner BiH — sportske vijesti iz Bosne i Hercegovine</h1>

      {!lead ? (
        <p className="py-10 text-muted-foreground">Još nema objavljenih vijesti. Navratite uskoro.</p>
      ) : (
        <>
          {/* ---- Naslovnica: glavna vijest + dvije uz nju ---- */}
          <section className="grid gap-3 lg:grid-cols-3 lg:grid-rows-2">
            <ArticleTile
              article={lead}
              className="aspect-[4/3] sm:aspect-[16/10] lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-[26rem]"
              titleClass="text-2xl sm:text-4xl"
            />
            {side.map((a) => (
              <ArticleTile
                key={a.id}
                article={a}
                className="aspect-[16/10] lg:aspect-auto lg:min-h-[12.5rem]"
                titleClass="text-lg sm:text-xl"
              />
            ))}
          </section>

          {/* ---- Red malih: na telefonu kartice, na većem ekranu preko slike ---- */}
          {row.length > 0 && (
            <>
              <section className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:hidden">
                {row.map((a) => (
                  <ArticleCard key={a.id} article={a} size="sm" />
                ))}
              </section>
              <section className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {row.map((a) => (
                  <ArticleTile
                    key={a.id}
                    article={a}
                    className="aspect-[4/3]"
                    titleClass="text-sm sm:text-base"
                  />
                ))}
              </section>
            </>
          )}

          {/* ---- Najnovije (dugi popis) + desna kolona ---- */}
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
            <section>
              <SectionTitle>Najnovije</SectionTitle>
              <div className="mt-4">
                {feed.slice(0, visible).map((a) => (
                  <ArticleFeedItem key={a.id} article={a} />
                ))}
                {feed.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nema drugih vijesti.</p>
                )}
              </div>
              {visible < feed.length && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + FEED_STEP)}
                    className="rounded-md bg-primary px-8 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:opacity-90"
                  >
                    Učitaj još vijesti
                  </button>
                </div>
              )}
            </section>

            <Sidebar content={content} />
          </div>

          {/* ---- Rubrike ---- */}
          {blocks.map((b) => (
            <section key={b.category} className="mt-12">
              <SectionTitle to={b.to}>{categoryLabels[b.category]}</SectionTitle>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-6 lg:grid-cols-4">
                {b.list.map((a) => (
                  <ArticleCard key={a.id} article={a} size="sm" />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
