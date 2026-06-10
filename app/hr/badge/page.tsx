"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Printer,
  Send,
  Upload,
  Wand2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { usePreferences, useT } from "@/components/providers/preferences";
import { cn, initials } from "@/lib/utils";

/** Рисует бейдж на canvas в стиле сервиса Badge Office (тёмно-синий + голубая полоса). */
function drawBadge(
  canvas: HTMLCanvasElement,
  d: { fio: string; position?: string; department?: string; pass: string; role: string },
  img: HTMLImageElement
) {
  const W = 510;
  const H = 324; // 85×54 мм
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#1A3A52";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0099CC";
  ctx.fillRect(0, 0, W, 56);
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 19px Inter, Arial, sans-serif";
  ctx.fillText("КАЗМУНАЙГАЗ", 22, 29);
  ctx.font = "11px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "right";
  ctx.fillText(d.pass, W - 22, 29);
  ctx.textAlign = "left";

  const px = 26;
  const py = 82;
  const pw = 126;
  const ph = 168;
  ctx.fillStyle = "#0e2438";
  ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
  const ar = img.width / img.height;
  const br = pw / ph;
  let sw: number, sh: number, sx: number, sy: number;
  if (ar > br) {
    sh = img.height;
    sw = sh * br;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / br;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  const tx = px + pw + 24;
  const maxW = W - tx - 22;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 25px Inter, Arial, sans-serif";
  const words = d.fio.split(" ");
  let line = "";
  let ly = py + 22;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, tx, ly);
      line = w;
      ly += 32;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, tx, ly);

  ctx.fillStyle = "#cfd8e3";
  ctx.font = "15px Inter, Arial, sans-serif";
  ctx.fillText(d.position || d.role, tx, py + ph - 40);
  if (d.department) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "13px Inter, Arial, sans-serif";
    ctx.fillText(d.department, tx, py + ph - 16);
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  let bx = tx;
  for (let i = 0; i < 46 && bx < W - 22; i++) {
    const bw = (i % 3) + 1;
    if (i % 2 === 0) ctx.fillRect(bx, H - 26, bw, 14);
    bx += bw + 2;
  }
}

interface DocState {
  consent: string | null;
  memo: string | null;
  id: string | null;
}

