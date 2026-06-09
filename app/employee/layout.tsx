"use client";

import { AppShell } from "@/components/shell/app-shell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell context="employee">{children}</AppShell>;
}
