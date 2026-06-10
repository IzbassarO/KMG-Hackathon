"use client";

import { Bell, Check, Languages, Moon, RotateCcw, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { usePreferences } from "@/components/providers/preferences";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function EmployeeSettingsPage() {
  const { reset } = useStore();
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-kmg-navy" /> {t("settings.notifications")}
            </CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value="✓" />
            <Row label="Push" value="✓" />
            <Row label="Digital Buddy" value="✓" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-kmg-navy" /> {t("settings.language")}
            </CardTitle>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors",
                  l.code === locale
                    ? "border-kmg-navy bg-kmg-navy/5 font-semibold text-kmg-navy"
                    : "border-kmg-mist hover:border-kmg-navy/40"
                )}
              >
                {l.code === locale && <Check className="h-3.5 w-3.5" />}
                {l.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-kmg-navy" /> {t("settings.theme")}
            </CardTitle>
            <CardDescription>{t("settings.themeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <ThemeButton
              active={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-4 w-4" />}
              label={t("top.themeLight")}
            />
            <ThemeButton
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-4 w-4" />}
              label={t("top.themeDark")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-kmg-navy" /> {t("settings.reset")}
            </CardTitle>
            <CardDescription>{t("settings.resetDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> {t("settings.resetBtn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        active
          ? "border-kmg-navy bg-kmg-navy/5 font-semibold text-kmg-navy"
          : "border-kmg-mist hover:border-kmg-navy/40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-kmg-mist px-3 py-2">
      <span>{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}
