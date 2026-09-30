import { createFileRoute } from "@tanstack/react-router";

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

        const base = process.env.SUPABASE_URL;
        if (!base) return new Response("Nedostaje SUPABASE_URL", { status: 500 });

        return Response.redirect(
          `${base}/storage/v1/object/public/slike/${key}`,
          302,
        );
      },
    },
  },
});
