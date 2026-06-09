"use client";

import { AppShell } from "@/components/shell/app-shell";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return <AppShell context="hr">{children}</AppShell>;
}
