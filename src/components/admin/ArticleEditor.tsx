import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteManagedArticle,
  saveManagedArticle,
  uploadArticleImage,
  type AdminArticle,
} from "@/lib/admin.functions";
import type { Category } from "@/lib/content.functions";
import { categoryLabels } from "@/lib/content";

const CATEGORIES = Object.keys(categoryLabels) as Category[];

function swapItems(list: string[], a: number, b: number): string[] {
  const first = list[a];
  const second = list[b];
  if (first === undefined || second === undefined) return list;
  const next = [...list];
  next[a] = second;
  next[b] = first;
  return next;
}

export function ArticleEditor({ initial = null }: { initial?: AdminArticle | null }) {
  const navigate = useNavigate();
  const save = useServerFn(saveManagedArticle);
  const upload = useServerFn(uploadArticleImage);
  const remove = useServerFn(deleteManagedArticle);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [kicker, setKicker] = useState(initial?.kicker ?? "");
  const [lead, setLead] = useState(initial?.lead ?? "");
  const [body, setBody] = useState<string[]>(initial?.body?.length ? initial.body : [""]);
  const [category, setCategory] = useState<Category>(initial?.category ?? "fudbal");
  const [author, setAuthor] = useState(initial?.author ?? "Korner redakcija");
  const [comments, setComments] = useState(String(initial?.comments ?? 0));
  const [imagePath, setImagePath] = useState<string | null>(initial?.imagePath ?? null);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isHeadline, setIsHeadline] = useState(initial?.isHeadline ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("Čitanje fajla nije uspjelo."));
        reader.readAsDataURL(file);
      });

      const result = await upload({
        data: { fileName: file.name, contentType: file.type, base64 },
      });
      setImagePath(result.path);
      toast.success("Slika je poslana.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Slanje slike nije uspjelo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      const result = await save({
        data: {
          id: initial?.id ?? null,
          slug,
          title,
          kicker,
          lead,
          body,
          category,
          imagePath,
          author,
          comments: Number(comments) || 0,
          isPublished,
          isHeadline,
          isFeatured,
        },
      });
      toast.success(initial ? "Vijest je sačuvana." : "Vijest je dodana.");
      if (!initial) navigate({ to: "/admin/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Čuvanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Obrisati ovu vijest? Ovome nema povratka.")) return;
    setBusy(true);
    try {
      await remove({ data: { id: initial.id } });
      toast.success("Vijest je obrisana.");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Brisanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="title">Naslov</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Npr. Selektor najavio sastav za Švedsku"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kicker">Oznaka iznad naslova</Label>
              <Input
                id="kicker"
                value={kicker}
                onChange={(e) => setKicker(e.target.value)}
                placeholder="Npr. Fudbal · Reprezentacija"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Adresa (opciono)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto iz naslova"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead">Uvodnik</Label>
            <Textarea
              id="lead"
              rows={3}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="Jedna do dvije rečenice koje se vide na naslovnici."
            />
          </div>

          <div className="space-y-3">
            <Label>Sadržaj</Label>
            {body.map((paragraph, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  rows={4}
                  value={paragraph}
                  onChange={(e) =>
                    setBody((prev) => prev.map((p, i) => (i === index ? e.target.value : p)))
                  }
                  placeholder="Paragraf..."
                />
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Pomjeri gore"
                    disabled={index === 0}
                    onClick={() => setBody((prev) => swapItems(prev, index - 1, index))}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Pomjeri dolje"
                    disabled={index === body.length - 1}
                    onClick={() => setBody((prev) => swapItems(prev, index + 1, index))}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Obriši paragraf"
                    disabled={body.length === 1}
                    onClick={() => setBody((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBody((prev) => [...prev, ""])}
            >
              <Plus className="size-4" /> Dodaj paragraf
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Kategorija</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {categoryLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ime koje se prikazuje ispod naslova"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Broj komentara</Label>
              <Input
                id="comments"
                type="number"
                min={0}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label>Fotografija</Label>
            {imagePath ? (
              <div className="relative">
                <img
                  src={`/api/public/slike/${imagePath}`}
                  alt="Pregled fotografije"
                  className="aspect-video w-full rounded-md object-cover"
                />
                <button
                  type="button"
                  aria-label="Ukloni fotografiju"
                  onClick={() => setImagePath(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Nema fotografije
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" /> {uploading ? "Šaljem..." : "Izaberi sliku"}
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Objavljeno</p>
                <p className="text-xs text-muted-foreground">Vidljivo na sajtu</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Glavna vijest</p>
                <p className="text-xs text-muted-foreground">Velika slika na vrhu</p>
              </div>
              <Switch checked={isHeadline} onCheckedChange={setIsHeadline} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Istaknuto</p>
                <p className="text-xs text-muted-foreground">Manje pločice ispod</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button onClick={handleSave} disabled={busy}>
          {busy ? "Čuva se..." : "Sačuvaj"}
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/admin" })} disabled={busy}>
          Nazad na listu
        </Button>
        {initial && (
          <Button
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="size-4" /> Obriši
          </Button>
        )}
      </div>
    </div>
  );
}
