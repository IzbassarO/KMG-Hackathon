"use client";

import { useState } from "react";
import {
  FileBadge,
  FileCheck2,
  FileClock,
  FileSignature,
  FileText,
  FolderArchive,
  Search,
  Upload
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DocumentRecord {
  id: string;
  title: string;
  type: "nda" | "contract" | "policy" | "id" | "diploma";
  employee: string;
  status: "approved" | "pending" | "expired";
  uploadedAt: string;
}

export default function HrDocumentsPage() {
  const { state } = useStore();
  const [search, setSearch] = useState("");

  const docs: DocumentRecord[] = state.users
    .filter((u) => u.role === "employee")
    .flatMap<DocumentRecord>((emp) => [
      {
        id: `nda-${emp.id}`,
        title: "Соглашение о неразглашении (NDA)",
        type: "nda",
        employee: emp.fullName,
        status: "approved",
        uploadedAt: "5 дней назад"
      },
      {
        id: `con-${emp.id}`,
        title: "Трудовой договор",
        type: "contract",
        employee: emp.fullName,
        status: "approved",
        uploadedAt: "5 дней назад"
      },
      {
        id: `id-${emp.id}`,
        title: "Удостоверение личности",
        type: "id",
        employee: emp.fullName,
        status: "pending",
        uploadedAt: "вчера"
      },
      {
        id: `dip-${emp.id}`,
        title: "Диплом об образовании",
        type: "diploma",
        employee: emp.fullName,
        status: "pending",
        uploadedAt: "вчера"
      },
      {
        id: `coi-${emp.id}`,
        title: "Декларация COI",
        type: "policy",
        employee: emp.fullName,
        status: "expired",
        uploadedAt: "30 дней назад"
      }
    ]);

  const filtered = search
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.employee.toLowerCase().includes(search.toLowerCase())
      )
    : docs;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <FolderArchive className="h-7 w-7 text-kmg-navy" /> Документы и подписи
          </h1>
          <p className="text-sm text-muted-foreground">
            Кадровые документы, NDA, политики и проверки комплаенса в одном окне.
          </p>
        </div>
        <Button variant="accent">
          <Upload className="h-4 w-4" /> Загрузить документ
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={FileCheck2} label="Одобрено" value={docs.filter((d) => d.status === "approved").length.toString()} tone="success" />
        <StatCard icon={FileClock} label="На проверке" value={docs.filter((d) => d.status === "pending").length.toString()} tone="warning" />
        <StatCard icon={FileBadge} label="Просрочено" value={docs.filter((d) => d.status === "expired").length.toString()} tone="danger" />
        <StatCard icon={FileSignature} label="Шаблонов" value="14" tone="navy" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Реестр документов</CardTitle>
          <CardDescription>
            Каждый документ привязан к сотруднику и тикету онбординга.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по документу или сотруднику"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="approved">Одобрено</TabsTrigger>
              <TabsTrigger value="pending">На проверке</TabsTrigger>
              <TabsTrigger value="expired">Просрочено</TabsTrigger>
            </TabsList>
            {(["all", "approved", "pending", "expired"] as const).map((tab) => {
              const list =
                tab === "all"
                  ? filtered
                  : filtered.filter((d) => d.status === tab);
              return (
                <TabsContent key={tab} value={tab}>
                  <div className="overflow-x-auto rounded-2xl border border-kmg-mist">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-kmg-paper text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <th className="px-4 py-3">Документ</th>
                          <th className="px-4 py-3">Сотрудник</th>
                          <th className="px-4 py-3">Статус</th>
                          <th className="px-4 py-3">Загружено</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((doc) => (
                          <tr key={doc.id} className="border-t border-kmg-mist">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-kmg-mist text-kmg-navy">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-kmg-ink">
                                    {doc.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {doc.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-[10px]">
                                    {initials(doc.employee)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-kmg-ink">{doc.employee}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  doc.status === "approved"
                                    ? "success"
                                    : doc.status === "pending"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {doc.status === "approved"
                                  ? "Одобрено"
                                  : doc.status === "pending"
                                    ? "На проверке"
                                    : "Просрочено"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{doc.uploadedAt}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                Открыть
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {list.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-sm text-muted-foreground"
                            >
                              Документов нет.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "navy";
}) {
  const colors: Record<typeof tone, string> = {
    success: "from-emerald-500 to-emerald-400",
    warning: "from-amber-500 to-amber-400",
    danger: "from-red-500 to-red-400",
    navy: "from-kmg-navy to-kmg-navy-light"
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div
          className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${colors[tone]} text-white`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold text-kmg-ink">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
