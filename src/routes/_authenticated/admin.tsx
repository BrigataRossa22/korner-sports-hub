import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getEditorStatus, claimFirstEditor } from "@/lib/admin.functions";
import logoAsset from "@/assets/korner-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel — Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Vijesti", exact: true },
  { to: "/admin/nova", label: "Nova vijest", exact: false },
  { to: "/admin/raspored", label: "Raspored", exact: false },
  { to: "/admin/tabela", label: "Tabela", exact: false },
  { to: "/admin/postavke", label: "Postavke", exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getEditorStatus);
  const claim = useServerFn(claimFirstEditor);

  const status = useQuery({
    queryKey: ["editor-status"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });

  const isEditor = status.data?.isEditor === true;

  async function handleClaim() {
    try {
      await claim();
      toast.success("Urednička prava su aktivirana.");
      await queryClient.invalidateQueries({ queryKey: ["editor-status"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preuzimanje prava nije uspjelo.");
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Korner BiH" className="size-8" />
            <span className="font-display text-lg font-bold uppercase tracking-tight">
              Korner <span className="text-primary">BiH</span>
            </span>
          </Link>
          <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-display text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-primary">
            Panel
          </span>

          {isEditor && (
            <nav className="ml-auto flex flex-wrap items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  activeProps={{ className: "bg-primary text-primary-foreground" }}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {status.data
              ? `Prijavljen kao ${status.data.email}`
              : status.isError
                ? "Podaci se nisu učitali."
                : "Učitavanje..."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ExternalLink className="size-4" /> Pogledaj sajt
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" /> Odjava
            </Button>
          </div>
        </div>

        {status.data && !isEditor && (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-900">
            <p className="font-semibold text-base">Račun još nema pristup uređivanju.</p>
            <p className="mt-1">
              Prijavljeni si kao <strong>{status.data.email}</strong>. Ako si prvi urednik, klikni
              dugme ispod; inače ti administrator treba dodijeliti prava, pa osvježi stranicu.
            </p>
            <Button size="sm" className="mt-3" onClick={handleClaim}>
              Preuzmi urednička prava
            </Button>
          </div>
        )}

        {status.isError && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            Panel se nije mogao otvoriti. Provjeri internet vezu i osvježi stranicu.
          </div>
        )}

        {isEditor && (
          <div className="mt-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
