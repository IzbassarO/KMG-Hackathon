"use client";

import { AiChat } from "@/components/shared/ai-chat";

export default function HrAssistantPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">AI-Куратор</h1>
        <p className="text-sm text-muted-foreground">
          Спрашивайте про шаблоны тикетов, политики и метрики онбординга — ассистент опирается на
          корпоративную базу знаний.
        </p>
      </div>
      <AiChat context="hr" />
    </div>
  );
}
