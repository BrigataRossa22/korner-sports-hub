import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getNationalGoals, type NationalGoal } from "@/lib/nationalgoals.functions";

export const Route = createFileRoute("/reprezentacija-statistika")({
  head: () => ({
    meta: [
      { title: "Statistika reprezentacije — Korner BiH" },
      {
        name: "description",
        content: "Statistika A reprezentacije Bosne i Hercegovine: najbolji strijelci i treneri.",
      },
    ],
  }),
  component: StatistikaReprezentacije,
});

const ALL = "sve";
const TOP_N = 10;

type Tab = "strijelci" | "treneri";

type Scorer = {
  player: string;
  goals: number;
  pens: number;
  matches: number;
  first: string;
  last: string;
};

type Coach = {
  name: string;
  born: string;
  from: string;
  to: string | null;
  time: string;
  m: number;
  w: number;
  d: number;
  l: number;
};

const COACHES: Coach[] = [
  { name: "Sergej Barbarez", born: "17.09.1971.", from: "19.04.2024.", to: null, time: "2 god. 6 mj.", m: 30, w: 11, d: 9, l: 10 },
  { name: "Savo Milošević", born: "02.09.1973.", from: "29.09.2023.", to: "16.04.2024.", time: "6 mj.", m: 5, w: 1, d: 0, l: 4 },
  { name: "Meho Kodro", born: "12.01.1967.", from: "03.08.2023.", to: "21.09.2023.", time: "1 mj.", m: 2, w: 1, d: 0, l: 1 },
  { name: "Faruk Hadžibegić", born: "07.10.1957.", from: "04.01.2023.", to: "23.06.2023.", time: "5 mj.", m: 4, w: 1, d: 0, l: 3 },
  { name: "Ivaylo Petev", born: "09.07.1975.", from: "27.01.2021.", to: "31.12.2022.", time: "1 god. 11 mj.", m: 20, w: 6, d: 7, l: 7 },
  { name: "Dušan Bajević", born: "10.12.1948.", from: "21.12.2019.", to: "01.12.2020.", time: "11 mj.", m: 8, w: 0, d: 2, l: 6 },
  { name: "Robert Prosinečki", born: "12.01.1969.", from: "04.01.2018.", to: "27.11.2019.", time: "1 god. 10 mj.", m: 22, w: 9, d: 6, l: 7 },
  { name: "Mehmed Baždarević", born: "28.09.1960.", from: "13.12.2014.", to: "19.10.2017.", time: "2 god. 10 mj.", m: 24, w: 14, d: 4, l: 6 },
  { name: "Safet Sušić", born: "13.04.1955.", from: "29.12.2009.", to: "17.11.2014.", time: "4 god. 10 mj.", m: 49, w: 23, d: 9, l: 17 },
  { name: "Miroslav Blažević", born: "10.02.1935.", from: "10.07.2008.", to: "12.12.2009.", time: "1 god. 5 mj.", m: 17, w: 8, d: 2, l: 7 },
  { name: "Denijal Pirić", born: "27.09.1946.", from: "18.05.2008.", to: "30.06.2008.", time: "1 mj.", m: 1, w: 1, d: 0, l: 0 },
  { name: "Meho Kodro", born: "12.01.1967.", from: "05.01.2008.", to: "20.05.2008.", time: "4 mj.", m: 2, w: 0, d: 1, l: 1 },
  { name: "Fuad Muzurović", born: "03.11.1945.", from: "22.12.2006.", to: "17.12.2007.", time: "11 mj.", m: 9, w: 3, d: 0, l: 6 },
  { name: "Blaž Slišković", born: "30.05.1959.", from: "27.03.2002.", to: "11.10.2006.", time: "4 god. 6 mj.", m: 37, w: 11, d: 11, l: 15 },
  { name: "Miso Smajlović", born: "28.10.1938.", from: "24.01.2000.", to: "07.10.2001.", time: "1 god. 8 mj.", m: 26, w: 12, d: 7, l: 7 },
  { name: "Faruk Hadžibegić", born: "07.10.1957.", from: "11.03.1999.", to: "09.10.1999.", time: "6 mj.", m: 7, w: 2, d: 2, l: 3 },
  { name: "Džemaludin Musović", born: "30.10.1944.", from: "14.05.1998.", to: "27.01.1999.", time: "8 mj.", m: 7, w: 1, d: 2, l: 4 },
  { name: "Fuad Muzurović", born: "03.11.1945.", from: "30.11.1995.", to: "05.11.1997.", time: "1 god. 11 mj.", m: 18, w: 7, d: 2, l: 9 },
];

