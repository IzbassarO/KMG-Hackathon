"use client";

import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageThemeSwitcher() {
  const { locale, setLocale, theme, toggleTheme, t } = usePreferences();
  const current = LOCALES.find((l) => l.code === locale);

  return (
    <>
      <Button variant="ghost" size="icon" aria-label={t("top.theme")} onClick={toggleTheme}>
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("top.language")}>
            <span className="text-xs font-semibold tracking-wide">{current?.short ?? "RU"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {LOCALES.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => setLocale(l.code)}
              className={cn("gap-2", l.code === locale && "font-semibold text-kmg-navy")}
            >
              <span className="w-7 text-xs text-muted-foreground">{l.short}</span>
              {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