export default function BadgeCenterPage() {
  const { state, currentUser, helpers } = useStore();
  const { t, locale } = usePreferences();
  const employees = state.users.filter((u) => u.role === "employee");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocState>({ consent: null, memo: null, id: null });
  const [badgeDataUrl, setBadgeDataUrl] = useState<string | null>(null);
  const [issued, setIssued] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const emp = state.users.find((u) => u.id === employeeId);
  const existing = employeeId ? helpers.getBadge(employeeId) : undefined;

  useEffect(() => {
    if (!photoSrc || !emp) {
      setBadgeDataUrl(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawBadge(
        canvas,
        {
          fio: emp.fullName,
          position: emp.position,
          department: emp.department,
          pass: t("badge.pass"),
          role: t("badge.employeeRole")
        },
        img
      );
      setBadgeDataUrl(canvas.toDataURL("image/png"));
    };
    img.onerror = () => setBadgeDataUrl(null);
    img.src = photoSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSrc, employeeId, locale]);

  if (!currentUser) return null;

  function onPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoSrc(reader.result as string);
    reader.readAsDataURL(file);
    setIssued(false);
  }

  function prefill() {
    setPhotoSrc("/badge-samples/photo.png");
    setDocs({ consent: "consent.pdf", memo: "memo.pdf", id: "id.png" });
    setIssued(false);
  }

  function reset() {
    setPhotoSrc(null);
    setDocs({ consent: null, memo: null, id: null });
    setBadgeDataUrl(null);
    setIssued(false);
  }

  function download() {
    if (!badgeDataUrl || !emp) return;
    const a = document.createElement("a");
    a.href = badgeDataUrl;
    a.download = `badge_${emp.fullName.replace(/\s+/g, "_")}.png`;
    a.click();
  }

  function print() {
    if (!badgeDataUrl) return;
    const w = window.open("", "_blank", "width=420,height=320");
    if (!w) return;
    w.document.write(
      `<title>Badge</title><body style="margin:0;display:grid;place-items:center;height:100vh"><img src="${badgeDataUrl}" style="width:85mm;height:54mm" onload="window.print()"/></body>`
    );
    w.document.close();
  }

  function issue() {
    if (!badgeDataUrl || !emp) return;
    helpers.issueBadge({
      employeeId: emp.id,
      fio: emp.fullName,
      position: emp.position,
      department: emp.department,
      documents: { consent: !!docs.consent, memo: !!docs.memo, id: !!docs.id },
      badgeDataUrl,
      issuedAt: new Date().toISOString()
    });
    setIssued(true);
  }

  const canIssue = Boolean(badgeDataUrl) && Boolean(docs.memo);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <CreditCard className="h-7 w-7 text-kmg-navy" /> Badge Center
          </h1>
          <p className="text-sm text-muted-foreground">{t("badge.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={prefill}>
          <Wand2 className="h-4 w-4" /> {t("badge.prefill")}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-sm text-muted-foreground">{t("badge.employee")}</span>
          {employees.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setEmployeeId(u.id);
                setIssued(false);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors",
                u.id === employeeId
                  ? "border-kmg-navy bg-kmg-navy/5 font-semibold text-kmg-navy"
                  : "border-kmg-mist hover:border-kmg-navy/40"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">{initials(u.fullName)}</AvatarFallback>
              </Avatar>
              {u.fullName}
              {helpers.getBadge(u.id) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("badge.docsTitle")}</CardTitle>
            <CardDescription>{t("badge.docsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PhotoUpload src={photoSrc} onPick={onPhoto} />
            <DocUpload
              label={t("badge.consent")}
              hint={t("badge.hintPdf")}
              value={docs.consent}
              onPick={(f) => setDocs((p) => ({ ...p, consent: f }))}
            />
            <DocUpload
              label={t("badge.memo")}
              hint={t("badge.hintMemo")}
              value={docs.memo}
              onPick={(f) => setDocs((p) => ({ ...p, memo: f }))}
            />
            <DocUpload
              label={t("badge.idDoc")}
              hint={t("badge.hintId")}
              value={docs.id}
              onPick={(f) => setDocs((p) => ({ ...p, id: f }))}
            />
            <Button variant="ghost" size="sm" onClick={reset} className="w-full">
              {t("badge.clear")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>{t("badge.previewTitle")}</CardTitle>
              <CardDescription>{t("badge.previewDesc")}</CardDescription>
            </div>
            {issued && (
              <Badge variant="success">
                <Check className="h-3.5 w-3.5" /> {t("badge.issued")}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid aspect-[510/324] w-full place-items-center overflow-hidden rounded-2xl border border-kmg-mist bg-kmg-paper">
              {badgeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badgeDataUrl} alt="Badge" className="h-full w-full object-contain" />
              ) : existing?.badgeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existing.badgeDataUrl} alt="Badge" className="h-full w-full object-contain" />
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <CreditCard className="mx-auto mb-2 h-10 w-10 text-kmg-navy/30" />
                  {t("badge.emptyPreview")}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={download} disabled={!badgeDataUrl}>
                <Download className="h-4 w-4" /> {t("badge.download")}
              </Button>
              <Button variant="outline" onClick={print} disabled={!badgeDataUrl}>
                <Printer className="h-4 w-4" /> {t("badge.print")}
              </Button>
              <Button variant="accent" onClick={issue} disabled={!canIssue} className="ml-auto">
                <Send className="h-4 w-4" /> {t("badge.issue")}
              </Button>
            </div>
            {!docs.memo && badgeDataUrl && (
              <p className="text-xs text-amber-600">{t("badge.memoRequired")}</p>
            )}
            {issued && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {t("badge.issuedMsg")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PhotoUpload({ src, onPick }: { src: string | null; onPick: (f: File | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const t = useT();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-kmg-mist p-3">
      <div className="grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-kmg-mist bg-kmg-paper">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Photo" className="h-full w-full object-cover" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-kmg-ink">{t("badge.photo")}</div>
        <div className="text-xs text-muted-foreground">
          {src ? t("badge.uploaded") : t("badge.photoHint")}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
        {t("badge.choose")}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </div>
  );
}

function DocUpload({
  label,
  hint,
  value,
  onPick
}: {
  label: string;
  hint: string;
  value: string | null;
  onPick: (filename: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const t = useT();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-kmg-mist p-3">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          value ? "bg-emerald-50 text-emerald-600" : "bg-kmg-mist text-kmg-navy"
        )}
      >
        {value ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-kmg-ink">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{value ?? hint}</div>
      </div>
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
        {value ? t("badge.replace") : t("badge.choose")}
      </Button>
      <input
        ref={ref}
        type="file"
        accept=".pdf,image/*"
        hidden
        onChange={(e) => onPick(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}
