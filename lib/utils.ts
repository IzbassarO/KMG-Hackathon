import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date, locale = "ru-RU") {
  const date = new Date(input);
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function formatDateTime(input: string | number | Date, locale = "ru-RU") {
  const date = new Date(input);
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function percent(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}
