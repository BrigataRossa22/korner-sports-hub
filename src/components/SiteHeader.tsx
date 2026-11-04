import { Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import { getLeagueMatches } from "@/lib/leaguematches.functions";
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

const repSub: ReadonlyArray<Item> = [
  { to: "/reprezentacija", label: "Vijesti" }, 
  { to: "/reprezentacija-arhiva", label: "Arhiva utakmica" },
  { to: "/reprezentacija-statistika", label: "Statistika" },
];

const navPlain = [
  { to: "/klubovi", label: "Klubovi" },
  { to: "/nize-lige", label: "Niže lige" },
] as const;

// Na telefonu: WWiN liga i Kup BiH imaju i "Vijesti" kao prvu stavku
const mobileGroups: { id: string; label: string; items: ReadonlyArray<Item> }[] = [
  { id: "wwin", label: "WWiN liga", items: [{ to: "/wwin-liga", label: "Vijesti" }, ...wwinSub] },
  { id: "kup", label: "Kup BiH", items: [{ to: "/kup-bih", label: "Vijesti" }, ...kupSub] },
  { id: "stat", label: "Statistika", items: statSub },
  { id: "rep", label: "Reprezentacija", items: repSub },
];

type Ticker = { round: number; items: string[] };

// Datum kao "07.11." (i vrijeme, ako je upisano)
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
  if (iso.length > 10 && (d.getHours() !== 0 || d.getMinutes() !== 0)) {
    return `${date} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return date;
}

// Sljedeće kolo lige: prvo kolo u kojem je odigrano manje od pola utakmica
// (odgođene utakmice iz ranijih kola ne smetaju). Prikazuju se njegove neodigrane utakmice.
function useTicker(): Ticker | null {
  const hydrated = useHydrated();
  const { data } = useQuery({
    queryKey: ["league-matches"],
    queryFn: () => getLeagueMatches(),
    enabled: hydrated,
  });
  if (!data || data.length === 0) return null;

  const hasResult = (m: { score_home: number | null; score_away: number | null }) =>
    m.score_home !== null && m.score_away !== null;

  const byRound = new Map<number, typeof data>();
  for (const m of data) {
    if (!m.round) continue;
    byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  for (const r of rounds) {
    const ms = byRound.get(r) ?? [];
    const played = ms.filter(hasResult).length;
    if (played * 2 >= ms.length) continue;
    const upcoming = ms
      .filter((m) => !hasResult(m))
      .sort((a, b) => a.match_date.localeCompare(b.match_date));
    if (upcoming.length === 0) continue;
    return {
      round: r,
      items: upcoming.map((m) => `${m.home} – ${m.away} ${shortDate(m.match_date)}`.trim()),
    };
  }
  return null;
}

function Dropdown({
  to,
  label,
  items,
}: {
  to: "/wwin-liga" | "/kup-bih" | "/statistika" | "/reprezentacija";
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
          <Dropdown to="/reprezentacija" label="Reprezentacija" items={repSub} />
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
          <style>{`
            @keyframes korner-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            .korner-ticker-track { display: inline-flex; white-space: nowrap; animation: korner-ticker var(--korner-ticker-time, 30s) linear infinite; }
            .korner-ticker-wrap:hover .korner-ticker-track { animation-play-state: paused; }
            @media (prefers-reduced-motion: reduce) { .korner-ticker-track { animation: none; } }
          `}</style>
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-hidden px-4 py-1.5 text-xs text-primary-foreground">
            <span className="shrink-0 font-display font-semibold uppercase tracking-[0.15em]">
              Sljedeće utakmice:
            </span>
            <div className="korner-ticker-wrap min-w-0 flex-1 overflow-hidden">
              <div
                className="korner-ticker-track"
                style={{ "--korner-ticker-time": `${Math.max(20, ticker.items.join("").length * 0.3)}s` } as CSSProperties}
              >
                {[0, 1].map((n) => (
                  <span key={n} className="pr-12" aria-hidden={n === 1}>
                    <span className="font-semibold">{ticker.round}. kolo</span>
                    {" · "}
                    {ticker.items.join(" · ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
