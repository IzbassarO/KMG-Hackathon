"use client";

import { AlertTriangle, Brain, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/charts/sparkline";
import { getSentiment, SENTIMENT_META } from "@/lib/sentiment";

export function SentimentCard({ userId }: { userId: string }) {
  const s = getSentiment(userId);
  const meta = SENTIMENT_META[s.label];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-kmg-navy" /> Sentiment-анализ (AI)
          </CardTitle>
          <CardDescription>
            Тональность переписки с Digital Buddy · проанализировано {s.messagesAnalyzed} сообщений
          </CardDescription>
        </div>
        {s.atRisk ? (
          <Badge variant="danger">
            <AlertTriangle className="h-3.5 w-3.5" /> Зона риска
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle2 className="h-3.5 w-3.5" /> По плану
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-4xl font-semibold text-kmg-ink">
            {s.score}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <Badge variant={meta.badge}>{meta.ru} тональность</Badge>
        </div>

        <div className="space-y-1.5">
          <DistBar label="Позитив" value={s.positive} color="bg-emerald-500" />
          <DistBar label="Нейтрально" value={s.neutral} color="bg-sky-500" />
          <DistBar label="Негатив" value={s.negative} color="bg-red-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Вовлечённость" value={`${s.engagement}%`} />
          <Stat label="Тревожность" value={`${s.anxiety}%`} />
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
            Динамика тональности · 8 недель
          </div>
          <div className="w-full overflow-hidden">
            <Sparkline values={s.trend} width={520} height={84} color={meta.color} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs uppercase tracking-widest text-muted-foreground">Сигналы</div>
          <ul className="space-y-1.5">
            {s.signals.map((sig) => (
              <li key={sig} className="flex items-start gap-2 text-sm text-kmg-ink/90">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.bar}`} />
                {sig}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Агрегированный анализ тональности, без раскрытия личной переписки (ТЗ §5.4).
        </p>
      </CardContent>
    </Card>
  );
}

function DistBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-kmg-mist">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-kmg-navy">{value}%</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-kmg-mist bg-white p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-kmg-ink">{value}</div>
    </div>
  );
}
