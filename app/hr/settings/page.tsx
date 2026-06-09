"use client";

import { AlertTriangle, Database, RotateCcw, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export default function HrSettingsPage() {
  const { reset } = useStore();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Настройки портала</h1>
        <p className="text-sm text-muted-foreground">
          Управление демо-данными, индексом базы знаний и доступами.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-kmg-navy" /> Локальное хранилище
          </CardTitle>
          <CardDescription>
            Всё содержимое портала хранится в localStorage браузера. Используйте кнопку ниже, чтобы
            пересоздать демо-набор.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              Сброс удалит все ваши изменения тикетов, задач и чатов с ассистентом.
            </div>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Сбросить
            </Button>
          </div>
          <Separator />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Storage key
          </div>
          <code className="rounded-lg bg-kmg-mist px-2 py-1 text-xs text-kmg-navy">
            kmg.onboarding.portal/v1
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-kmg-navy" /> Безопасность
          </CardTitle>
          <CardDescription>
            Архитектура RAG и хранения данных проходит проверку comp+sec.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Feature
            title="Active Directory SSO"
            status="В разработке"
            description="Подключение через KMG AD с MFA и кастомными ролями."
          />
          <Feature
            title="PII-фильтры"
            status="Готово"
            description="Удаление чувствительных полей до отправки в RAG."
          />
          <Feature
            title="Audit Log"
            status="Готово"
            description="Все действия HR и AI-ассистента логируются."
          />
          <Feature
            title="Защищённый контур"
            status="Roadmap"
            description="Развёртывание модели в private cloud KMG."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({
  title,
  status,
  description
}: {
  title: string;
  status: "Готово" | "В разработке" | "Roadmap";
  description: string;
}) {
  const tone =
    status === "Готово" ? "success" : status === "В разработке" ? "warning" : "info";
  return (
    <div className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-kmg-ink">{title}</div>
        <Badge variant={tone as never}>{status}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