type CoachTotal = {
  name: string;
  born: string;
  mandates: number;
  m: number;
  w: number;
  d: number;
  l: number;
};

const ppg = (w: number, d: number, m: number) => (m ? (3 * w + d) / m : 0);
const pct = (w: number, m: number) => (m ? Math.round((w / m) * 100) : 0);

const PHOTO_BASE =
  "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/treneri";
const PHOTO_EXTS = ["jpeg", "jpg", "png", "webp"];

// "Sergej Barbarez" -> "sergej.barbarez"
const photoName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

function CoachAvatar({ name }: { name: string }) {
  const [i, setI] = useState(0);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  if (i >= PHOTO_EXTS.length) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground sm:size-11">
        {initials}
      </span>
    );
  }
  return (
    <img
      key={i}
      src={`${PHOTO_BASE}/${photoName(name)}.${PHOTO_EXTS[i]}`}
      alt={name}
      loading="lazy"
      onError={() => setI(i + 1)}
      className="size-9 shrink-0 rounded-full border border-border object-cover object-top sm:size-11"
    />
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
}

function buildScorers(goals: NationalGoal[]): Scorer[] {
  const map = new Map<string, { goals: number; pens: number; dates: Set<string>; years: string[] }>();
  for (const g of goals) {
    if (g.team !== "B" || g.kind === "o") continue;
    const cur = map.get(g.player) ?? { goals: 0, pens: 0, dates: new Set<string>(), years: [] };
    cur.goals++;
    if (g.kind === "p") cur.pens++;
    cur.dates.add(g.match_date.slice(0, 10));
    cur.years.push(g.match_date.slice(0, 4));
    map.set(g.player, cur);
  }
  return [...map.entries()]
    .map(([player, v]) => {
      const years = v.years.slice().sort();
      return {
        player,
        goals: v.goals,
        pens: v.pens,
        matches: v.dates.size,
        first: years[0],
        last: years[years.length - 1],
      };
    })
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        a.matches - b.matches ||
        a.player.localeCompare(b.player, "hr"),
    );
}

const OPTIONS: { id: Tab; title: string; text: string }[] = [
  { id: "strijelci", title: "Najbolji strijelci", text: "Svi strijelci reprezentacije od 1995." },
  { id: "treneri", title: "Treneri", text: "Statistika selektora reprezentacije" },
];

