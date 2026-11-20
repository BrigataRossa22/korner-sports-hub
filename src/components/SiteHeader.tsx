import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import { getLeagueMatches, type LeagueMatch } from "@/lib/leaguematches.functions";
import { displayClub, sameClub } from "@/lib/club-match";
import { getH2HData } from "@/lib/h2h.functions";
import { useClubCrest } from "@/lib/use-club-crest";
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

const fmtShort = (d: string | null, season: string) => {
  if (!d) return season;
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}.${m}.${y}.` : season;
};

// Međusobni omjer dva kluba (liga i Kup BiH, sve sezone)
function H2HPanel({ home, away }: { home: string; away: string }) {
  const hydrated = useHydrated();
  const crestFor = useClubCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["h2h-data-v3"],
    queryFn: () => getH2HData(),
    staleTime: 60 * 60 * 1000,
    enabled: hydrated,
  });

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
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  const crestA = crestFor(home);
  const crestB = crestFor(away);

  return (
    <div className="mt-3 rounded-xl bg-white/95 p-4 text-card-foreground shadow-lg">
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Međusobni omjer
      </p>

      {isLoading || !data ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Učitavam…</p>
      ) : total === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Ovi klubovi se još nisu sastajali u ligi ni Kupu BiH.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex w-1/3 flex-col items-center gap-1 text-center">
              {crestA ? (
                <img src={crestA} alt="" className="size-10 object-contain" />
              ) : (
                <span className="size-10" />
              )}
              <span className="text-[11px] font-bold uppercase leading-tight">
                {displayClub(home)}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center gap-3 font-display tabular-nums">
              <span className="text-3xl font-bold text-green-700">{winsA}</span>
              <span className="text-xl font-bold text-yellow-600">{draws}</span>
              <span className="text-3xl font-bold text-red-700">{winsB}</span>
            </div>

            <div className="flex w-1/3 flex-col items-center gap-1 text-center">
              {crestB ? (
                <img src={crestB} alt="" className="size-10 object-contain" />
              ) : (
                <span className="size-10" />
              )}
              <span className="text-[11px] font-bold uppercase leading-tight">
                {displayClub(away)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
            <span className="bg-green-600" style={{ width: `${pct(winsA)}%` }} />
            <span className="bg-yellow-400" style={{ width: `${pct(draws)}%` }} />
            <span className="bg-red-600" style={{ width: `${pct(winsB)}%` }} />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pobjede · Neriješeno · Pobjede &nbsp;|&nbsp; golovi {goalsA}:{goalsB} u {total}{" "}
            {total === 1 ? "utakmici" : "utakmica"}
          </p>

          <ul className="mt-3 divide-y divide-border/70 border-t border-border/70 text-xs">
            {list.slice(0, 5).map((m, i) => (
              <li key={i} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 py-1.5">
                <span className="text-[10px] text-muted-foreground">{fmtShort(m.date, m.season)}</span>
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
  );
}

// Najava sljedećeg kola na početnoj stranici
function MatchStrip({ ticker }: { ticker: Ticker }) {
  const crestFor = useClubCrest();
  const [selected, setSelected] = useState<string | null>(null);
  const sel = ticker.matches.find((m) => m.id === selected) ?? null;

  return (
    <div className="bg-gradient-to-b from-[#1f5a3a] to-[#143d28]">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-white">
            {ticker.round}. kolo
          </p>
          <p className="text-[11px] text-white/60">Dodirni utakmicu za međusobni omjer</p>
        </div>

        <div
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {ticker.matches.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(active ? null : m.id)}
                className={`w-[78%] shrink-0 snap-start rounded-xl bg-white/95 px-3.5 py-3 text-left text-card-foreground shadow-md transition sm:w-64 ${
                  active ? "ring-2 ring-emerald-300" : "hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {dayLabel(m.match_date)}
                  </span>
                  <span className="rounded-full bg-[#1f5a3a]/10 px-2 py-0.5 font-display text-sm font-bold tabular-nums text-[#1f5a3a]">
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
            );
          })}
        </div>

        {sel && <H2HPanel key={sel.id} home={sel.home} away={sel.away} />}
      </div>
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

    </header>

    {isHome && ticker && <MatchStrip ticker={ticker} />}
    </>
  );
}
