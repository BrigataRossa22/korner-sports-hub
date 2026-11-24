import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Lock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/lib/use-membership";

const INSTAGRAM = "https://www.instagram.com/korner_bih/";

/** Izbornik "Korner članstvo" gore desno: prijava, status i odjava. */
export function MemberMenu() {
  const m = useMembership();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const box = useRef<HTMLDivElement>(null);

  // Zaključane stranice otvaraju prijavu preko ovog događaja
  useEffect(() => {
    const onLogin = () => setOpen(true);
    window.addEventListener("korner:login", onLogin);
    return () => window.removeEventListener("korner:login", onLogin);
  }, []);

  // Klik izvan izbornika ili tipka Esc ga zatvara
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("invalid")
          ? "Pogrešan email ili lozinka."
          : "Prijava nije uspjela. Pokušaj ponovo.",
      );
      return;
    }
    setPassword("");
    setOpen(false);
  }

  async function reset() {
    setError("");
    setNotice("");
    if (!email) {
      setError("Upiši email, pa klikni ponovo.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) setError("Slanje nije uspjelo. Pokušaj ponovo.");
    else setNotice("Poslali smo link za novu lozinku. Provjeri i spam.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  const active = m.hasAccess;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Korner članstvo"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-white/25 text-ink-foreground/85 hover:border-white/50 hover:text-primary-foreground"
        }`}
      >
        {active ? <Crown className="size-4" /> : <Lock className="size-4" />}
        <span className="hidden sm:inline">Korner članstvo</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl">
          <p className="font-display text-sm font-bold uppercase tracking-wide">Korner članstvo</p>

          {m.loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Učitavam…</p>
          ) : m.signedIn ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="break-all text-muted-foreground">{m.email}</p>
              {m.isAdmin ? (
                <p className="rounded-md bg-primary/10 px-3 py-2 font-medium text-primary">
                  Admin · vidiš sve
                </p>
              ) : m.isMember ? (
                <p className="rounded-md bg-primary/10 px-3 py-2 font-medium text-primary">
                  Korner član · sve je otključano
                </p>
              ) : (
                <div className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
                  Ovaj profil nema aktivno članstvo.{" "}
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-foreground underline"
                  >
                    Javi nam se
                  </a>
                  .
                </div>
              )}
              {m.hasAccess && (
                <Link
                  to="/moj-profil"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <MapPin className="size-4" />
                  Moj profil
                  <span className="ml-auto text-xs font-medium opacity-80">Groundhopping</span>
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                Odjava
              </button>
            </div>
          ) : (
            <form onSubmit={signIn} className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Prijavi se profilom koji si dobio uz članstvo.
              </p>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
              {notice && <p className="text-xs font-medium text-primary">{notice}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Prijavljujem…" : "Prijavi se"}
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button type="button" onClick={reset} className="underline">
                  Zaboravljena lozinka
                </button>
                <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="underline">
                  Postani član
                </a>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
