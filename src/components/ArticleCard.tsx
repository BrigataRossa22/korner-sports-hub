import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/content";
import type { ArticleDTO } from "@/lib/content.functions";

function Thumb({ article, className }: { article: ArticleDTO; className: string }) {
  if (!article.image) {
    return <div className={`${className} bg-muted`} aria-hidden="true" />;
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
        <div className="overflow-hidden bg-muted">
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
                ? "mt-1 text-base group-hover:text-primary"
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
        <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {article.comments}
          </span>
        </p>
      </Link>
    </article>
  );
}

export function ArticleRow({ article }: { article: ArticleDTO }) {
  return (
    <Link
      to="/clanak/$slug"
      params={{ slug: article.slug }}
      className="group flex gap-3 border-b border-border py-3 last:border-0"
    >
      <div className="shrink-0 overflow-hidden bg-muted">
        <Thumb article={article} className="size-20" />
      </div>
      <div>
        <p className="kicker">{article.kicker}</p>
        <h4 className="mt-0.5 text-sm leading-snug group-hover:text-primary">{article.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(article.publishedAt)}</p>
      </div>
    </Link>
  );
}
