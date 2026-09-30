import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import type { Article } from "@/data/articles";

export function ArticleCard({ article, size = "md" }: { article: Article; size?: "sm" | "md" }) {
  return (
    <article className="group">
      <Link to="/clanak/$slug" params={{ slug: article.slug }} className="block">
        <div className="overflow-hidden bg-muted">
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            width={1200}
            height={800}
            className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <p className="kicker mt-3">{article.kicker}</p>
        <h3
          className={
            size === "sm"
              ? "mt-1 text-base group-hover:text-primary"
              : "mt-1 text-xl group-hover:text-primary"
          }
        >
          {article.title}
        </h3>
        {size === "md" && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.lead}</p>
        )}
        <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{article.published}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {article.comments}
          </span>
        </p>
      </Link>
    </article>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  return (
    <Link
      to="/clanak/$slug"
      params={{ slug: article.slug }}
      className="group flex gap-3 border-b border-border py-3 last:border-0"
    >
      <img
        src={article.image}
        alt={article.title}
        loading="lazy"
        width={1200}
        height={800}
        className="size-20 shrink-0 object-cover"
      />
      <div>
        <p className="kicker">{article.kicker}</p>
        <h4 className="mt-0.5 text-sm leading-snug group-hover:text-primary">{article.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{article.published}</p>
      </div>
    </Link>
  );
}
