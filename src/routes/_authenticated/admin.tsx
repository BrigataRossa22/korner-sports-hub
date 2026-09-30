import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getEditorStatus } from "@/lib/admin.functions";
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

  const status = useQuery({
    queryKey: ["editor-status"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });

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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {status.data && !status.data.isEditor && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900">
            <p className="font-semibold">Račun još nema pristup uređivanju.</p>
            <p className="mt-1">
              Prijavljeni si kao <strong>{status.data.email}</strong>. Administrator treba da ti
              dodijeli ulogu urednika, pa osvježi stranicu.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {status.data ? `Prijavljen kao ${status.data.email}` : ""}
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

        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
