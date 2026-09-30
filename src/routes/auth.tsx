import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoAsset from "@/assets/korner-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Prijava — Korner BiH" },
      { name: "description", content: "Pristup uređivačkom panelu portala Korner BiH." },
      { property: "og:title", content: "Prijava — Korner BiH" },
      { property: "og:description", content: "Pristup uređivačkom panelu portala Korner BiH." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Račun je napravljen. Provjeri email i potvrdi registraciju, pa se prijavi.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.toLowerCase().includes("invalid login")) {
            throw new Error("Pogrešan email ili lozinka.");
          }
          throw signInError;
        }
      }
      await navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nešto nije u redu. Pokušaj ponovo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setNotice("");
    if (!email) {
      setError("Upiši email na koji šaljemo novu lozinku.");
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("Poslali smo email s linkom za novu lozinku. Provjeri i spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slanje emaila nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Korner BiH" className="size-9" />
            <span className="font-heading text-xl font-extrabold tracking-tight">
              Korner <span className="text-primary">BiH</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h1 className="font-heading text-2xl font-bold">
              {mode === "signin" ? "Prijava" : "Novi račun"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Prijavi se da uređuješ vijesti, raspored i tabelu."
                : "Napravi račun urednika. Poslije ga treba odobriti."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ti@korner.ba"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="najmanje 8 znakova"
                />
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {notice && (
                <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  {notice}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Čeka se..."
                  : mode === "signin"
                    ? "Prijavi se"
                    : "Napravi račun"}
              </Button>
            </form>

            {mode === "signin" && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Zaboravljena lozinka
              </button>
            )}

            <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setNotice("");
                  }}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Treba mi račun
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setNotice("");
                  }}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Već imam račun — prijava
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
