import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSiteSettings } from "@/lib/admin.functions";
import { contentOptions } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/postavke")({
  head: () => ({
    meta: [
      { title: "Postavke — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PostavkePage,
});

function PostavkePage() {
  const queryClient = useQueryClient();
  const save = useServerFn(saveSiteSettings);
  const content = useQuery(contentOptions);

  const settings = content.data?.settings;
  const [about, setAbout] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [facebook, setFacebook] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await save({
        data: {
          about: about ?? settings?.about ?? "",
          contactEmail: contactEmail ?? settings?.contactEmail ?? "",
          instagram: instagram ?? settings?.instagram ?? "",
          facebook: facebook ?? settings?.facebook ?? "",
        },
      });
      toast.success("Postavke sačuvane.");
      queryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Čuvanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Učitavam postavke...</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-heading text-2xl font-bold">Postavke</h1>

      <div className="space-y-5 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="about">Tekst o nama i kontaktu</Label>
          <Textarea
            id="about"
            rows={8}
            defaultValue={settings.about}
            onChange={(e) => setAbout(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Prazne redove ra010dunamo kao novi pasus na stranici.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email za kontakt</Label>
            <Input
              id="email"
              type="email"
              defaultValue={settings.contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              defaultValue={settings.instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/korner_bih"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              defaultValue={settings.facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button onClick={handleSave} disabled={busy}>
          {busy ? "Čuva se..." : "Sačuvaj postavke"}
        </Button>
      </div>
    </div>
  );
}