function CoachesView() {
  const [view, setView] = useState<"mandati" | "ukupno">("mandati");

  const totals = useMemo(() => {
    const map = new Map<string, CoachTotal>();
    for (const c of COACHES) {
      const cur = map.get(c.name) ?? {
        name: c.name,
        born: c.born,
        mandates: 0,
        m: 0,
        w: 0,
        d: 0,
        l: 0,
      };
      cur.mandates++;
      cur.m += c.m;
      cur.w += c.w;
      cur.d += c.d;
      cur.l += c.l;
      map.set(c.name, cur);
    }
    return [...map.values()].sort((a, b) => b.m - a.m || b.w - a.w);
  }, []);

  const allMatches = COACHES.reduce((s, c) => s + c.m, 0);
  const best = totals
    .filter((t) => t.m >= 10)
    .sort((a, b) => ppg(b.w, b.d, b.m) - ppg(a.w, a.d, a.m))[0];
  const most = totals[0];
  const maxM = most?.m ?? 1;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Selektora", totals.length],
          ["Mandata", COACHES.length],
          ["Utakmica", allMatches],
          ["Najbolji bod/ut.", best ? ppg(best.w, best.d, best.m).toFixed(2) : "—"],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-xl border border-border bg-card px-3 py-4 text-center sm:px-4"
          >
            <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {most && best && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-card px-5 py-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Najviše utakmica
            </p>
            <div className="mt-2 flex items-center gap-3">
              <CoachAvatar name={most.name} />
              <p className="font-display text-lg font-bold uppercase">{most.name}</p>
            </div>
            <p className="mt-2 text-4xl font-bold tabular-nums text-primary">{most.m}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {most.w} pobjeda · {most.d} neriješenih · {most.l} poraza
            </p>
          </div>
          <div className="rounded-xl border-2 border-border bg-card px-5 py-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Najbolji prosjek bodova (min. 10 utakmica)
            </p>
            <div className="mt-2 flex items-center gap-3">
              <CoachAvatar name={best.name} />
              <p className="font-display text-lg font-bold uppercase">{best.name}</p>
            </div>
            <p className="mt-2 text-4xl font-bold tabular-nums text-primary">
              {ppg(best.w, best.d, best.m).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {best.m} utakmica · {pct(best.w, best.m)}% pobjeda
            </p>
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-2">
        {(
          [
            ["mandati", "Po mandatima"],
            ["ukupno", "Ukupno po treneru"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase sm:px-4 ${
              view === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {view === "mandati" ? (
          <table className="w-full border-collapse text-[13px] tabular-nums sm:text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2 text-left sm:px-4">Selektor</th>
                <th className="hidden px-3 py-2 text-left sm:table-cell">Mandat</th>
                <th className="px-1.5 py-2 text-right sm:px-3">Ut.</th>
                <th className="px-1.5 py-2 text-right sm:px-3">P</th>
                <th className="px-1.5 py-2 text-right sm:px-3">N</th>
                <th className="px-1.5 py-2 text-right sm:px-3">I</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Bod/ut.</th>
                <th className="hidden px-4 py-2 text-right sm:table-cell">% pob.</th>
              </tr>
            </thead>
            <tbody>
              {COACHES.map((c) => (
                <tr
                  key={`${c.name}${c.from}`}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-2 py-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CoachAvatar name={c.name} />
                      <div className="min-w-0">
                        <span className="block font-medium leading-tight">{c.name}</span>
                        <span className="hidden text-xs text-muted-foreground sm:block">
                          r. {c.born}
                        </span>
                        <span className="block text-[11px] leading-tight text-muted-foreground sm:hidden">
                          {c.from.slice(6, 10)}–{c.to ? c.to.slice(6, 10) : "danas"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-xs text-muted-foreground sm:table-cell">
                    {c.from} –{" "}
                    {c.to ?? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-bold text-primary">
                        trenutno
                      </span>
                    )}
                    <span className="block">{c.time}</span>
                  </td>
                  <td className="px-1.5 py-2 text-right font-bold sm:px-3">{c.m}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{c.w}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{c.d}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{c.l}</td>
                  <td className="hidden px-3 py-2 text-right font-semibold text-primary sm:table-cell">
                    {ppg(c.w, c.d, c.m).toFixed(2)}
                  </td>
                  <td className="hidden px-4 py-2 text-right text-muted-foreground sm:table-cell">
                    {pct(c.w, c.m)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-[13px] tabular-nums sm:text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="w-7 px-2 py-2 text-left sm:w-10 sm:px-4">#</th>
                <th className="px-2 py-2 text-left sm:px-3">Selektor</th>
                <th className="hidden px-3 py-2 text-left sm:table-cell">Utakmice</th>
                <th className="px-1.5 py-2 text-right sm:hidden">Ut.</th>
                <th className="px-1.5 py-2 text-right sm:px-3">P</th>
                <th className="px-1.5 py-2 text-right sm:px-3">N</th>
                <th className="px-1.5 py-2 text-right sm:px-3">I</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Bod/ut.</th>
                <th className="hidden px-4 py-2 text-right sm:table-cell">% pob.</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t, i) => (
                <tr key={t.name} className="border-b border-border/70 last:border-0">
                  <td className="px-2 py-2 text-muted-foreground sm:px-4">{i + 1}</td>
                  <td className="px-2 py-2 sm:px-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CoachAvatar name={t.name} />
                      <div className="min-w-0">
                        <span className="block font-medium leading-tight">{t.name}</span>
                        {t.mandates > 1 && (
                          <span className="block text-[11px] text-muted-foreground sm:text-xs">
                            {t.mandates} mandata
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(4, (t.m / maxM) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold">{t.m}</span>
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-right font-bold sm:hidden">{t.m}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{t.w}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{t.d}</td>
                  <td className="px-1.5 py-2 text-right sm:px-3">{t.l}</td>
                  <td className="hidden px-3 py-2 text-right font-semibold text-primary sm:table-cell">
                    {ppg(t.w, t.d, t.m).toFixed(2)}
                  </td>
                  <td className="hidden px-4 py-2 text-right text-muted-foreground sm:table-cell">
                    {pct(t.w, t.m)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="mt-3 text-xs text-muted-foreground">
        P = pobjede, N = neriješeno, I = porazi. Bod/ut. = prosječan broj bodova po utakmici.
      </p>
    </>
  );
}

function StatistikaReprezentacije() {
  const { data: goalData, isLoading } = useQuery({
    queryKey: ["national-goals"],
    queryFn: () => getNationalGoals(),
  });

  const goals = goalData ?? [];

  const [tab, setTab] = useState<Tab | null>(null);
  const [pick, setPick] = useState(ALL);

  const years = useMemo(
    () =>
      [...new Set(goals.map((g) => g.match_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [goals],
  );
  const year = pick === ALL || years.includes(pick) ? pick : ALL;

  const filtered = useMemo(
    () => (year === ALL ? goals : goals.filter((g) => g.match_date.startsWith(year))),
    [goals, year],
  );
  const scorers = useMemo(() => buildScorers(filtered), [filtered]);

  const totalGoals = filtered.filter((g) => g.team === "B").length;
  const ownGoals = filtered.filter((g) => g.team === "B" && g.kind === "o").length;
  const penGoals = filtered.filter((g) => g.team === "B" && g.kind === "p").length;

  const multi = useMemo(() => {
    const map = new Map<string, { player: string; date: string; n: number }>();
    for (const g of filtered) {
      if (g.team !== "B" || g.kind === "o") continue;
      const k = `${g.match_date.slice(0, 10)}|${g.player}`;
      const cur = map.get(k) ?? { player: g.player, date: g.match_date.slice(0, 10), n: 0 };
      cur.n++;
      map.set(k, cur);
    }
    return [...map.values()]
      .filter((x) => x.n >= 3)
      .sort((a, b) => b.n - a.n || b.date.localeCompare(a.date));
  }, [filtered]);

  const perYear = useMemo(() => {
    const byYear = new Map<string, NationalGoal[]>();
    for (const g of goals) {
      const y = g.match_date.slice(0, 4);
      const arr = byYear.get(y) ?? [];
      arr.push(g);
      byYear.set(y, arr);
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([y, arr]) => {
        const top = buildScorers(arr)[0];
        return {
          year: y,
          goals: arr.filter((g) => g.team === "B").length,
          top: top ? `${top.player} (${top.goals})` : "—",
        };
      });
  }, [goals]);

  const max = scorers[0]?.goals ?? 1;
  const podium = scorers.slice(0, 3);
  const rest = scorers.slice(0, TOP_N);

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reprezentacija</p>
      <h1 className="font-display text-3xl font-bold uppercase">Statistika</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        A reprezentacija Bosne i Hercegovine. Izaberi šta te zanima.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = tab === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setTab(o.id)}
              className={`rounded-xl border-2 px-4 py-4 text-left transition-colors sm:px-5 sm:py-5 ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/60"
              }`}
            >
              <p className="font-display text-xl font-bold uppercase">{o.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.text}</p>
            </button>
          );
        })}
      </div>

      {tab === "treneri" && <CoachesView />}

      {tab === "strijelci" &&
        (isLoading ? (
          <div className="rounded-lg border border-border bg-card">
            <TableSkeleton rows={8} cols={4} />
          </div>
        ) : goals.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-muted-foreground">
            Još nema podataka.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Autogolovi protivnika ulaze u zbir golova tima, ali ne i igračima.
            </p>

            <div className="mb-4 flex items-center justify-end gap-2">
              <label
                htmlFor="godina-stat"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Razdoblje
              </label>
              <select
                id="godina-stat"
                value={year}
                onChange={(e) => setPick(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold"
              >
                <option value={ALL}>Svih vremena</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Golova tima", totalGoals],
                ["Strijelaca", scorers.length],
                ["Penala", penGoals],
                ["Autogolova", ownGoals],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="rounded-xl border border-border bg-card px-3 py-4 text-center sm:px-4"
                >
                  <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {podium.length > 0 && (
              <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                {podium.map((s, i) => (
                  <div
                    key={s.player}
                    className="relative overflow-hidden rounded-xl border border-border bg-card px-2.5 py-4 sm:px-5 sm:py-5"
                  >
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground sm:right-3 sm:top-3 sm:size-7 sm:text-sm">
                      {i + 1}
                    </span>
                    <p className="pr-5 font-display text-sm font-bold uppercase leading-tight sm:pr-8 sm:text-lg">
                      {s.player}
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-primary sm:mt-3 sm:text-4xl">
                      {s.goals}
                    </p>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">
                      {s.goals === 1 ? "gol" : "golova"}
                    </p>
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:mt-3 sm:text-xs">
                      {s.matches} utak. s golom
                      {s.pens > 0 ? ` · ${s.pens} pen.` : ""}
                      <br />
                      {s.first === s.last ? s.first : `${s.first}–${s.last}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
                {year === ALL ? "Top 10 strijelaca" : `Top 10 strijelaca ${year}.`}
              </h2>
              <table className="w-full border-collapse text-[13px] tabular-nums sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="w-8 px-2 py-2 text-left sm:w-10 sm:px-4">#</th>
                    <th className="px-2 py-2 text-left sm:px-3">Igrač</th>
                    <th className="px-2 py-2 text-left sm:px-3">Golovi</th>
                    <th className="hidden px-3 py-2 text-right sm:table-cell">Pen.</th>
                    <th className="px-2 py-2 text-right sm:px-3">Utak.</th>
                    <th className="hidden px-4 py-2 text-right sm:table-cell">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((s, i) => (
                    <tr key={s.player} className="border-b border-border/70 last:border-0">
                      <td className="px-2 py-2.5 text-muted-foreground sm:px-4 sm:py-2">{i + 1}</td>
                      <td className="px-2 py-2.5 font-medium sm:px-3 sm:py-2">{s.player}</td>
                      <td className="px-2 py-2.5 sm:px-3 sm:py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 overflow-hidden rounded-full bg-muted sm:w-40">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(4, (s.goals / max) * 100)}%` }}
                            />
                          </div>
                          <span className="font-bold">{s.goals}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-right text-muted-foreground sm:table-cell">
                        {s.pens || "—"}
                      </td>
                      <td className="px-2 py-2.5 text-right text-muted-foreground sm:px-3 sm:py-2">
                        {s.matches}
                      </td>
                      <td className="hidden px-4 py-2 text-right text-muted-foreground sm:table-cell">
                        {s.first === s.last ? s.first : `${s.first}–${s.last}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {multi.length > 0 && (
              <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
                <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
                  Tri i više golova u utakmici
                </h2>
                <ul>
                  {multi.map((x) => (
                    <li
                      key={`${x.date}${x.player}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3 text-sm last:border-0"
                    >
                      <span className="font-medium">{x.player}</span>
                      <span className="flex items-center gap-3 tabular-nums">
                        <span className="text-muted-foreground">{fmtDate(x.date)}</span>
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {x.n} gola
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {year === ALL && (
              <section className="overflow-hidden rounded-xl border border-border bg-card">
                <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
                  Najbolji strijelac po godinama
                </h2>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full border-collapse text-[13px] tabular-nums sm:text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                        <th className="px-2 py-2 text-left sm:px-4">God.</th>
                        <th className="px-2 py-2 text-right sm:px-3">Golova</th>
                        <th className="px-2 py-2 text-left sm:px-4">Najbolji strijelac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perYear.map((r) => (
                        <tr
                          key={r.year}
                          onClick={() => setPick(r.year)}
                          className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-2 py-2 sm:px-4">{r.year}</td>
                          <td className="px-2 py-2 text-right sm:px-3">{r.goals}</td>
                          <td className="px-2 py-2 sm:px-4">{r.top}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ))}
    </main>
  );
}
