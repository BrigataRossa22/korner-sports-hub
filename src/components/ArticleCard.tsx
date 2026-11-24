import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/content";
import type { ArticleDTO } from "@/lib/content.functions";

/** "prije 5 min", "prije 3 h", "jučer", a za starije vijesti datum. */
export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "upravo sada";
  if (mins < 60) return `prije ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `prije ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "jučer";
  if (days < 7) return `prije ${days} dana`;
  return formatDate(iso);
}

function Thumb({ article, className }: { article: ArticleDTO; className: string }) {
  if (!article.image) {
    // Vijest bez slike: zeleni prelaz s logom
    return (
      <div
        className={`${className} grid place-items-center bg-gradient-to-br from-primary to-ink`}
        aria-hidden="true"
      >
        <img
          src="/korner-logo.png"
          alt=""
          className="size-1/4 max-h-20 min-h-8 min-w-8 max-w-20 rounded-md object-contain opacity-40"
        />
      </div>
    );
  }
  return (
    <img
      src={article.image}
      alt={article.title}
      loading="lazy"
      width={1200}
      height={800}
      className={`${className} object-cover transition-transform duration-300 group-hover:scale-[1.03]`}
    />
  );
}

function Meta({ article, light }: { article: ArticleDTO; light?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs ${
        light ? "text-white/80" : "text-muted-foreground"
      }`}
    >
      <span suppressHydrationWarning>{timeAgo(article.publishedAt)}</span>
      <span className="flex items-center gap-1">
        <MessageSquare className="size-3" />
        {article.comments}
      </span>
    </p>
  );
}

/** Klasična kartica: slika, rubrika, naslov, uvod. */
export function ArticleCard({
  article,
  size = "md",
}: {
  article: ArticleDTO;
  size?: "sm" | "md" | "hero";
}) {
  const hero = size === "hero";

  return (
    <article className="group">
      <Link to="/clanak/$slug" params={{ slug: article.slug }} className="block">
        <div className="overflow-hidden rounded-lg bg-muted">
          <Thumb
            article={article}
            className={hero ? "aspect-[16/9] w-full" : "aspect-[3/2] w-full"}
          />
        </div>
        <p className="kicker mt-3">{article.kicker}</p>
        <h3
          className={
            hero
              ? "mt-1 text-3xl leading-tight group-hover:text-primary"
              : size === "sm"
                ? "mt-1 line-clamp-3 text-[0.95rem] font-bold leading-snug group-hover:text-primary"
                : "mt-1 text-xl group-hover:text-primary"
          }
        >
          {article.title}
        </h3>
        {size !== "sm" && (
          <p
            className={
              hero
                ? "mt-3 line-clamp-3 text-base text-muted-foreground"
                : "mt-2 line-clamp-2 text-sm text-muted-foreground"
            }
          >
            {article.lead}
          </p>
        )}
        <div className="mt-2">
          <Meta article={article} />
        </div>
      </Link>
    </article>
  );
}

/** Mali red: sličica lijevo, naslov desno (Najčitanije, Povezane vijesti). */
export function ArticleRow({ article }: { article: ArticleDTO }) {
  return (
    <Link
      to="/clanak/$slug"
      params={{ slug: article.slug }}
      className="group flex gap-3 border-b border-border py-3 last:border-0"
    >
      <div className="shrink-0 overflow-hidden rounded bg-muted">
        <Thumb article={article} className="size-20" />
      </div>
      <div>
        <p className="kicker">{article.kicker}</p>
        <h4 className="mt-0.5 text-sm leading-snug group-hover:text-primary">{article.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
          {timeAgo(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

/** Slika preko cijele kartice, naslov na tamnom prelazu (kao na velikim portalima). */
export function ArticleTile({
  article,
  className = "",
  titleClass = "text-base sm:text-lg",
}: {
  article: ArticleDTO;
  className?: string;
  titleClass?: string;
}) {
  return (
    <Link
      to="/clanak/$slug"
      params={{ slug: article.slug }}
      className={`group relative block overflow-hidden rounded-lg bg-ink ${className}`}
    >
      <Thumb article={article} className="absolute inset-0 size-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        {article.kicker && (
          <span className="inline-block rounded-sm bg-primary px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            {article.kicker}
          </span>
        )}
        <h3
          className={`mt-1.5 line-clamp-4 font-display font-bold leading-tight text-white group-hover:underline ${titleClass}`}
        >
          {article.title}
        </h3>
        <div className="mt-1.5">
          <Meta article={article} light />
        </div>
      </div>
    </Link>
  );
}

/** Red za dugi popis "Najnovije": veća slika, naslov, uvod i vrijeme. */
export function ArticleFeedItem({ article }: { article: ArticleDTO }) {
  return (
    <article className="group border-b border-border py-4 first:pt-0 last:border-0">
      <Link
        to="/clanak/$slug"
        params={{ slug: article.slug }}
        className="flex gap-4"
      >
        <div className="w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-52">
          <Thumb article={article} className="aspect-[3/2] w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="kicker">{article.kicker}</p>
          <h3 className="mt-1 line-clamp-3 text-base leading-snug group-hover:text-primary sm:text-xl">
            {article.title}
          </h3>
          <p className="mt-1.5 hidden line-clamp-2 text-sm text-muted-foreground sm:block">
            {article.lead}
          </p>
          <div className="mt-2">
            <Meta article={article} />
          </div>
        </div>
      </Link>
    </article>
  );
}
