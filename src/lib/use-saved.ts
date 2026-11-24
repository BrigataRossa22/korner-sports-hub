import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/lib/use-membership";

export type SavedRow = { id: string; slug: string; title: string; created_at: string };

// Tabela saved_articles nije u generisanim tipovima, pa je čitamo bez njih
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from("saved_articles");

/** Sačuvane vijesti ("Za kasnije") prijavljenog člana. */
export function useSaved() {
  const m = useMembership();
  const qc = useQueryClient();
  const enabled = m.signedIn && m.hasAccess;
  const q = useQuery({
    queryKey: ["saved-articles", m.userId],
    enabled,
    queryFn: async (): Promise<SavedRow[]> => {
      const { data, error } = await table()
        .select("id, slug, title, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SavedRow[];
    },
  });
  const rows = q.data ?? [];

  async function toggle(slug: string, title: string): Promise<boolean> {
    const existing = rows.find((r) => r.slug === slug);
    const res = existing
      ? await table().delete().eq("id", existing.id)
      : await table().insert({ slug, title });
    await qc.invalidateQueries({ queryKey: ["saved-articles"] });
    return !res.error || res.error.code === "23505";
  }

  return {
    enabled,
    loading: q.isLoading,
    rows,
    has: (slug: string) => rows.some((r) => r.slug === slug),
    toggle,
  };
}
