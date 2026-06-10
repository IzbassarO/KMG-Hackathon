"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { DigitalBuddy } from "@/components/buddy/digital-buddy";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function AppShell({
  context,
  children
}: {
  context: "hr" | "employee";
  children: React.ReactNode;
}) {
  const { currentUser, state } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!state.hydrated) return;
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== context) {
      router.replace(currentUser.role === "hr" ? "/hr/dashboard" : "/employee/dashboard");
    }
  }, [currentUser, context, router, state.hydrated]);

  if (!state.hydrated || !currentUser || currentUser.role !== context) {
    return (
      <div className="grid min-h-screen place-items-center gradient-paper">
        <div className="flex flex-col items-center gap-3 text-kmg-navy">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Загружаем рабочее пространство...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-kmg-paper">
      <Sidebar context={context} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar context={context} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
      {context === "employee" && <DigitalBuddy />}
    </div>
  );
}
