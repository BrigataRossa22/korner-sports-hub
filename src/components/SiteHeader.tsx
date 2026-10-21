import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import { contentOptions } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";

const linkClass =
  "border-b-2 border-transparent pb-0.5 font-display text-sm font-medium uppercase tracking-wide text-ink-foreground/75 transition-colors hover:text-primary-foreground";
const activeProps = { className: "text-primary-foreground border-primary" };

type Item = { to: string; label: string };

const wwinSub: ReadonlyArray<Item> = [
  { to: "/tabela", label: "Tabela 26/27" },
  { to: "/raspored-i-rezultati", label: "Raspored i rezultati 26/27" },
];

const kupSub: ReadonlyArray<Item> = [
  { to: "/kup-sezona", label: "Sezona 26/27" },
  { to: "/kup-arhiva", label: "Arhiva sezona" },
  { to: "/kup-osvajaci", label: "Osvajači" },
];

const statSub: ReadonlyArray<Item> = [
  { to: "/stare-sezone", label: "Arhiva sezona" },
  { to: "/pobjednici", label: "Pobjednici" },
  { to: "/medjusobni-susreti", label: "Međusobni susreti" },
  { to: "/brojke", label: "Brojke" },
  { to: "/gledanost", label: "Gledanost" },  
  { to: "/all-time-lista", label: "Vječna tabela" },
  { to: "/u-evropi", label: "U Evropi" },
];

const navPlain = [
  { to: "/klubovi", label: "Klubovi" },
  { to: "/reprezentacija", label: "Reprezentacija" },
  { to: "/nize-lige", label: "Niže lige" },
] as const;

// Na telefonu: WWiN liga i Kup BiH imaju i "Vijesti" kao prvu stavku
const mobileGroups: { id: string; label: string; items: ReadonlyArray<Item> }[] = [
  { id: "wwin", label: "WWiN liga", items: [{ to: "/wwin-liga", label: "Vijesti" }, ...wwinSub] },
  { id: "kup", label: "Kup BiH", items: [{ to: "/kup-bih", label: "Vijesti" }, ...kupSub] },
  { id: "stat", label: "Statistika", items: statSub },
];

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

function Dropdown({
  to,
  label,
  items,
}: {
  to: "/wwin-liga" | "/kup-bih" | "/statistika";
  label: string;
  items: ReadonlyArray<Item>;
}) {
  return (
    <div className="group relative">
      <Link to={to} activeProps={activeProps} className={`${linkClass} inline-flex items-center gap-1`}>
        {label}
        <ChevronDown className="size-3.5" />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="min-w-56 rounded-md border border-white/10 bg-ink py-2 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary-foreground" }}
              className="block px-4 py-2 font-display text-sm uppercase tracking-wide text-ink-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const ticker = useTicker();

  const closeAll = () => {
    setOpen(false);
    setOpenGroup(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/korner-logo.png" alt="Korner BiH logo" className="size-10 rounded-md" />
          <span className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold uppercase tracking-tight">Korner</span>
            <span className="rounded-sm bg-primary px-1.5 py-0.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
              BiH
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
          <Dropdown to="/wwin-liga" label="WWiN liga" items={wwinSub} />
          <Dropdown to="/kup-bih" label="Kup BiH" items={kupSub} />
          <Dropdown to="/statistika" label="Statistika" items={statSub} />
          {navPlain.map((item) => (
            <Link key={item.to} to={item.to} activeProps={activeProps} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Meni"
          onClick={() => {
            setOpen((v) => !v);
            setOpenGroup(null);
          }}
          className="ml-auto md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav className="max-h-[80vh] overflow-y-auto border-t border-white/10 px-4 pb-4 md:hidden">
          {mobileGroups.map((g) => {
            const isOpen = openGroup === g.id;
            return (
              <div key={g.id} className="border-b border-white/10">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : g.id)}
                  className="flex w-full items-center justify-between py-3 font-display text-sm uppercase tracking-wide"
                >
                  {g.label}
                  <ChevronDown
                    className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-2">
                    {g.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeAll}
                        className="block py-2.5 pl-5 font-display text-sm uppercase tracking-wide text-ink-foreground/75"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {navPlain.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeAll}
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
