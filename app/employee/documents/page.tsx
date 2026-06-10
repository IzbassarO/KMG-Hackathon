"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  Clock3,
  FileSignature,
  FileText,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

type DocStatus = "confirmed" | "waiting" | "missing" | "optional";

interface ChecklistItem {
  title: string;
  description: string;
  status: DocStatus;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "waiting";
}

const STATUS_META: Record<DocStatus, { label: string; variant: "success" | "warning" | "danger" | "outline" }> = {
  confirmed: { label: "Подтверждено", variant: "success" },
  waiting: { label: "На проверке", variant: "warning" },
  missing: { label: "Не загружено", variant: "danger" },
  optional: { label: "Опционально", variant: "outline" }
};

const initialChecklist: ChecklistItem[] = [
  { title: "Удостоверение личности", description: "PDF или JPG, обе стороны", status: "confirmed" },
  { title: "Диплом об образовании", description: "Скан в высоком разрешении", status: "confirmed" },
  { title: "Медицинская справка (086/у)", description: "Отправлена, ожидает проверки HR", status: "waiting" },
  { title: "ИИН и СИК", description: "Можно одной справкой из ЦОН", status: "missing" },
  { title: "Военный билет", description: "Только для мужчин", status: "optional" }
];

export default function EmployeeDocumentsPage() {
  const { helpers } = useStore();
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
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
      setDocs((prev) => prev.map((d) => (d.id === newDoc.id ? { ...d, status: "waiting" } : d)));
    }, 1400);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(simulateUpload);
  }

  const counts = initialChecklist.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<DocStatus, number>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Мои документы</h1>
        <p className="text-sm text-muted-foreground">
          Что уже подтверждено, что на проверке и что ещё нужно загрузить. Файлы хранятся в
          защищённом контуре KMG.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="success">Подтверждено · {counts.confirmed ?? 0}</Badge>
        <Badge variant="warning">На проверке · {counts.waiting ?? 0}</Badge>
        <Badge variant="danger">Не загружено · {counts.missing ?? 0}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Статус документов</CardTitle>
            <CardDescription>Чек-лист пакета документов первого дня.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {initialChecklist.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-kmg-mist p-3"
                >
                  <div className="mt-1">
                    {item.status === "confirmed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : item.status === "waiting" ? (
                      <Clock3 className="h-4 w-4 text-amber-600" />
                    ) : (
                      <FileSignature className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-kmg-ink">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Загрузка</CardTitle>
            <CardDescription>
              Перетащите файлы в зону или выберите вручную. До 10 МБ на файл.
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
            {docs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Недавно загруженные
                </div>
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
                    {doc.status === "uploading" ? (
                      <Badge variant="info">
                        <Loader2 className="h-3 w-3 animate-spin" /> Загрузка
                      </Badge>
                    ) : (
                      <Badge variant="warning">На проверке</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
