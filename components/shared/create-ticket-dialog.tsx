"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Flow, Ticket, TicketCategory, TicketPriority } from "@/lib/types";
import { Sparkles, Plus, Trash2 } from "lucide-react";

const categories: { value: TicketCategory; label: string }[] = [
  { value: "documents", label: "Документы" },
  { value: "access", label: "Доступы" },
  { value: "training", label: "Обучение" },
  { value: "equipment", label: "Оборудование" },
  { value: "compliance", label: "Комплаенс" },
  { value: "culture", label: "Культура" },
  { value: "mentorship", label: "Наставничество" }
];

const priorities: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

interface DraftStep {
  id: string;
  title: string;
  description: string;
  type: "task" | "approval" | "milestone";
  role: "hr" | "employee";
  days: number;
}

const defaultSteps: DraftStep[] = [
  {
    id: uid("st"),
    title: "Подготовка документов",
    description: "Собрать необходимые документы и загрузить в систему.",
    type: "task",
    role: "employee",
    days: 1
  },
  {
    id: uid("st"),
    title: "Проверка HR",
    description: "HR подтверждает корректность пакета.",
    type: "approval",
    role: "hr",
    days: 1
  },
  {
    id: uid("st"),
    title: "Завершено",
    description: "Этап закрыт.",
    type: "milestone",
    role: "hr",
    days: 0
  }
];

export function CreateTicketDialog({ trigger }: { trigger: React.ReactNode }) {
  const { state, helpers } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<TicketCategory>("documents");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(
    state.users.find((u) => u.role === "employee")?.id ?? ""
  );
  const [ownerId, setOwnerId] = useState<string>(
    state.users.find((u) => u.role === "hr")?.id ?? ""
  );
  const [dueOffset, setDueOffset] = useState(7);
  const [steps, setSteps] = useState<DraftStep[]>(defaultSteps);
  const [tagsInput, setTagsInput] = useState("");

  function buildFlow(): Flow {
    const prefix = uid("flw");
    const nodes = [
      {
        id: `${prefix}-start`,
        type: "start" as const,
        title: "Старт онбординга",
        description: "Тикет назначен",
        position: { x: 80, y: 220 }
      },
      ...steps.map((step, idx) => ({
        id: `${prefix}-${idx + 1}`,
        type: step.type,
        title: step.title,
        description: step.description,
        assigneeRole: step.role,
        estimateDays: step.days,
        status: "pending" as const,
        position: { x: 80 + (idx + 1) * 260, y: idx % 2 === 0 ? 140 : 300 }
      })),
      {
        id: `${prefix}-end`,
        type: "end" as const,
        title: "Готово",
        description: "Этап завершён",
        position: { x: 80 + (steps.length + 1) * 260, y: 220 }
      }
    ];

    const edges = [
      { id: `${prefix}-e0`, source: `${prefix}-start`, target: `${prefix}-1`, variant: "default" as const },
      ...steps.slice(0, -1).map((_, i) => ({
        id: `${prefix}-e${i + 1}`,
        source: `${prefix}-${i + 1}`,
        target: `${prefix}-${i + 2}`,
        variant: "default" as const
      })),
      {
        id: `${prefix}-eEnd`,
        source: `${prefix}-${steps.length}`,
        target: `${prefix}-end`,
        variant: "success" as const
      }
    ];

    return { nodes, edges };
  }

  function reset() {
    setTitle("");
    setSummary("");
    setCategory("documents");
    setPriority("medium");
    setDueOffset(7);
    setSteps(defaultSteps);
    setTagsInput("");
  }

  function submit() {
    if (!title.trim()) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueOffset);
    const ticketDraft: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "code"> = {
      title: title.trim(),
      summary: summary.trim() || "Без описания",
      category,
      priority,
      status: "draft",
      assigneeId,
      ownerId,
      badges: [
        { label: priority.toUpperCase(), tone: priority === "critical" ? "danger" : "gold" },
        { label: `${dueOffset} дн.`, tone: "navy" }
      ],
      dueDate: dueDate.toISOString(),
      progress: 0,
      flow: buildFlow(),
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    };
    helpers.createTicket(ticketDraft);
    reset();
    setOpen(false);
  }

  function updateStep(id: string, patch: Partial<DraftStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        id: uid("st"),
        title: "Новый шаг",
        description: "",
        type: "task",
        role: "employee",
        days: 1
      }
    ]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[92vw] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-kmg-gold" /> Новый flowchart-тикет
          </DialogTitle>
          <DialogDescription>
            Опишите процесс адаптации: шаги, ответственных и сроки. Узлы автоматически попадут в
            flowchart.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              placeholder="Например, Welcome-pack и знакомство с командой"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">Краткое описание</Label>
            <Textarea
              id="summary"
              rows={2}
              placeholder="Что включает этап и кому полезен"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Категория</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Срок (дни)</Label>
              <Input
                type="number"
                min={1}
                value={dueOffset}
                onChange={(e) => setDueOffset(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Исполнитель</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  {state.users
                    .filter((u) => u.role === "employee")
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Куратор</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="HR" />
                </SelectTrigger>
                <SelectContent>
                  {state.users
                    .filter((u) => u.role === "hr")
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Теги (через запятую)</Label>
            <Input
              placeholder="welcome, hse, mentor"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-kmg-ink">Шаги процесса</div>
                <div className="text-xs text-muted-foreground">
                  Каждый шаг превратится в узел flowchart и задачу.
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4" /> Шаг
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="grid gap-2 rounded-xl border border-kmg-mist bg-white p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="navy">Шаг {idx + 1}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder="Название шага"
                  />
                  <Textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                    placeholder="Что делает исполнитель на этом шаге"
                  />
                  <div className="grid gap-2 md:grid-cols-3">
                    <Select
                      value={step.type}
                      onValueChange={(v) =>
                        updateStep(step.id, { type: v as DraftStep["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={step.role}
                      onValueChange={(v) =>
                        updateStep(step.id, { role: v as DraftStep["role"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="employee">Сотрудник</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      value={step.days}
                      onChange={(e) =>
                        updateStep(step.id, { days: Number(e.target.value) || 0 })
                      }
                      placeholder="Дни"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="accent" onClick={submit} disabled={!title.trim()}>
            Создать тикет
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
