"use client";

import { AiChat } from "@/components/shared/ai-chat";

export default function EmployeeAssistantPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">AI-Ассистент</h1>
        <p className="text-sm text-muted-foreground">
          Задайте вопрос про процессы, политики, доступы — ассистент опирается на корпоративную
          базу знаний и цитирует первоисточник.
        </p>
      </div>
      <AiChat context="employee" />
    </div>
  );
}
