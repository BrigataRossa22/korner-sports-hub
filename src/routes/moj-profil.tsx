import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Crown, LogOut, MapPin, Plus, Trash2, Trophy } from "lucide-react";
import { useSeasons } from "@/components/ArchiveTable";
import { CURRENT_SEASON } from "@/components/MemberBlur";
import { LockedPage } from "@/components/MemberLock";
import { LoadError } from "@/components/RouteFallbacks";
import { supabase } from "@/integrations/supabase/client";
import { displayClub, normClub, sameClub } from "@/lib/club-match";
import { formatDate } from "@/lib/content";
import { getStadiums } from "@/lib/groundhopping.functions";
import { getLeagueMatches } from "@/lib/leaguematches.functions";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { useMembership } from "@/lib/use-membership";

export const Route = createFileRoute("/moj-profil")({
  head: () => ({
    meta: [
      { title: "Moj profil — Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: LoadError,
  component: MojProfil,
});

type PickMatch = {
  round: number | null;
  match_date: string | null;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
  grp: string | null;
};

type Hop = {
  id: string;
  season: string;
  round: number | null;
  match_date: string | null;
  home: string;
  away: string;
  score_home: number | null;
  score_away: number | null;
};

// Tabela groundhopping nije u generisanim tipovima, pa je čitamo bez njih
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from("groundhopping");

const keyOf = (
  season: string,
  m: { round: number | null; match_date: string | null; home: string; away: string },
) => `${season}|${m.home}|${m.away}|${m.round ?? ""}|${m.match_date ?? ""}`;

const score = (m: { score_home: number | null; score_away: number | null }) =>
  m.score_home == null || m.score_away == null ? "–" : `${m.score_home}:${m.score_away}`;

function errText(err: { code?: string }) {
  return err.code === "42P01"
    ? "Groundhopping još nije uključen u bazi (nedostaje tabela)."
    : "Spremanje nije uspjelo. Pokušaj ponovo.";
}

function MojProfil() {
  const m = useMembership();
  if (m.loading) return <div className="min-h-[60vh]" />;
  if (!m.hasAccess) return <LockedPage title="Moj profil" />;
  return <Profile email={m.email} isAdmin={m.isAdmin} />;
}

type Tab = "stat" | "add" | "mine";

function Profile({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { seasons } = useSeasons();
  const [tab, setTab] = useState<Tab | null>(null);
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [club, setClub] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const hopsQ = useQuery({
    queryKey: ["groundhopping", email],
    queryFn: async (): Promise<Hop[]> => {
      const { data, error } = await table().select("*").limit(5000);
      if (error) throw error;
      return (data ?? []) as Hop[];
    },
  });
  const { data: stadiumRows } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => getStadiums(),
  });

  const hops = useMemo(
    () =>
      [...(hopsQ.data ?? [])].sort((a, b) =>
        (b.match_date ?? "").localeCompare(a.match_date ?? "") || b.season.localeCompare(a.season),
      ),
    [hopsQ.data],
  );
  const savedByKey = useMemo(() => new Map(hops.map((h) => [keyOf(h.season, h), h])), [hops]);

  const pickerQ = useQuery({
    queryKey: ["gh-matches", season],
    queryFn: async (): Promise<PickMatch[]> => {
      if (season === CURRENT_SEASON) {
        const rows = await getLeagueMatches();
        return rows
          .filter((r) => r.score_home != null && r.score_away != null)
          .map((r) => ({
            round: r.round,
            match_date: r.match_date,
            home: r.home,
            away: r.away,
            score_home: r.score_home,
            score_away: r.score_away,
            grp: null,
          }));
      }
      const rows = await getSeasonMatches({ data: { season } });
      return rows.map((r) => ({
        round: r.round,
        match_date: r.match_date,
        home: r.home,
        away: r.away,
        score_home: r.score_home,
        score_away: r.score_away,
        grp: r.grp ?? null,
      }));
    },
  });

  const seasonOptions = [CURRENT_SEASON, ...seasons.filter((s) => s !== CURRENT_SEASON)];
  const active: Tab = tab ?? (hops.length > 0 ? "stat" : "add");

  // ---- Statistika ----
  const stats = useMemo(() => {
    const clubs = new Map<
      string,
      { name: string; seen: number; w: number; d: number; l: number; gf: number; ga: number }
    >();
    const stadiums = new Map<string, number>();
    const perSeason = new Map<string, number>();
    let goals = 0;

    const bump = (name: string, gf: number | null, ga: number | null) => {
      const k = normClub(name);
      const row = clubs.get(k) ?? { name: displayClub(name), seen: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      row.seen += 1;
      if (gf != null && ga != null) {
        row.gf += gf;
        row.ga += ga;
        if (gf > ga) row.w += 1;
        else if (gf === ga) row.d += 1;
        else row.l += 1;
      }
      clubs.set(k, row);
    };

    for (const h of hops) {
      bump(h.home, h.score_home, h.score_away);
      bump(h.away, h.score_away, h.score_home);
      goals += (h.score_home ?? 0) + (h.score_away ?? 0);
      perSeason.set(h.season, (perSeason.get(h.season) ?? 0) + 1);
      const st = (stadiumRows ?? []).find((r) => sameClub(r.club, h.home))?.stadium;
      if (st) stadiums.set(st, (stadiums.get(st) ?? 0) + 1);
    }

    const byCount = <T extends { seen: number; name: string }>(a: T, b: T) =>
      b.seen - a.seen || a.name.localeCompare(b.name, "bs");
    return {
      clubs: [...clubs.values()].sort(byCount),
      stadiums: [...stadiums.entries()]
        .map(([name, seen]) => ({ name, seen }))
        .sort(byCount),
      seasons: [...perSeason.entries()].sort((a, b) => b[0].localeCompare(a[0])),
      goals,
    };
  }, [hops, stadiumRows]);

  // ---- Dodavanje / brisanje ----
  async function toggle(pm: PickMatch) {
    const k = keyOf(season, pm);
    const existing = savedByKey.get(k);
    setMsg("");
    setPending((p) => new Set(p).add(k));
    const res = existing
      ? await table().delete().eq("id", existing.id)
      : await table().insert({
          season,
          round: pm.round,
          match_date: pm.match_date,
          home: pm.home,
          away: pm.away,
          score_home: pm.score_home,
          score_away: pm.score_away,
        });
    setPending((p) => {
      const n = new Set(p);
      n.delete(k);
      return n;
    });
    if (res.error && res.error.code !== "23505") setMsg(errText(res.error));
    await qc.invalidateQueries({ queryKey: ["groundhopping"] });
  }

  async function removeHop(h: Hop) {
    setMsg("");
    const { error } = await table().delete().eq("id", h.id);
    if (error) setMsg(errText(error));
    await qc.invalidateQueries({ queryKey: ["groundhopping"] });
  }

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  // ---- Lista za dodavanje ----
  const clubOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const x of pickerQ.data ?? []) {
      set.set(normClub(x.home), displayClub(x.home));
      set.set(normClub(x.away), displayClub(x.away));
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b, "bs"));
  }, [pickerQ.data]);

  const rounds = useMemo(() => {
    const list = (pickerQ.data ?? []).filter(
      (x) => !club || sameClub(x.home, club) || sameClub(x.away, club),
    );
    const map = new Map<number, PickMatch[]>();
    for (const x of list) {
      const r = x.round ?? 0;
      map.set(r, [...(map.get(r) ?? []), x]);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] === 0 ? 1 : b[0] === 0 ? -1 : a[0] - b[0]))
      .map(([round, matches]) => ({
        round,
        matches: matches.sort((a, b) => (a.match_date ?? "").localeCompare(b.match_date ?? "")),
      }));
  }, [pickerQ.data, club]);

  const initials = (email.split("@")[0] ?? "?").slice(0, 2).toUpperCase();
  const maxClub = stats.clubs[0]?.seen ?? 1;
  const maxStadium = stats.stadiums[0]?.seen ?? 1;

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
        active === id
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Zaglavlje profila */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 sm:py-10">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">
              Moj profil
            </p>
            <p className="mt-1 break-all font-display text-xl font-bold sm:text-2xl">{email}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-foreground/75">
              <Crown className="size-4 text-primary" />
              {isAdmin ? "Admin" : "Korner član"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            <LogOut className="size-4" /> Odjava
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-primary pb-2">
          <div>
            <p className="kicker">Moje opcije</p>
            <h1 className="font-display text-3xl font-bold uppercase">Groundhopping</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Bilježi utakmice koje si gledao uživo. Izaberi sezonu iz arhive, označi utakmice na kojima
          si bio, pa dobij statistiku: koje klubove si gledao, koliko puta i na kojim stadionima.
        </p>

        {/* Brojke */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Utakmica", hops.length],
            ["Klubova", stats.clubs.length],
            ["Stadiona", stats.stadiums.length],
            ["Golova", stats.goals],
            ["Sezona", stats.seasons.length],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-display text-3xl font-bold tabular-nums text-primary">{value}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabBtn("stat", "Statistika")}
          {tabBtn("add", "Dodaj utakmice")}
          {tabBtn("mine", `Moje utakmice (${hops.length})`)}
        </div>

        {msg && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {msg}
          </p>
        )}
        {hopsQ.isError && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            Učitavanje nije uspjelo. Groundhopping možda još nije uključen u bazi.
          </p>
        )}

        {/* ---- Statistika ---- */}
        {active === "stat" && (
          <div className="mt-6">
            {hops.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <MapPin className="mx-auto size-8 text-primary" />
                <p className="mt-3 font-semibold">Još nema utakmica</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dodaj prvu utakmicu na kojoj si bio i ovdje će se pojaviti statistika.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("add")}
                  className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Dodaj utakmice
                </button>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <section>
                  <h2 className="flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-bold uppercase">
                    <Trophy className="size-5 text-primary" /> Klubovi koje si gledao
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-sm tabular-nums">
                      <thead>
                        <tr className="text-xs uppercase text-muted-foreground">
                          <th className="py-2 text-left">Klub</th>
                          <th className="w-12 py-2 text-center">Puta</th>
                          <th className="w-9 py-2 text-center" title="Pobjede">
                            P
                          </th>
                          <th className="w-9 py-2 text-center" title="Neriješeno">
                            N
                          </th>
                          <th className="w-9 py-2 text-center" title="Izgubljeno">
                            I
                          </th>
                          <th className="w-16 py-2 text-center">Golovi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.clubs.map((c) => (
                          <tr key={c.name} className="border-t border-border">
                            <td className="py-2 pr-2">
                              <p className="font-semibold">{c.name}</p>
                              <div className="mt-1 h-1.5 rounded-full bg-muted">
                                <div
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{ width: `${(c.seen / maxClub) * 100}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-2 text-center font-bold text-primary">{c.seen}</td>
                            <td className="py-2 text-center">{c.w}</td>
                            <td className="py-2 text-center">{c.d}</td>
                            <td className="py-2 text-center">{c.l}</td>
                            <td className="py-2 text-center text-muted-foreground">
                              {c.gf}:{c.ga}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="space-y-8">
                  <section>
                    <h2 className="flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-bold uppercase">
                      <MapPin className="size-5 text-primary" /> Stadioni
                    </h2>
                    {stats.stadiums.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Za klubove koje si gledao još nemamo upisane stadione.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {stats.stadiums.map((s) => (
                          <li key={s.name}>
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="font-semibold">{s.name}</span>
                              <span className="font-bold tabular-nums text-primary">{s.seen}×</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${(s.seen / maxStadium) * 100}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h2 className="flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-bold uppercase">
                      <CalendarDays className="size-5 text-primary" /> Po sezonama
                    </h2>
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {stats.seasons.map(([s, n]) => (
                        <li key={s} className="flex justify-between py-2">
                          <span className="font-semibold">{s}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {n} {n === 1 ? "utakmica" : "utakmica"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Dodaj utakmice ---- */}
        {active === "add" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Sezona
                <select
                  value={season}
                  onChange={(e) => {
                    setSeason(e.target.value);
                    setClub("");
                  }}
                  className="mt-1 block rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold normal-case text-foreground"
                >
                  {seasonOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Klub
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="mt-1 block max-w-[14rem] rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold normal-case text-foreground"
                >
                  <option value="">Svi klubovi</option>
                  {clubOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pickerQ.isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Učitavam utakmice…</p>
            ) : rounds.length === 0 ? (
              <p className="mt-6 border-y border-border py-8 text-sm text-muted-foreground">
                Nema utakmica za ovaj izbor.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                {rounds.map((r) => (
                  <section key={r.round}>
                    <h3 className="rounded-md bg-surface px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide">
                      {r.round === 0 ? "Ostale utakmice" : `${r.round}. kolo`}
                    </h3>
                    <ul className="divide-y divide-border">
                      {r.matches.map((x) => {
                        const k = keyOf(season, x);
                        const saved = savedByKey.has(k);
                        const busy = pending.has(k);
                        return (
                          <li key={k} className="flex items-center gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-snug">
                                {x.home}{" "}
                                <span className="tabular-nums text-primary">{score(x)}</span>{" "}
                                {x.away}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {x.match_date ? formatDate(x.match_date) : ""}
                                {x.grp ? ` · ${x.grp}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void toggle(x)}
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                saved
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border hover:bg-muted"
                              }`}
                            >
                              {saved ? (
                                <>
                                  <Check className="size-3.5" /> Bio sam
                                </>
                              ) : (
                                <>
                                  <Plus className="size-3.5" /> Bio sam
                                </>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- Moje utakmice ---- */}
        {active === "mine" && (
          <div className="mt-6">
            {hops.length === 0 ? (
              <p className="border-y border-border py-8 text-sm text-muted-foreground">
                Još nisi dodao nijednu utakmicu.
              </p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {hops.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">
                        {h.home} <span className="tabular-nums text-primary">{score(h)}</span>{" "}
                        {h.away}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.match_date ? `${formatDate(h.match_date)} · ` : ""}
                        {h.season}
                        {h.round ? ` · ${h.round}. kolo` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeHop(h)}
                      aria-label="Ukloni utakmicu"
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
