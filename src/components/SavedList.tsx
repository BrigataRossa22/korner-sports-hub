import { Link } from "@tanstack/react-router";
import { Bookmark, Trash2 } from "lucide-react";
import { timeAgo } from "@/components/ArticleCard";
import { useSaved } from "@/lib/use-saved";

/** Popis sačuvanih vijesti u profilu. */
export function SavedList() {
  const s = useSaved();

  if (s.loading) return <p className="mt-6 text-sm text-muted-foreground">Učitavam…</p>;
  if (s.rows.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
        <Bookmark className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-semibold">Još nema sačuvanih vijesti</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Na svakoj vijesti klikni "Za kasnije" i ona će se pojaviti ovdje.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-6 divide-y divide-border border-y border-border">
      {s.rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <Link
              to="/clanak/$slug"
              params={{ slug: r.slug }}
              className="text-sm font-semibold leading-snug hover:text-primary"
            >
              {r.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
              Sačuvano {timeAgo(r.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void s.toggle(r.slug, r.title)}
            aria-label="Ukloni iz sačuvanih"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
