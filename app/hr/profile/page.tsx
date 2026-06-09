"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { initials, formatDate } from "@/lib/utils";

export default function HrProfilePage() {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Профиль</h1>
      <Card>
        <CardHeader>
          <CardTitle>Личные данные</CardTitle>
          <CardDescription>Доступно только владельцу аккаунта.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{initials(currentUser.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-semibold text-kmg-ink">{currentUser.fullName}</div>
            <div className="text-sm text-muted-foreground">{currentUser.position}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="navy">{currentUser.department}</Badge>
              <Badge variant="outline">{currentUser.email}</Badge>
              {currentUser.startDate && (
                <Badge variant="secondary">с {formatDate(currentUser.startDate)}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
