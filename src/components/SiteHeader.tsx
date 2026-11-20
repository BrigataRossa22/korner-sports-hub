import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import { getLeagueMatches, type LeagueMatch } from "@/lib/leaguematches.functions";
import { displayClub, sameClub } from "@/lib/club-match";
import { getH2HData } from "@/lib/h2h.functions";
import { useClubCrest } from "@/lib/use-club-crest";
import { MemberMenu } from "@/components/MemberMenu";
import { LockedBox } from "@/components/MemberLock";
import { useMembership } from "@/lib/use-membership";
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

type Ticker = { round: number; matches: LeagueMatch[] };

const DAYS = ["NED", "PON", "UTO", "SRI", "ČET", "PET", "SUB"];

// Dan i datum, npr. "PET, 06.11."
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

// Vrijeme utakmice (ako je upisano), inače crtica
function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || iso.length <= 10) return "—";
  if (d.getHours() === 0 && d.getMinutes() === 0) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
    return { round: r, matches: upcoming };
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

// 1 utakmica, 2-4 utakmice, 5+ utakmica
const utakmicaWord = (n: number) => {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return "utakmica";
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "utakmice";
  return "utakmica";
};

const fmtShort = (d: string | null, season: string) => {
  if (!d) return season;
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}.${m}.${y}.` : season;
};

// Prozor s međusobnim omjerom dva kluba (liga i Kup BiH, sve sezone)
function H2HDialog({ home, away, onClose }: { home: string; away: string; onClose: () => void }) {
  const hydrated = useHydrated();
  const crestFor = useClubCrest();
  const member = useMembership();
  // Međusobni omjer vide samo članovi i admini
  const { data, isLoading } = useQuery({
    queryKey: ["h2h-data-v3"],
    queryFn: () => getH2HData(),
    staleTime: 60 * 60 * 1000,
    enabled: hydrated && member.hasAccess,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = (data?.matches ?? [])
    .filter(
      (m) =>
        (sameClub(m.home, home) && sameClub(m.away, away)) ||
        (sameClub(m.home, away) && sameClub(m.away, home)),
    )
    .sort((x, y) =>
      (y.date ?? `${y.season.slice(0, 4)}-07-01`).localeCompare(
        x.date ?? `${x.season.slice(0, 4)}-07-01`,
      ),
    );

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let goalsA = 0;
  let goalsB = 0;
  for (const m of list) {
    const aHome = sameClub(m.home, home);
    const a = aHome ? m.sh : m.sa;
    const b = aHome ? m.sa : m.sh;
    goalsA += a;
    goalsB += b;
    if (a > b) winsA++;
    else if (a < b) winsB++;
    else draws++;
  }
  const total = list.length;

  const Crest = ({ club }: { club: string }) => {
    const c = crestFor(club);
    return c ? (
      <img src={c} alt="" className="size-14 object-contain" />
    ) : (
      <span className="size-14" />
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Međusobni omjer"
    >
      <div
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 text-neutral-900 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
        >
          <X className="size-5" />
        </button>

        <p className="text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Međusobni omjer
        </p>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div className="flex w-1/3 flex-col items-center gap-2 text-center">
            <Crest club={home} />
            <span className="text-xs font-bold uppercase leading-tight">{displayClub(home)}</span>
          </div>
          <div className="flex w-1/3 flex-col items-center gap-2 text-center">
            <Crest club={away} />
            <span className="text-xs font-bold uppercase leading-tight">{displayClub(away)}</span>
          </div>
        </div>

        {member.loading ? (
          <p className="py-8 text-center text-sm text-neutral-500">Učitavam…</p>
        ) : !member.hasAccess ? (
          <LockedBox />
        ) : isLoading || !data ? (
          <p className="py-8 text-center text-sm text-neutral-500">Učitavam…</p>
        ) : total === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            Ovi klubovi se još nisu sastajali u ligi ni Kupu BiH.
          </p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 text-center tabular-nums">
              <div>
                <p className="text-4xl font-bold text-[#2f7d4f]">{winsA}</p>
                <p className="mt-1 text-[11px] uppercase text-neutral-500">Pobjeda</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-neutral-400">{draws}</p>
                <p className="mt-1 text-[11px] uppercase text-neutral-500">Neriješeno</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#2f7d4f]">{winsB}</p>
                <p className="mt-1 text-[11px] uppercase text-neutral-500">Pobjeda</p>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-neutral-600">
              Golovi {goalsA}:{goalsB} · {total} {utakmicaWord(total)}
            </p>

            <ul className="mt-4 divide-y divide-neutral-200 border-t border-neutral-200 text-sm">
              {list.slice(0, 5).map((m, i) => (
                <li key={i} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-2">
                  <span className="text-[11px] text-neutral-500">{fmtShort(m.date, m.season)}</span>
                  <span className="truncate">
                    {displayClub(m.home)} – {displayClub(m.away)}
                  </span>
                  <span className="font-bold tabular-nums">
                    {m.sh}:{m.sa}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// Najava sljedećeg kola na početnoj stranici
function MatchStrip({ ticker }: { ticker: Ticker }) {
  const crestFor = useClubCrest();
  const [selected, setSelected] = useState<string | null>(null);
  const sel = ticker.matches.find((m) => m.id === selected) ?? null;

  return (
    <div className="border-b border-[#d3e3d8] bg-[#eaf3ec]">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2f7d4f]">
          {ticker.round}. kolo
        </p>

        <div
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {ticker.matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              className="w-[75%] shrink-0 snap-start rounded-xl border border-[#d3e3d8] bg-white px-3.5 py-3 text-left text-neutral-900 transition hover:border-[#2f7d4f] sm:w-64"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-neutral-500">
                <span>{dayLabel(m.match_date)}</span>
                <span className="text-sm font-bold tabular-nums text-[#2f7d4f]">
                  {timeLabel(m.match_date)}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {[m.home, m.away].map((team) => {
                  const c = crestFor(team);
                  return (
                    <div key={team} className="flex items-center gap-2.5">
                      {c ? (
                        <img src={c} alt="" className="size-6 shrink-0 object-contain" />
                      ) : (
                        <span className="size-6 shrink-0" />
                      )}
                      <span className="truncate text-[13px] font-bold uppercase">
                        {displayClub(team)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {sel && <H2HDialog home={sel.home} away={sel.away} onClose={() => setSelected(null)} />}
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const ticker = useTicker();
  // Traka sa sljedećim kolom se prikazuje samo na prvoj (početnoj) stranici
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });

  const closeAll = () => {
    setOpen(false);
    setOpenGroup(null);
  };

  return (
    <>
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

        <div className="ml-auto flex items-center gap-3">
          <MemberMenu />
          <button
            type="button"
            aria-label="Meni"
            onClick={() => {
              setOpen((v) => !v);
              setOpenGroup(null);
            }}
            className="md:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
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

    </header>

    {isHome && ticker && <MatchStrip ticker={ticker} />}
    </>
  );
}
