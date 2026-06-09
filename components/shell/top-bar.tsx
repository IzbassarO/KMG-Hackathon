"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { NotificationsSheet } from "@/components/shared/notifications-sheet";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function TopBar({ context }: { context: "hr" | "employee" }) {
  const { currentUser, signOut, state } = useStore();
  const unread = state.activity.length;

  return (
    <header className="sticky top-0 z-30 border-b border-kmg-mist/80 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Меню">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar context={context} mobile />
            </SheetContent>
          </Sheet>
          <Badge variant="navy" className="hidden md:inline-flex">
            {context === "hr" ? "HR Console" : "Employee Workspace"}
          </Badge>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск тикетов, сотрудников, статей..."
              className="w-[300px] pl-9 xl:w-[360px]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsSheet
            trigger={
              <Button variant="ghost" size="icon" aria-label="Уведомления" className="relative">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-kmg-gold px-1 text-[10px] font-semibold text-white">
                    {Math.min(unread, 9)}
                  </span>
                )}
              </Button>
            }
          />
          <Button variant="ghost" size="icon" aria-label="Настройки" asChild>
            <Link href={`/${context}/settings`}>
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-kmg-mist bg-white px-2 py-1 transition hover:border-kmg-navy/40">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(currentUser?.fullName ?? "KMG")}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left text-sm leading-tight md:block">
                  <div className="font-semibold text-kmg-ink">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentUser?.position}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>{currentUser?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${context}/profile`}>Профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${context}/settings`}>Настройки</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="h-4 w-4" /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
