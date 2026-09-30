import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Category = "fudbal" | "kosarka" | "ostali-sportovi";

export type ArticleDTO = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  lead: string;
  body: string[];
  category: Category;
  image: string | null;
  imageAbs: string | null;
  author: string;
  publishedAt: string;
  comments: number;
  isHeadline: boolean;
  isFeatured: boolean;
};

export type FixtureDTO = {
  id: string;
  comp: string;
  home: string;
  away: string;
  when: string;
  scoreHome: number | null;
  scoreAway: number | null;
  finished: boolean;
};

export type StandingDTO = {
  id: string;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

export type SettingsDTO = {
  about: string;
  contactEmail: string;
  instagram: string;
  facebook: string;
};

export type PublicContent = {
  articles: ArticleDTO[];
  fixtures: FixtureDTO[];
  standings: StandingDTO[];
  settings: SettingsDTO;
};

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

const IMAGE_PREFIX = "/api/public/slike/";

function publicClient(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Nedostaju postavke pozadinskog servisa.");
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    // Opaque sb_ keys are not JWTs: send only the apikey header.
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function requestOrigin(): string {
  try {
    return new URL(getRequest().url).origin;
  } catch {
    return "";
  }
}

function toArticle(row: ArticleRow, origin: string): ArticleDTO {
  const relative = row.image_path ? `${IMAGE_PREFIX}${row.image_path}` : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    lead: row.lead,
    body: row.body ?? [],
    category: row.category as Category,
    image: relative,
    imageAbs: relative && origin ? `${origin}${relative}` : null,
    author: row.author,
    publishedAt: row.published_at,
    comments: row.comments,
    isHeadline: row.is_headline,
    isFeatured: row.is_featured,
  };
}

export const getPublicContent = createServerFn({ method: "GET" }).handler(async (): Promise<PublicContent> => {
  const supabase = publicClient();
  const origin = requestOrigin();

  const [articlesRes, fixturesRes, standingsRes, settingsRes] = await Promise.all([
    supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
    supabase.from("fixtures").select("*").order("sort_order", { ascending: true }),
    supabase.from("standings").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (articlesRes.error || fixturesRes.error || standingsRes.error || settingsRes.error) {
    console.error("Ne mogu da se ucitaju podaci portala", {
      articles: articlesRes.error?.message,
      fixtures: fixturesRes.error?.message,
      standings: standingsRes.error?.message,
      settings: settingsRes.error?.message,
    });
    throw new Error("Ne mogu da se učitaju vijesti.");
  }

  return {
    articles: (articlesRes.data ?? []).map((row) => toArticle(row, origin)),
    fixtures: (fixturesRes.data ?? []).map((row) => ({
      id: row.id,
      comp: row.comp,
      home: row.home,
      away: row.away,
      when: row.when_text,
      scoreHome: row.score_home,
      scoreAway: row.score_away,
      finished: row.finished,
    })),
    standings: (standingsRes.data ?? []).map((row) => ({
      id: row.id,
      team: row.team,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      points: row.points,
    })),
    settings: {
      about: settingsRes.data?.about ?? "",
      contactEmail: settingsRes.data?.contact_email ?? "",
      instagram: settingsRes.data?.instagram ?? "",
      facebook: settingsRes.data?.facebook ?? "",
    },
  };
});
