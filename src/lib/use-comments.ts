import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommentRow = {
  id: string;
  slug: string;
  user_id: string;
  nick: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
};

// Tabela comments nije u generisanim tipovima, pa je čitamo bez njih
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commentsTable = () => (supabase as unknown as { from: (t: string) => any }).from("comments");

/** Komentari jedne vijesti (najstariji prvi). Čitati smije svako. */
export function useComments(slug: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["comments", slug],
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await commentsTable()
        .select("id, slug, user_id, nick, avatar_url, body, created_at")
        .eq("slug", slug)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as CommentRow[];
    },
    staleTime: 30 * 1000,
  });
  return {
    rows: q.data ?? [],
    loading: q.isLoading,
    error: q.isError,
    refresh: () => qc.invalidateQueries({ queryKey: ["comments", slug] }),
  };
}
