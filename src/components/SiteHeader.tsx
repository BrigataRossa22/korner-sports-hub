import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
<img src="/korner-logo.png" alt="Korner BiH logo" className="size-10 rounded-md" />
import { contentOptions } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";

const nav = [
  { to: "/", label: "Naslovnica" },
  { to: "/fudbal", label: "Fudbal" },
  { to: "/tabela", label: "Tabela" },
  { to: "/kosarka", label: "Košarka" },
  { to: "/ostali-sportovi", label: "Ostali sportovi" },
  { to: "/o-nama", label: "O nama" },
] as const;

function useTicker(): string {
  const hydrated = useHydrated();
  const { data } = useQuery({ ...contentOptions, enabled: hydrated });
  if (!data || data.fixtures.length === 0) return "";

  const upcoming = data.fixtures.filter((f) => !f.finished);
  const shown = (upcoming.length ? upcoming : data.fixtures).slice(0, 2);

  return shown
    .map((f) =>
      f.finished && f.scoreHome !== null && f.scoreAway !== null
        ? `${f.home} ${f.scoreHome}:${f.scoreAway} ${f.away}`
        : `${f.home} – ${f.away} ${f.when}`,
    )
    .join(" · ");
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const ticker = useTicker();

  return (
    <header className="sticky top-0 z-50 bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoAsset.url} alt="Korner BiH logo" className="size-10 rounded-md" />
          <span className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold uppercase tracking-tight">Korner</span>
            <span className="rounded-sm bg-primary px-1.5 py-0.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
              BiH
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary-foreground border-primary" }}
              className="border-b-2 border-transparent pb-0.5 font-display text-sm font-medium uppercase tracking-wide text-ink-foreground/75 transition-colors hover:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Meni"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-4 pb-4 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-3 font-display text-sm uppercase tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {ticker && (
        <div className="bg-primary">
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-hidden px-4 py-1.5 text-xs text-primary-foreground">
            <span className="shrink-0 font-display font-semibold uppercase tracking-[0.15em]">
              Uživo
            </span>
            <span className="truncate">{ticker}</span>
          </div>
        </div>
      )}
    </header>
  );
}
