import { createFileRoute } from "@tanstack/react-router";

/**
 * Sluzi fotografije iz privatnog prostora za skladistenje.
 * Putanja: /api/public/slike/<putanja-u-bucketu>
 */
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const PREFIX = "/api/public/slike/";

export const Route = createFileRoute("/api/public/slike/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        if (!pathname.startsWith(PREFIX)) return new Response("Nije pronađeno", { status: 404 });

        const key = decodeURIComponent(pathname.slice(PREFIX.length));
        if (!key || key.includes("..") || !/^[A-Za-z0-9._\-/]+$/.test(key)) {
          return new Response("Nije pronađeno", { status: 404 });
        }

        const extension = key.split(".").pop()?.toLowerCase() ?? "";
        const contentType = CONTENT_TYPES[extension];
        if (!contentType) return new Response("Nije pronađeno", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("slike").download(key);
        if (error || !data) return new Response("Nije pronađeno", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
