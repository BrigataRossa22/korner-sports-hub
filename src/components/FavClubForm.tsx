import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FavCrest } from "@/components/FavCrest";
import { supabase } from "@/integrations/supabase/client";
import { getClubs } from "@/lib/clubs.functions";
import { getCurrentClubs } from "@/lib/currentclubs.functions";
import { normClub } from "@/lib/club-match";
import { refreshMembership } from "@/lib/use-membership";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profiles = () => (supabase as unknown as { from: (t: string) => any }).from("profiles");

/** Izbor omiljenog kluba ("Moj klub"). */
export function FavClubForm({ userId, favClub }: { userId: string; favClub: string }) {
  const [value, setValue] = useState(favClub);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const { data: current } = useQuery({ queryKey: ["current-clubs"], queryFn: () => getCurrentClubs() });
  const { data: all } = useQuery({ queryKey: ["clubs-all"], queryFn: () => getClubs() });

  const options = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of current ?? []) map.set(normClub(n), n);
    for (const c of all ?? []) if (c.name && !map.has(normClub(c.name))) map.set(normClub(c.name), c.name);
    if (favClub && !map.has(normClub(favClub))) map.set(normClub(favClub), favClub);
    return [...map.values()].sort((a, b) => a.localeCompare(b, "bs"));
  }, [current, all, favClub]);

  async function save(next: string) {
    setNote(null);
    setBusy(true);
    const { error } = await profiles().upsert(
      { user_id: userId, fav_club: next || null },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (error) {
      setNote({ ok: false, text: "Spremanje nije uspjelo. Pokušaj ponovo." });
      return;
    }
    setValue(next);
    setNote({ ok: true, text: next ? "Klub je sačuvan." : "Klub je uklonjen." });
    refreshMembership();
  }

  return (
    <div className="max-w-md rounded-xl border border-border bg-surface p-5">
      <p className="font-display text-sm font-bold uppercase tracking-wide">Moj klub</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Grb tvog kluba se vidi uz tvoj nadimak.
      </p>
      <div className="mt-3 flex items-center gap-3">
        {value && <FavCrest club={value} className="size-9" />}
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Izaberi klub…</option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {note && (
        <p className={`mt-2 text-xs font-medium ${note.ok ? "text-primary" : "text-destructive"}`}>
          {note.text}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || !value || value === favClub}
          onClick={() => void save(value)}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Spremam…" : "Spremi klub"}
        </button>
        {favClub && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save("")}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            Ukloni
          </button>
        )}
      </div>
    </div>
  );
}
