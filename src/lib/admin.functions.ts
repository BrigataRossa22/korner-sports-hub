import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { slugify } from "./slug";
import type { Category } from "./content.functions";

type Client = SupabaseClient<Database>;
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

const NO_ACCESS = "Nemaš pristup uređivanju sajta.";

async function requireEditor(supabase: Client, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "editor",
  });
  if (error) {
    console.error("Provjera uloge nije uspjela", error.message);
    throw new Error("Ne mogu da provjerim pristup.");
  }
  if (!data) throw new Error(NO_ACCESS);
}

export type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  lead: string;
  body: string[];
  category: Category;
  imagePath: string | null;
  author: string;
  comments: number;
  isPublished: boolean;
  isHeadline: boolean;
  isFeatured: boolean;
  publishedAt: string;
};

function toAdminArticle(row: ArticleRow): AdminArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    lead: row.lead,
    body: row.body ?? [],
    category: row.category as Category,
    imagePath: row.image_path,
    author: row.author,
    comments: row.comments,
    isPublished: row.is_published,
    isHeadline: row.is_headline,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
  };
}

function firstId(rows: { id: string }[] | null | undefined): string {
  const id = rows?.[0]?.id;
  if (!id) throw new Error("Zapis nije sačuvan.");
  return id;
}

/** Da li je prijavljeni korisnik urednik (za prikaz upozorenja u panelu). */
export const getEditorStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "editor",
    });
    return {
      email: String(context.claims?.email ?? ""),
      isEditor: Boolean(data),
    };
  });

/** Svi članci, uključujući one koji još nisu objavljeni. */
export const listManagedArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireEditor(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toAdminArticle);
  });

export const getManagedArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("articles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Vijest nije pronađena.");
    return toAdminArticle(row);
  });

export type ArticleInput = {
  id?: string | null;
  slug?: string;
  title: string;
  kicker: string;
  lead: string;
  body: string[];
  category: Category;
  imagePath: string | null;
  author: string;
  comments: number;
  isPublished: boolean;
  isHeadline: boolean;
  isFeatured: boolean;
};

async function uniqueSlug(supabase: Client, base: string, keepId?: string | null) {
  let candidate = base;
  for (let attempt = 2; attempt <= 30; attempt += 1) {
    const { data } = await supabase.from("articles").select("id, slug").eq("slug", candidate).limit(5);
    const clash = (data ?? []).some((row) => row.id !== keepId);
    if (!clash) return candidate;
    candidate = `${base}-${attempt}`;
  }
  throw new Error("Ne mogu da smislim slobodnu adresu, promijeni naslov.");
}

export const saveManagedArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ArticleInput) => {
    if (!input.title?.trim()) throw new Error("Naslov je obavezan.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);

    const slug = slugify(data.slug?.trim() ? data.slug : data.title);
    if (!slug) throw new Error("Naslov mora da sadrži bar jedno slovo.");

    const finalSlug = await uniqueSlug(context.supabase, slug, data.id);

    if (data.isHeadline) {
      await context.supabase
        .from("articles")
        .update({ is_headline: false })
        .neq("id", data.id ?? "00000000-0000-0000-0000-000000000000");
    }

    const payload = {
      slug: finalSlug,
      title: data.title.trim(),
      kicker: data.kicker.trim(),
      lead: data.lead.trim(),
      body: (data.body ?? []).map((p) => p.trim()).filter(Boolean),
      category: data.category,
      image_path: data.imagePath,
      author: data.author.trim() || "Korner redakcija",
      comments: Math.max(0, Math.round(Number(data.comments) || 0)),
      is_published: Boolean(data.isPublished),
      is_headline: Boolean(data.isHeadline),
      is_featured: Boolean(data.isFeatured),
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("articles")
        .update(payload)
        .eq("id", data.id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!updated?.length) throw new Error("Vijest nije pronađena.");
      return { id: firstId(updated), slug: finalSlug };
    }

    const { data: created, error } = await context.supabase
      .from("articles")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);
    return { id: firstId(created), slug: finalSlug };
  });

export const setArticleFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; flag: "published" | "headline" | "featured"; value: boolean }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);

    if (data.flag === "headline" && data.value) {
      await context.supabase
        .from("articles")
        .update({ is_headline: false })
        .neq("id", data.id);
    }

    const patch: Database["public"]["Tables"]["articles"]["Update"] =
      data.flag === "published"
        ? { is_published: data.value }
        : data.flag === "headline"
          ? { is_headline: data.value }
          : { is_featured: data.value };

    const { data: updated, error } = await context.supabase
      .from("articles")
      .update(patch)
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("Vijest nije pronađena.");
    return { ok: true };
  });

export const deleteManagedArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadArticleImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; contentType: string; base64: string }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);

    const extension = (data.fileName.split(".").pop() ?? "").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(extension)) throw new Error("Slika mora biti JPG, PNG ili WEBP.");

    const bytes = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Slika je prevelika (najviše 5 MB).");

    const path = `${Date.now()}-${slugify(data.fileName.replace(/\.[^.]+$/, ""))}.${extension}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("slike")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) {
      console.error("Upload slike", error.message);
      throw new Error("Slanje slike nije uspjelo.");
    }
    return { path };
  });

export type FixtureInput = {
  id?: string | null;
  comp: string;
  home: string;
  away: string;
  when: string;
  scoreHome: number | null;
  scoreAway: number | null;
  finished: boolean;
  sortOrder: number;
};

export const saveFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FixtureInput) => {
    if (!input.home?.trim() || !input.away?.trim()) throw new Error("Unesi oba tima.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const payload = {
      comp: data.comp.trim(),
      home: data.home.trim(),
      away: data.away.trim(),
      when_text: data.when.trim(),
      score_home: data.scoreHome === null ? null : Math.round(data.scoreHome),
      score_away: data.scoreAway === null ? null : Math.round(data.scoreAway),
      finished: Boolean(data.finished),
      sort_order: Math.round(Number(data.sortOrder) || 0),
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("fixtures")
        .update(payload)
        .eq("id", data.id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!updated?.length) throw new Error("Utakmica nije pronađena.");
      return { id: firstId(updated) };
    }

    const { data: created, error } = await context.supabase
      .from("fixtures")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);
    return { id: firstId(created) };
  });

export const deleteFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const { error } = await context.supabase.from("fixtures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type StandingInput = {
  id?: string | null;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  sortOrder: number;
};

export const saveStanding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StandingInput) => {
    if (!input.team?.trim()) throw new Error("Unesi naziv kluba.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const num = (value: number) => Math.max(0, Math.round(Number(value) || 0));
    const payload = {
      team: data.team.trim(),
      played: num(data.played),
      wins: num(data.wins),
      draws: num(data.draws),
      losses: num(data.losses),
      points: num(data.points),
      sort_order: num(data.sortOrder),
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("standings")
        .update(payload)
        .eq("id", data.id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!updated?.length) throw new Error("Klub nije pronađen.");
      return { id: firstId(updated) };
    }

    const { data: created, error } = await context.supabase
      .from("standings")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);
    return { id: firstId(created) };
  });

export const deleteStanding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const { error } = await context.supabase.from("standings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { about: string; contactEmail: string; instagram: string; facebook: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireEditor(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({
        id: 1,
        about: data.about ?? "",
        contact_email: data.contactEmail.trim(),
        instagram: data.instagram.trim(),
        facebook: data.facebook.trim(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
