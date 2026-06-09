"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  Download,
  FileSignature,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "verified" | "pending";
}

const checklist = [
  { title: "Удостоверение личности", description: "PDF или JPG, обе стороны", status: "verified" },
  { title: "Диплом об образовании", description: "Скан в высоком разрешении", status: "verified" },
  { title: "Медицинская справка (086/у)", description: "Срок действия — 6 месяцев", status: "pending" },
  { title: "ИИН и СИК", description: "Можно одной справкой из ЦОН", status: "pending" },
  { title: "Военный билет", description: "Только для мужчин", status: "optional" }
];

const templates = [
  { title: "Заявление о приёме", description: "Шаблон с автозаполнением" },
  { title: "Согласие на обработку данных", description: "GDPR + KZ ПП №1023" },
  { title: "Декларация COI", description: "Конфликт интересов" }
];

export default function EmployeeDocumentsPage() {
  const { helpers } = useStore();
  const [docs, setDocs] = useState<UploadedDoc[]>([
    { id: uid("d"), name: "id_kenzhebekov.pdf", size: "2.4 МБ", status: "verified" },
    { id: uid("d"), name: "diploma.pdf", size: "4.1 МБ", status: "verified" },
    { id: uid("d"), name: "med_form_086.pdf", size: "0.9 МБ", status: "pending" }
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  function simulateUpload(file: File) {
    const newDoc: UploadedDoc = {
      id: uid("d"),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} МБ`,
      status: "uploading"
    };
    setDocs((prev) => [newDoc, ...prev]);
    helpers.logActivity({
      actorId: "self",
      actorName: "Я",
      message: `Загрузил документ «${file.name}»`,
      type: "task"
    });
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) => (d.id === newDoc.id ? { ...d, status: "pending" } : d))
      );
    }, 1400);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(simulateUpload);
  }

  const progress = Math.round(
    (checklist.filter((c) => c.status === "verified").length / checklist.length) * 100
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Мои документы</h1>
        <p className="text-sm text-muted-foreground">
          Все сканы и подписи в одном месте. Файлы хранятся в защищённом контуре KMG.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогресс пакета</CardTitle>
          <CardDescription>{progress}% документов загружено и проверено.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка</CardTitle>
            <CardDescription>
              Перетащите файлы в зону или выберите вручную. Максимум 10 МБ на файл.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-kmg-navy/30 bg-kmg-navy/5 p-8 text-center transition-colors hover:border-kmg-navy"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-kmg-navy text-white shadow-elevated">
                <CloudUpload className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-kmg-ink">
                Перетащите файлы или нажмите для выбора
              </div>
              <div className="text-xs text-muted-foreground">PDF, JPG, PNG · до 10 МБ</div>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </button>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-kmg-mist p-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-kmg-mist text-kmg-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-kmg-ink">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.size}</div>
                  </div>
                  {doc.status === "uploading" && (
                    <Badge variant="info">
                      <Loader2 className="h-3 w-3 animate-spin" /> Загрузка
                    </Badge>
                  )}
                  {doc.status === "pending" && <Badge variant="warning">На проверке</Badge>}
                  {doc.status === "verified" && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Проверено
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-kmg-navy" /> Чек-лист
            </CardTitle>
            <CardDescription>Какие документы ещё нужно загрузить.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-kmg-mist p-3"
              >
                <div className="mt-1">
                  {item.status === "verified" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : item.status === "pending" ? (
                    <Loader2 className="h-4 w-4 text-amber-600" />
                  ) : (
                    <FileSignature className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-kmg-ink">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <Badge
                  variant={
                    item.status === "verified"
                      ? "success"
                      : item.status === "pending"
                        ? "warning"
                        : "outline"
                  }
                >
                  {item.status === "verified"
                    ? "Готово"
                    : item.status === "pending"
                      ? "Нужно"
                      : "Опц."}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Шаблоны и формы</CardTitle>
          <CardDescription>Готовые образцы для скачивания.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.title}
              className="flex flex-col gap-3 rounded-2xl border border-kmg-mist bg-kmg-paper p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-navy text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-kmg-ink">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
              <Button variant="outline" size="sm" className="w-fit">
                <Download className="h-4 w-4" /> Скачать
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
