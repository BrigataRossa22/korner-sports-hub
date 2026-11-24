import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Camera,
  CalendarDays,
  Check,
  Crown,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { useSeasons } from "@/components/ArchiveTable";
import { Avatar } from "@/components/Avatar";
import { FavClubForm } from "@/components/FavClubForm";
import { FavCrest } from "@/components/FavCrest";
import { SavedList } from "@/components/SavedList";
import { CURRENT_SEASON } from "@/components/MemberBlur";
import { LockedPage } from "@/components/MemberLock";
import { LoadError } from "@/components/RouteFallbacks";
import { supabase } from "@/integrations/supabase/client";
import { displayClub, normClub, sameClub } from "@/lib/club-match";
import { formatDate } from "@/lib/content";
import { getStadiums } from "@/lib/groundhopping.functions";
import { getLeagueMatches } from "@/lib/leaguematches.functions";
import { getSeasonMatches } from "@/lib/seasonmatches.functions";
import { refreshMembership, useMembership } from "@/lib/use-membership";

type Dio = "profil" | "groundhopping" | "kasnije";

export const Route = createFileRoute("/moj-profil")({
  head: () => ({
    meta: [
      { title: "Moj profil — Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { dio?: Dio } => ({
    dio:
      s["dio"] === "groundhopping" || s["dio"] === "profil" || s["dio"] === "kasnije"
        ? (s["dio"] as Dio)
        : undefined,
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
const db = (name: string) => (supabase as unknown as { from: (t: string) => any }).from(name);
const table = () => db("groundhopping");

// Nadimak: 3 do 20 znakova, slova, brojevi, razmak, tačka, crtica, donja crta
const NICK_RE = /^[\p{L}\p{N}._ -]{3,20}$/u;

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
  const { dio } = Route.useSearch();
  if (m.loading) return <div className="min-h-[60vh]" />;
  if (!m.hasAccess) return <LockedPage title="Moj profil" />;
  return (
    <Profile
      email={m.email}
      isAdmin={m.isAdmin}
      nick={m.nick}
      avatarUrl={m.avatarUrl}
      favClub={m.favClub}
      userId={m.userId}
      dio={dio ?? "profil"}
    />
  );
}

/** Izreže sliku u kvadrat i smanji je na 256 px (JPEG), da bude mala i brza. */
async function toSquareJpeg(file: File, size = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85),
  );
}

/** Dodavanje, mijenjanje i uklanjanje slike profila */
function AvatarForm({
  userId,
  avatarUrl,
  name,
}: {
  userId: string;
  avatarUrl: string;
  name: string;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const path = `${userId}/avatar.jpg`;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNote(null);
    if (!file.type.startsWith("image/")) {
      setNote({ ok: false, text: "Izaberi sliku (JPG ili PNG)." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNote({ ok: false, text: "Slika je prevelika. Najviše 10 MB." });
      return;
    }
    setBusy(true);
    try {
      let blob: Blob;
      try {
        blob = await toSquareJpeg(file);
      } catch {
        setNote({ ok: false, text: "Ova vrsta slike nije podržana. Probaj JPG ili PNG." });
        return;
      }
      const up = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (up.error) {
        setNote({
          ok: false,
          text: "Slanje nije uspjelo. Provjeri da je u bazi uključeno spremište za slike.",
        });
        return;
      }
      const url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const { error } = await db("profiles").upsert(
        { user_id: userId, avatar_url: url },
        { onConflict: "user_id" },
      );
      if (error) {
        setNote({ ok: false, text: "Slika je poslana, ali se nije spremila u profil." });
        return;
      }
      setNote({ ok: true, text: "Slika je sačuvana." });
      refreshMembership();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setNote(null);
    setBusy(true);
    await supabase.storage.from("avatars").remove([path]);
    const { error } = await db("profiles").upsert(
      { user_id: userId, avatar_url: null },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (error) {
      setNote({ ok: false, text: "Uklanjanje nije uspjelo. Pokušaj ponovo." });
      return;
    }
    setNote({ ok: true, text: "Slika je uklonjena." });
    refreshMembership();
  }

  return (
    <div className="max-w-md rounded-xl border border-border bg-surface p-5">
      <p className="font-display text-sm font-bold uppercase tracking-wide">Tvoja slika</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Slika se vidi uz tvoj nadimak. Automatski se izreže u kvadrat.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <Avatar url={avatarUrl} name={name} className="size-20 text-2xl" />
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Camera className="size-4" />
            {busy ? "Šaljem…" : avatarUrl ? "Promijeni sliku" : "Dodaj sliku"}
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              Ukloni
            </button>
          )}
        </div>
      </div>
      {note && (
        <p className={`mt-3 text-xs font-medium ${note.ok ? "text-primary" : "text-destructive"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}

/** Forma za izbor nadimka */
function NickForm({ userId, nick }: { userId: string; nick: string }) {
  const [value, setValue] = useState(nick);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setValue(nick);
  }, [nick]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    const v = value.trim().replace(/\s+/g, " ");
    if (!NICK_RE.test(v)) {
      setNote({
        ok: false,
        text: "Nadimak mora imati 3 do 20 znakova: slova, brojeve, razmak, tačku, crticu ili donju crtu.",
      });
      return;
    }
    setBusy(true);
    const { error } = await db("profiles").upsert({ user_id: userId, nick: v }, { onConflict: "user_id" });
    setBusy(false);
    if (error) {
      setNote({
        ok: false,
        text:
          error.code === "23505"
            ? "Taj nadimak je već zauzet. Probaj drugi."
            : error.code === "42P01"
              ? "Nadimci još nisu uključeni u bazi (nedostaje tabela)."
              : "Spremanje nije uspjelo. Pokušaj ponovo.",
      });
      return;
    }
    setValue(v);
    setNote({ ok: true, text: "Nadimak je sačuvan." });
    refreshMembership();
  }

  return (
    <form onSubmit={save} className="max-w-md rounded-xl border border-border bg-surface p-5">
      <label htmlFor="nick" className="font-display text-sm font-bold uppercase tracking-wide">
        Tvoj nadimak
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        Tako ćeš se zvati na Korneru. Može biti ime, nadimak ili ime navijačke grupe.
      </p>
      <input
        id="nick"
        value={value}
        maxLength={20}
        onChange={(e) => setValue(e.target.value)}
        placeholder="npr. Brigata Rossa"
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm"
      />
      {note && (
        <p className={`mt-2 text-xs font-medium ${note.ok ? "text-primary" : "text-destructive"}`}>
          {note.text}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Spremam…" : "Spremi nadimak"}
      </button>
    </form>
  );
}

type Tab = "stat" | "add" | "mine";

function Profile({
  email,
  isAdmin,
  nick,
  avatarUrl,
  favClub,
  userId,
  dio,
}: {
  email: string;
  isAdmin: boolean;
  nick: string;
  avatarUrl: string;
  favClub: string;
  userId: string;
  dio: Dio;
}) {
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

  const shownName = nick || (email.split("@")[0] ?? "");
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
          <Avatar url={avatarUrl} name={shownName} className="size-16 text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">
              Moj profil
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
              <span className="break-all">{shownName}</span>
              {favClub && <FavCrest club={favClub} className="size-7" />}
            </p>
            <p className="break-all text-xs text-ink-foreground/60">{email}</p>
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
        {/* Glavni izbor: Profil / Groundhopping / Za kasnije */}
        <nav className="flex flex-wrap gap-2 border-b-2 border-primary pb-3">
          <Link
            to="/moj-profil"
            search={{ dio: "profil" }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide ${
              dio === "profil"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            }`}
          >
            <User className="size-4" /> Profil
          </Link>
          <Link
            to="/moj-profil"
            search={{ dio: "groundhopping" }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide ${
              dio === "groundhopping"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            }`}
          >
            <MapPin className="size-4" /> Groundhopping
          </Link>
          <Link
            to="/moj-profil"
            search={{ dio: "kasnije" }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide ${
              dio === "kasnije"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            }`}
          >
            <Bookmark className="size-4" /> Za kasnije
          </Link>
        </nav>

        {dio === "profil" && (
          <section className="mt-6">
            <h1 className="font-display text-3xl font-bold uppercase">Moj profil</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Ovdje biraš nadimak, sliku i svoj klub, a utakmice bilježiš u dijelu Groundhopping.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <AvatarForm userId={userId} avatarUrl={avatarUrl} name={shownName} />
              <NickForm userId={userId} nick={nick} />
              <FavClubForm userId={userId} favClub={favClub} />
            </div>
          </section>
        )}

        {dio === "kasnije" && (
          <section className="mt-6">
            <h1 className="font-display text-3xl font-bold uppercase">Za kasnije</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Vijesti koje si sačuvao da ih pročitaš kasnije.
            </p>
            <SavedList />
          </section>
        )}

        {dio === "groundhopping" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold uppercase">Groundhopping</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Bilježi utakmice koje si gledao uživo. Izaberi sezonu iz arhive, označi utakmice na
              kojima si bio, pa dobij statistiku: koje klubove si gledao, koliko puta i na kojim
              stadionima.
            </p>

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
          </>
        )}
      </div>
    </div>
  );
}
