import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova lozinka — Korner BiH" },
      { name: "description", content: "Postavi novu lozinku za pristup portalu Korner BiH." },
      { property: "og:title", content: "Nova lozinka — Korner BiH" },
      { property: "og:description", content: "Postavi novu lozinku za pristup portalu Korner BiH." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const params = new URLSearchParams(window.location.search);
    const isRecovery = hash.get("type") === "recovery" || params.get("type") === "recovery";

    if (isRecovery) {
      setReady(true);
      return;
    }

    // Kod confirm emaila ili magic linka sesija stigne preko hash parametara.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lozinku nije moguće promijeniti.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold">Nova lozinka</h1>

        {!ready && !done && (
          <p className="mt-3 text-sm text-muted-foreground">
            Link za promjenu lozinke nije važeći. Zatraži novu lozinku na stranici prijave.
          </p>
        )}

        {done && (
          <>
            <p className="mt-3 text-sm text-primary">Lozinka je promijenjena.</p>
            <Button
              className="mt-5 w-full"
              onClick={() => navigate({ to: "/admin", replace: true })}
            >
              Idi na panel
            </Button>
          </>
        )}

        {ready && !done && (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Nova lozinka</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Čeka se..." : "Sačuvaj lozinku"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
